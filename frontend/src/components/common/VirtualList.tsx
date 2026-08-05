import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  /** 固定容器高度。未提供时使用 ResizeObserver 动态测量 */
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  /** 外部传入的 ref，用于测量容器尺寸 */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** 自定义容器样式类名 */
  className?: string;
}

/**
 * 虚拟滚动列表组件
 * 只渲染可视区域的列表项，大幅提升大列表的渲染性能
 *
 * 支持动态容器高度：当 containerHeight 未提供时，使用 ResizeObserver 自动测量
 *
 * 使用示例：
 * ```tsx
 * // 固定高度
 * <VirtualList
 *   items={files}
 *   itemHeight={28}
 *   containerHeight={500}
 *   renderItem={(file) => <div>{file.name}</div>}
 * />
 *
 * // 动态高度（自动测量容器）
 * <VirtualList
 *   items={files}
 *   itemHeight={28}
 *   containerRef={containerRef}
 *   className="file-tree-virtual-list"
 *   renderItem={(file) => <div>{file.name}</div>}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight: propContainerHeight,
  renderItem,
  overscan = 5,
  containerRef: externalRef,
  className,
}: VirtualListProps<T>) {
  const internalRef = useRef<HTMLDivElement>(null);
  // P7: 初始为 0，但使用回退值确保首次渲染有内容
  const [dynamicHeight, setDynamicHeight] = useState(0);
  const effectiveDynamicHeight = dynamicHeight || 400; // 回退到 400 直到 observer 触发

  // 使用外部 ref 或内部 ref
  const ref = externalRef ?? internalRef;

  // 动态高度测量：当未提供 containerHeight 时使用 ResizeObserver
  useEffect(() => {
    if (propContainerHeight !== undefined) return;
    if (!ref.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDynamicHeight(entry.contentRect.height);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [propContainerHeight, ref]);

  const effectiveContainerHeight = propContainerHeight ?? effectiveDynamicHeight;

  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // P3: 列表收缩时钳制 scrollTop，防止空白视口
  const clampedScrollTop = useMemo(() => {
    const maxScroll = Math.max(0, items.length * itemHeight - effectiveContainerHeight);
    return Math.min(scrollTop, maxScroll);
  }, [scrollTop, items.length, itemHeight, effectiveContainerHeight]);

  // 计算可视范围
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const total = items.length * itemHeight;
    const visibleCount = Math.ceil(effectiveContainerHeight / itemHeight);
    const start = Math.max(0, Math.floor(clampedScrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    return {
      startIndex: start,
      endIndex: end,
      totalHeight: total,
    };
  }, [items.length, itemHeight, effectiveContainerHeight, clampedScrollTop, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
    }));
  }, [items, startIndex, endIndex]);

  // P1: 获取稳定的 item key
  const getItemKey = useCallback((item: T, index: number): React.Key => {
    if (item && typeof item === 'object' && 'file' in (item as unknown as Record<string, unknown>)) {
      const file = (item as unknown as { file: { path?: string } }).file;
      if (file?.path) return file.path;
    }
    return index;
  }, []);

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className={className}
      data-testid="virtual-scroll-container"
      style={{
        height: propContainerHeight ?? '100%',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={getItemKey(item, index)}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
