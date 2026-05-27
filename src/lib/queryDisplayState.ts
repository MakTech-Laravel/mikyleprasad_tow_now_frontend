type QueryLike = {
  isPending: boolean;
  isFetching: boolean;
};

export function getQueryDisplayState(query: QueryLike, itemCount: number) {
  const showInitialSkeleton = query.isPending && itemCount === 0;
  const showList = itemCount > 0;
  const isBackgroundRefresh = query.isFetching && !query.isPending && itemCount > 0;

  return {
    showInitialSkeleton,
    showList,
    isBackgroundRefresh,
  };
}
