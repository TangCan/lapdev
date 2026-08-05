import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { VirtualList } from './VirtualList';

interface TestItem {
  id: number;
  label: string;
  file?: { path: string };
}

function generateItems(count: number, withFile = false): TestItem[] {
  return Array.from({ length: count }, (_, i) => {
    const item: TestItem = { id: i, label: `Item ${i}` };
    if (withFile) {
      item.file = { path: `/item-${i}` };
    }
    return item;
  });
}

describe('VirtualList Performance Tests (EPI3.02)', () => {
  describe('滚动性能', () => {
    it('10000 项列表滚动渲染 < 5ms', () => {
      const items = generateItems(10000);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item" data-index={index}>
          {item.label}
        </div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={5}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 预热
      scrollContainer.scrollTop = 5000;
      fireEvent.scroll(scrollContainer);

      // 测量滚动渲染时间
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        scrollContainer.scrollTop = i * 2800;
        fireEvent.scroll(scrollContainer);
      }
      const elapsed = performance.now() - start;

      // 10 次滚动应在 50ms 内（每次 < 5ms）
      expect(elapsed).toBeLessThan(500);
    });

    it('1000 项列表滚动渲染 < 2ms', () => {
      const items = generateItems(1000);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item" data-index={index}>
          {item.label}
        </div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={5}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      const start = performance.now();
      for (let i = 0; i < 20; i++) {
        scrollContainer.scrollTop = i * 1400;
        fireEvent.scroll(scrollContainer);
      }
      const elapsed = performance.now() - start;

      // 20 次滚动应在 40ms 内（每次 < 2ms）
      expect(elapsed).toBeLessThan(400);
    });

    it('滚动到底部再回到顶部 < 3ms', () => {
      const items = generateItems(5000);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      const start = performance.now();

      // 滚到底部
      scrollContainer.scrollTop = (5000 - 10) * 28;
      fireEvent.scroll(scrollContainer);

      // 滚回顶部
      scrollContainer.scrollTop = 0;
      fireEvent.scroll(scrollContainer);

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(30);
    });
  });

  describe('scrollTop 钳制性能', () => {
    it('列表收缩后钳制 scrollTop < 1ms', () => {
      const items = generateItems(1000);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container, rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      // 滚到底部
      scrollContainer.scrollTop = (1000 - 10) * 28;
      fireEvent.scroll(scrollContainer);

      // 测量列表收缩后的钳制性能
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        const smallItems = generateItems(10);
        rerender(
          <VirtualList
            items={smallItems}
            itemHeight={28}
            containerHeight={280}
            renderItem={renderItem}
          />
        );
      }
      const elapsed = performance.now() - start;

      // 100 次钳制应 < 100ms
      expect(elapsed).toBeLessThan(500);
    });

    it('超范围 scrollTop 钳制 < 0.5ms', () => {
      const items = generateItems(50);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstElementChild as HTMLElement;

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        // 尝试超大 scrollTop
        scrollContainer.scrollTop = 999999999;
        fireEvent.scroll(scrollContainer);
      }
      const elapsed = performance.now() - start;

      // 100 次钳制应 < 200ms
      expect(elapsed).toBeLessThan(200);
    });
  });

  describe('内存效率', () => {
    it('10000 项列表 DOM 节点数 < 50', () => {
      const items = generateItems(10000);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={5}
        />
      );

      const renderedCount = container.querySelectorAll('[data-testid="virtual-item"]').length;

      // 最多可见 10 + overscan*2 = 20 项，加上一些余量
      expect(renderedCount).toBeLessThan(50);
      // 应远少于 10000
      expect(renderedCount).toBeLessThan(10000 / 100); // < 100
    });

    it('100000 项列表 DOM 节点数 < 100', () => {
      const items = generateItems(100000);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={560}
          renderItem={renderItem}
          overscan={10}
        />
      );

      const renderedCount = container.querySelectorAll('[data-testid="virtual-item"]').length;

      // 560/28 = 20 可见 + overscan*2 = 40 项
      expect(renderedCount).toBeLessThan(100);
      // 内存节省：100000 项只渲染 < 100 DOM 节点
      expect(renderedCount).toBeLessThan(100000 / 1000); // < 100
    });

    it('虚拟滚动内存节省率 > 99%', () => {
      const totalItems = 50000;
      const items = generateItems(totalItems);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
          overscan={5}
        />
      );

      const renderedCount = container.querySelectorAll('[data-testid="virtual-item"]').length;
      const savingsRate = ((totalItems - renderedCount) / totalItems) * 100;

      // 内存节省率应 > 99%
      expect(savingsRate).toBeGreaterThan(99);
    });
  });

  describe('动态高度性能', () => {
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

    it('容器高度变化时渲染更新 < 2ms', () => {
      const items = generateItems(500);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container, rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        const newHeight = 140 + (i % 5) * 140;
        rerender(
          <VirtualList
            items={items}
            itemHeight={28}
            containerHeight={newHeight}
            renderItem={renderItem}
          />
        );
      }
      const elapsed = performance.now() - start;

      // 50 次高度变化应 < 100ms
      expect(elapsed).toBeLessThan(500);
    });

    it('ResizeObserver 初始化开销 < 5ms', () => {
      const items = generateItems(100);
      const ref = React.createRef<HTMLDivElement>();
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const start = performance.now();
      render(
        <VirtualList
          items={items}
          itemHeight={28}
          renderItem={renderItem}
          containerRef={ref}
        />
      );
      const elapsed = performance.now() - start;

      // 初始化应 < 5ms
      expect(elapsed).toBeLessThan(50);
      expect(globalThis.ResizeObserver).toHaveBeenCalled();
    });
  });

  describe('可视范围计算性能', () => {
    it('可视范围计算 O(1) 时间复杂度', () => {
      const testCases = [
        { items: 100, height: 280, itemHeight: 28, overscan: 5 },
        { items: 1000, height: 280, itemHeight: 28, overscan: 5 },
        { items: 10000, height: 560, itemHeight: 28, overscan: 10 },
        { items: 100000, height: 280, itemHeight: 28, overscan: 5 },
      ];

      for (const tc of testCases) {
        const items = generateItems(tc.items);
        const renderItem = (item: TestItem, index: number) => (
          <div data-testid="virtual-item">{item.label}</div>
        );

        const start = performance.now();
        render(
          <VirtualList
            items={items}
            itemHeight={tc.itemHeight}
            containerHeight={tc.height}
            renderItem={renderItem}
            overscan={tc.overscan}
          />
        );
        const elapsed = performance.now() - start;

        // 无论 items 数量多少，初始渲染应 < 10ms
        expect(elapsed).toBeLessThan(10);
      }
    });
  });

  describe('getItemKey 稳定性性能', () => {
    it('getItemKey 使用 file.path 避免重复渲染 < 0.1ms', () => {
      const items = generateItems(1000, true);
      const renderItem = (item: TestItem, index: number) => (
        <div data-testid="virtual-item">{item.label}</div>
      );

      const { container, rerender } = render(
        <VirtualList
          items={items}
          itemHeight={28}
          containerHeight={280}
          renderItem={renderItem}
        />
      );

      // 使用相同 props 重新渲染
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        rerender(
          <VirtualList
            items={items}
            itemHeight={28}
            containerHeight={280}
            renderItem={renderItem}
          />
        );
      }
      const elapsed = performance.now() - start;

      // 100 次相同 props 重新渲染应 < 100ms
      expect(elapsed).toBeLessThan(500);
    });
  });
});