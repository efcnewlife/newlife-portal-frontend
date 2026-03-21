export type PageQueryParams = {
  pageindex: number;
  pagesize: number;
  sortby?: string;
  descending?: boolean;
  deleted?: boolean;
} & Record<string, unknown>;

export type BuildPageParamsInput = {
  page: number;
  pageSize: number;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  deleted?: boolean;
  queryParams?: Record<string, unknown>;
};

export const buildPageParams = ({
  page,
  pageSize,
  sortKey,
  sortOrder,
  deleted = false,
  queryParams = {},
}: BuildPageParamsInput): PageQueryParams => {
  const params: PageQueryParams = {
    pageindex: Math.max(0, (page || 1) - 1),
    pagesize: pageSize || 10,
    ...(deleted ? { deleted: true } : {}),
    ...(queryParams || {}),
  };

  if (sortKey) {
    params.sortby = sortKey;
    params.descending = sortOrder === "desc";
  }

  return params;
};
