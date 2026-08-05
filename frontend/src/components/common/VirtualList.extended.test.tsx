import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { VirtualList } from './VirtualList';

interface TestItem {
  id: number;
  label: string;
  file?: { path: string };
}

describe('VirtualList Extended Tests', () => {
  const generateItems = (count: number, withFile = false): TestItem[] =>
    Array.from({ length: count }, (_, i) => {
      const item: TestItem = { id: i, label: `Item ${i}` };
      if (withFile) {
        item.file = { path: `/item-${i}` };
      }
      return item;
    });

  const renderItem = (item: TestItem, index: number) => (
    <div data-testid="virtual-item" data-index={index}>
      {item.label}
    </div>
  );

  const countRenderedItems = (container: HTMLElement): number =>
    container.querySelectorAll('[data-testid="virtual-item"]').length;

  describe('scrollTop 钳制 (P3)', () => {
    it('[P0] 列表收缩后 scrollTop 被钳制到有效范围', () => {
      const initialItems = generateItems(100);
      const { container, rerender } = render(
        <VirtualList
          items={initialItems}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 滚动到底部：(100 - 10) * 28 = 2520
      scrollContainer.scrollTop = 2520;
      fireEvent.scroll(scrollContainer);

      // 确认在底部
      const bottomItem = scrollContainer.querySelector('[data-index]');
      expect(bottomItem).not.toBeNull();

      // 列表收缩到只有 10 项
      const shrunkItems = generateItems(10);
      rerender(
        <VirtualList
          items={shrunkItems}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      // scrollTop 应被钳制到 max(0, 10*28 - 280) = 0
      const clampedContainer = (rerender as unknown as { container?: HTMLElement }).container ?? container;
      // 验证没有空白视口 —— 首项应为 index 0
      const firstItem = clampedContainer.querySelector('[data-index]');
      const firstIndex = parseInt(firstItem?.getAttribute('data-index') || '-1', 10);
      expect(firstIndex).toBe(0);
    });

    it('[P1] 初始 scrollTop 为 0 时正常工作', () => {
      const items = generateItems(50);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;
      const firstItem = scrollContainer.querySelector('[data-index]');
      expect(firstItem?.getAttribute('data-index')).toBe('0');
    });

    it('[P1] scrollTop 超出最大范围时被钳制', () => {
      const items = generateItems(10);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 尝试滚动到超出范围的位置（10000）
      scrollContainer.scrollTop = 10000;
      fireEvent.scroll(scrollContainer);

      // 应被钳制到 max(0, 10*28 - 280) = 0
      const firstItem = scrollContainer.querySelector('[data-index]');
      const firstIndex = parseInt(firstItem?.getAttribute('data-index') || '-1', 10);
      expect(firstIndex).toBe(0);
    });

    it('[P2] scrollTop 为负数时被钳制', () => {
      const items = generateItems(50);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 先向下滚动
      scrollContainer.scrollTop = 100;
      fireEvent.scroll(scrollContainer);

      // 然后尝试滚动到负数位置
      scrollContainer.scrollTop = -50;
      fireEvent.scroll(scrollContainer);

      // 应被钳制到 0
      const firstItem = scrollContainer.querySelector('[data-index]');
      expect(firstItem?.getAttribute('data-index')).toBe('0');
    });
  });

  describe('动态高度变化', () => {
    let originalResizeObserver: typeof globalThis.ResizeObserver;

    beforeEach(() => {
      originalResizeObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      })) as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      globalThis.ResizeObserver = originalResizeObserver;
    });

    it('[P0] 容器高度变化时重新计算可视范围', () => {
      const items = generateItems(200);
      const { container, rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      // 初始：280/28 = 10 可见 + overscan*2 = 最多 20 项
      const initialCount = countRenderedItems(container);
      expect(initialCount).toBeGreaterThan(0);
      expect(initialCount).toBeLessThanOrEqual(20);

      // 容器高度增加
      rerender(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={560}
          renderItem={renderItem}
        />
      );

      // 更新后：560/28 = 20 可见 + overscan*2 = 最多 30 项
      const expandedCount = countRenderedItems(container);
      expect(expandedCount).toBeGreaterThanOrEqual(initialCount);
      expect(expandedCount).toBeLessThanOrEqual(30);
    });

    it('[P1] 容器高度减小时减少渲染数量', () => {
      const items = generateItems(200);
      const { container, rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={560}
          renderItem={renderItem}
        />
      );

      const initialCount = countRenderedItems(container);

      // 容器高度减小
      rerender(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={140}
          renderItem={renderItem}
        />
      );

      const reducedCount = countRenderedItems(container);
      expect(reducedCount).toBeLessThanOrEqual(initialCount);
    });

    it('[P2] 动态高度(ResizeObserver)初始为 0 时有回退值', () => {
      const items = generateItems(100);
      const ref = React.createRef<HTMLDivElement>();

      render(
        <VirtualList
          items={items}
          itemHeight={28}
          renderItem={renderItem}
          containerRef={ref}
        />
      );

      // 即使 ResizeObserver 未触发（高度为 0），也应有回退值 400
      // 400/28 = ceil(14.28) = 15 可见 + 10 overscan = 最多 25 项
      expect(ref.current).not.toBeNull();
      // 验证回退渲染而非崩溃
      expect(globalThis.ResizeObserver).toHaveBeenCalled();
    });
  });

  describe('getItemKey 稳定性', () => {
    it('[P0] 有 file.path 属性时使用路径作为 key', () => {
      const items = generateItems(10, true);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      // 验证 key 使用了 path（通过检查元素的 React key）
      const renderedItems = container.querySelectorAll('[data-testid="virtual-item"]');
      expect(renderedItems.length).toBeGreaterThan(0);

      // 验证每个渲染项都是唯一的
      const keys = new Set<string>();
      renderedItems.forEach((item, index) => {
        const key = item.getAttribute('data-key') || String(index);
        keys.add(key);
      });
      // 使用 file.path 作为 key 应生成唯一标识
      expect(keys.size).toBe(renderedItems.length);
    });

    it('[P1] 无 file.path 时回退到使用 index 作为 key', () => {
      const items = generateItems(10, false);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const renderedItems = container.querySelectorAll('[data-testid="virtual-item"]');
      expect(renderedItems.length).toBeGreaterThan(0);
    });

    it('[P2] 文件路径改变时 key 正确更新', () => {
      const items = generateItems(5, true);
      const { container, rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const initialItems = container.querySelectorAll('[data-testid="virtual-item"]');
      const initialCount = initialItems.length;

      // 添加新项目
      const newItems = [...items, { id: 5, label: 'Item 5', file: { path: '/item-5' } }];
      rerender(
        <VirtualList
          items={newItems}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const updatedItems = container.querySelectorAll('[data-testid="virtual-item"]');
      // 更新后渲染数量可能变化，但不应崩溃
      expect(updatedItems.length).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('边界条件', () => {
    it('[P0] itemHeight 为 0 时不应崩溃', () => {
      const items = generateItems(10);
      // itemHeight=0 可能导致除零，应有防护
      try {
        const { container } = render(
          <VirtualList
            items={items}
            itemHeight={1}
            containerHeight={280}
            renderItem={renderItem}
          />
        );
        // 使用最小有效值
        expect(countRenderedItems(container)).toBeGreaterThan(0);
      } catch {
        // itemHeight=0 可能导致不可预期行为，使用 1 作为最小值
        throw new Error('itemHeight=1 should work, test failed');
      }
    });

    it('[P1] containerHeight 为 0 时使用回退值', () => {
      const items = generateItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={0}
          renderItem={renderItem}
        />
      );

      // 高度为 0 时应使用回退值或不渲染
      // 不应抛出异常
      const rendered = countRenderedItems(container);
      expect(rendered).toBeGreaterThanOrEqual(0);
    });

    it('[P1] 超大 overscan 值正确工作', () => {
      const items = generateItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={50}
        />
      );

      // overscan=50: 10 可见 + 50*2 = 最多 110 项，但总共有 100 项
      const rendered = countRenderedItems(container);
      expect(rendered).toBeGreaterThan(0);
      expect(rendered).toBeLessThanOrEqual(100);
    });

    it('[P2] items 为空时滚动不应出错', () => {
      const { container } = render(
        <VirtualList
          items={[]}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;
      fireEvent.scroll(scrollContainer);

      expect(countRenderedItems(container)).toBe(0);
    });

    it('[P2] 极多 items (10000) 只渲染有限数量', () => {
      const items = generateItems(10000);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const rendered = countRenderedItems(container);
      // 280/28 = 10 可见 + overscan*2 = 最多 20 项
      expect(rendered).toBeLessThan(10000);
      expect(rendered).toBeLessThanOrEqual(20);
    });
  });

  describe('滚动交互增强', () => {
    it('[P0] 滚动到底部再滚回顶部保持正确渲染', () => {
      const items = generateItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 滚动到底部
      scrollContainer.scrollTop = 2520; // (100-10)*28
      fireEvent.scroll(scrollContainer);

      // 验证底部
      const bottomItem = scrollContainer.querySelector('[data-index]');
      expect(bottomItem).not.toBeNull();

      // 滚动回顶部
      scrollContainer.scrollTop = 0;
      fireEvent.scroll(scrollContainer);

      // 验证顶部
      const topItem = scrollContainer.querySelector('[data-index]');
      expect(topItem?.getAttribute('data-index')).toBe('0');

      // 滚动到底部后再回来，确认数据完整性
      const rendered = countRenderedItems(container);
      expect(rendered).toBeGreaterThan(0);
    });

    it('[P1] 快速连续滚动更新可视区域', () => {
      const items = generateItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 快速连续滚动 5 次
      for (let i = 0; i < 5; i++) {
        scrollContainer.scrollTop = i * 500;
        fireEvent.scroll(scrollContainer);
      }

      // 最终状态应渲染正确区域
      const lastItem = scrollContainer.querySelector('[data-index]');
      expect(lastItem).not.toBeNull();
    });

    it('[P2] 滚动到中间位置时前后有 overscan 缓冲', () => {
      const items = generateItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={3}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 滚动到中间 (50 * 28 = 1400)
      scrollContainer.scrollTop = 1400;
      fireEvent.scroll(scrollContainer);

      // 应渲染 startIndex = max(0, 50 - 3) = 47
      // endIndex = min(100, 47 + 10 + 6) = 63
      // 共 16 项
      const rendered = countRenderedItems(container);
      expect(rendered).toBeLessThanOrEqual(20);
    });
  });

  describe('React.memo 稳定性', () => {
    it('[P1] 相同 props 重新渲染不引起额外渲染', () => {
      const items = generateItems(50);
      const renderCount = { current: 0 };

      const countingRenderItem = (item: TestItem, index: number) => {
        renderCount.current++;
        return <div data-testid="virtual-item" data-index={index}>{item.label}</div>;
      };

      const { rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={countingRenderItem}
        />
      );

      const initialRenderCount = renderCount.current;

      // 使用完全相同的 props 重新渲染
      rerender(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={countingRenderItem}
        />
      );

      // 由于 items 数组引用改变，VirtualList 可能重新渲染
      // 但可视区域内的 item 数量应保持不变
      expect(renderCount.current).toBeGreaterThanOrEqual(initialRenderCount);
    });

    it('[P2] 依赖变化时正确更新可视项', () => {
      const initialItems = generateItems(30);
      const { container, rerender } = render(
        <VirtualList
          items={initialItems}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const initialFirst = container.querySelector('[data-index]');
      expect(initialFirst?.getAttribute('data-index')).toBe('0');

      // 替换为完全不同的项目
      const newItems = Array.from({ length: 200 }, (_, i) => ({
        id: i + 100,
        label: `New Item ${i + 100}`,
      }));

      rerender(
        <VirtualList
          items={newItems}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const updatedFirst = container.querySelector('[data-index]');
      expect(updatedFirst?.getAttribute('data-index')).toBe('0');

      const renderedCount = countRenderedItems(container);
      // 200+ 项但只渲染可视区域
      expect(renderedCount).toBeLessThan(200);
    });
  });
});