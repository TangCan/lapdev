import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { VirtualList } from './VirtualList';

interface TestItem {
  id: number;
  label: string;
}

describe('VirtualList Component', () => {
  const generateItems = (count: number): TestItem[] =>
    Array.from({ length: count }, (_, i) => ({ id: i, label: `Item ${i}` }));

  const renderItem = (item: TestItem, index: number) => (
    <div data-testid="virtual-item" data-index={index}>
      {item.label}
    </div>
  );

  const countRenderedItems = (container: HTMLElement): number =>
    container.querySelectorAll('[data-testid="virtual-item"]').length;

  describe('基础虚拟滚动', () => {
    it('[P0] 只渲染可视区域的项', () => {
      const items = generateItems(100);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      // 280 / 28 = 10 可见项 + overscan(默认5)*2 = 最多 20 项
      const rendered = countRenderedItems(container);
      expect(rendered).toBeGreaterThan(0);
      expect(rendered).toBeLessThan(100);
      expect(rendered).toBeLessThanOrEqual(20);
    });

    it('[P0] overscan 正确扩展渲染范围', () => {
      const items = generateItems(100);
      const { container: containerDefault } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={5}
        />
      );
      const { container: containerLargeOverscan } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={20}
        />
      );

      const defaultCount = countRenderedItems(containerDefault);
      const largeCount = countRenderedItems(containerLargeOverscan);

      // 更大的 overscan 应渲染更多项
      expect(largeCount).toBeGreaterThan(defaultCount);
    });

    it('[P0] 滚动后正确更新可视项', () => {
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

      // 滚动前：首项 index 应为 0
      const firstItem = scrollContainer.querySelector('[data-index]');
      expect(firstItem?.getAttribute('data-index')).toBe('0');

      // 模拟滚动到中间 (50 * 28 = 1400)
      scrollContainer.scrollTop = 1400;
      fireEvent.scroll(scrollContainer);

      const scrolledFirstItem = scrollContainer.querySelector('[data-index]');
      const scrolledIndex = parseInt(
        scrolledFirstItem?.getAttribute('data-index') || '0',
        10
      );
      expect(scrolledIndex).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('[P1] 空列表正确处理', () => {
      const { container } = render(
        <VirtualList
          items={[]}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      expect(countRenderedItems(container)).toBe(0);
    });

    it('[P1] 单项列表正确渲染', () => {
      const items = generateItems(1);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      expect(countRenderedItems(container)).toBe(1);
    });

    it('[P1] 大量项(1000+)只渲染有限数量', () => {
      const items = generateItems(1000);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={560}
          renderItem={renderItem}
        />
      );

      const rendered = countRenderedItems(container);
      // 560 / 28 = 20 可见 + overscan*2 = 最多 30 项
      expect(rendered).toBeLessThan(1000);
      expect(rendered).toBeLessThanOrEqual(30);
    });
  });

  describe('增强功能', () => {
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

    it('[P2] 动态高度(ResizeObserver)正确更新', () => {
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

      // containerRef 应被赋值
      expect(ref.current).not.toBeNull();
      // ResizeObserver 应被调用以测量容器
      expect(globalThis.ResizeObserver).toHaveBeenCalled();
    });

    it('[P2] className prop 正确应用', () => {
      const items = generateItems(10);
      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          className="custom-virtual-list"
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;
      expect(scrollContainer).toHaveClass('custom-virtual-list');
    });

    it('[P2] containerRef 正确传递', () => {
      const items = generateItems(10);
      const ref = React.createRef<HTMLDivElement>();

      render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          containerRef={ref}
        />
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('[P3] 边界滚动(顶部/底部)正确处理', () => {
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

      // 滚动到顶部
      scrollContainer.scrollTop = 0;
      fireEvent.scroll(scrollContainer);
      const topItem = scrollContainer.querySelector('[data-index]');
      expect(topItem?.getAttribute('data-index')).toBe('0');

      // 滚动到底部 (100 - 10) * 28 = 2520
      scrollContainer.scrollTop = 2520;
      fireEvent.scroll(scrollContainer);
      const bottomItems = scrollContainer.querySelectorAll(
        '[data-testid="virtual-item"]'
      );
      const lastIndex = parseInt(
        bottomItems[bottomItems.length - 1]?.getAttribute('data-index') || '0',
        10
      );
      expect(lastIndex).toBe(99);
    });
  });
});
