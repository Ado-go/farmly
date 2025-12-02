const parsePositiveNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
};

export const getPaginationParams = (
  query: Record<string, unknown>,
  defaultPageSize = 32,
  maxPageSize = 100
) => {
  const page = parsePositiveNumber(query.page, 1);
  const requestedSize =
    query.limit !== undefined ? query.limit : query.pageSize ?? defaultPageSize;
  const pageSize = Math.min(
    parsePositiveNumber(requestedSize, defaultPageSize),
    maxPageSize
  );

  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip, take: pageSize };
};

export const buildPaginationResponse = <T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
) => {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  const hasMore = page * pageSize < total;

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
  };
};
