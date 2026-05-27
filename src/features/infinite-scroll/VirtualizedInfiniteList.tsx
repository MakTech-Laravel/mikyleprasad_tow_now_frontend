import { useCallback, useMemo, type ReactNode } from 'react';
import { List, type RowComponentProps } from 'react-window';

import { useElementSize } from '@/hooks/useElementSize';

type VirtualizedRowProps = {
  items: readonly unknown[];
  renderItem: (item: unknown, index: number) => ReactNode;
  loaderIndex: number;
  loadingContent: ReactNode;
};

function VirtualizedRow({
  index,
  style,
  ariaAttributes,
  items,
  renderItem,
  loaderIndex,
  loadingContent,
}: RowComponentProps<VirtualizedRowProps>) {
  const isLoaderRow = loaderIndex >= 0 && index === loaderIndex;
  if (isLoaderRow) {
    return (
      <div
        style={style}
        {...ariaAttributes}
        className="box-border flex items-center justify-center border-b bg-muted/30 py-3 text-sm text-muted-foreground"
      >
        {loadingContent}
      </div>
    );
  }

  const item = items[index];
  if (item === undefined) {
    return <div style={style} {...ariaAttributes} className="box-border" />;
  }

  return (
    <div style={style} {...ariaAttributes} className="box-border border-b border-border">
      {renderItem(item, index)}
    </div>
  );
}

export type VirtualizedInfiniteListProps<T> = {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  loadingContent: ReactNode;
  /** When the last visible row index reaches within this many rows of the end of loaded data, fetch the next page. */
  thresholdRows?: number;
  overscanCount?: number;
};

export function VirtualizedInfiniteList<T>({
  items,
  itemHeight,
  renderItem,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadingContent,
  thresholdRows = 5,
  overscanCount = 4,
}: VirtualizedInfiniteListProps<T>) {
  const { ref: containerRef, width, height } = useElementSize<HTMLDivElement>();

  const showLoaderRow = hasNextPage || isFetchingNextPage;
  const loaderIndex = showLoaderRow ? items.length : -1;
  const rowCount = items.length + (showLoaderRow ? 1 : 0);

  const rowProps: VirtualizedRowProps = useMemo(
    () => ({
      items: items as readonly unknown[],
      renderItem: (item: unknown, index: number) => renderItem(item as T, index),
      loaderIndex,
      loadingContent,
    }),
    [items, renderItem, loaderIndex, loadingContent],
  );

  const onRowsRendered = useCallback(
    (visible: { startIndex: number; stopIndex: number }) => {
      if (!hasNextPage || isFetchingNextPage) return;
      if (items.length === 0) return;
      const triggerIndex = Math.max(0, items.length - thresholdRows);
      if (visible.stopIndex >= triggerIndex) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, items.length, fetchNextPage, thresholdRows],
  );

  return (
    <div
      ref={containerRef}
      className="h-[min(70vh,560px)] min-h-[360px] w-full overflow-hidden rounded-md border border-border bg-background md:min-h-[480px]"
    >
      {width > 0 && height > 0 && rowCount > 0 ? (
        <List<VirtualizedRowProps>
          rowCount={rowCount}
          rowHeight={itemHeight}
          rowComponent={VirtualizedRow}
          rowProps={rowProps}
          onRowsRendered={onRowsRendered}
          overscanCount={overscanCount}
          style={{ height, width }}
        />
      ) : null}
    </div>
  );
}
