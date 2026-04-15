// Virtual List Component for rendering large lists efficiently
// Only renders items that are visible in the viewport

import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  isLoading?: boolean;
}

function VirtualListInner<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  onEndReached,
  endReachedThreshold = 200,
  keyExtractor,
  emptyComponent,
  loadingComponent,
  isLoading = false
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const endReachedCalledRef = useRef(false);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const end = Math.min(items.length - 1, start + visibleCount);
    
    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1),
      offsetY: start * itemHeight,
      totalHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);

    // Check if end reached
    if (onEndReached) {
      const distanceFromEnd = totalHeight - (target.scrollTop + containerHeight);
      if (distanceFromEnd < endReachedThreshold && !endReachedCalledRef.current) {
        endReachedCalledRef.current = true;
        onEndReached();
      } else if (distanceFromEnd >= endReachedThreshold) {
        endReachedCalledRef.current = false;
      }
    }
  }, [totalHeight, containerHeight, endReachedThreshold, onEndReached]);

  // Reset end reached flag when items change
  useEffect(() => {
    endReachedCalledRef.current = false;
  }, [items.length]);

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: containerHeight }}>
        {emptyComponent || (
          <div className="text-white/40 text-center py-10">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;
            return (
              <div key={key} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center py-4">
          {loadingComponent || (
            <div className="w-6 h-6 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

// Simpler infinite scroll list for smaller datasets
interface InfiniteListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
  emptyComponent?: React.ReactNode;
}

export function InfiniteList<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  className = '',
  keyExtractor,
  emptyComponent
}: InfiniteListProps<T>) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className={className}>
        {emptyComponent || (
          <div className="text-white/40 text-center py-10">
            <p>No items to display</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        return <div key={key}>{renderItem(item, index)}</div>;
      })}
      
      <div ref={loadMoreRef} className="h-4" />
      
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4 text-white/30 text-sm">
          No more items
        </div>
      )}
    </div>
  );
}

// Grid version for member cards etc.
interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  columns: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
  keyExtractor?: (item: T, index: number) => string;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  containerHeight,
  columns,
  renderItem,
  gap = 16,
  className = '',
  keyExtractor
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  const { startRow, endRow, visibleRows } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 1);
    const visibleRowCount = Math.ceil(containerHeight / rowHeight) + 2;
    const end = Math.min(totalRows - 1, start + visibleRowCount);
    
    const rows: T[][] = [];
    for (let i = start; i <= end; i++) {
      const rowItems = items.slice(i * columns, (i + 1) * columns);
      rows.push(rowItems);
    }
    
    return {
      startRow: start,
      endRow: end,
      visibleRows: rows
    };
  }, [items, columns, rowHeight, containerHeight, scrollTop, totalRows]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${startRow * rowHeight}px)` }}>
          {visibleRows.map((row, rowIndex) => (
            <div
              key={startRow + rowIndex}
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap,
                height: rowHeight
              }}
            >
              {row.map((item, colIndex) => {
                const actualIndex = (startRow + rowIndex) * columns + colIndex;
                const key = keyExtractor ? keyExtractor(item, actualIndex) : actualIndex;
                return <div key={key}>{renderItem(item, actualIndex)}</div>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
