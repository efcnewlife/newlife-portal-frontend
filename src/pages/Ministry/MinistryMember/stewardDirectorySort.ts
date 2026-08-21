export type StewardDirectorySortField = "name" | "updated_at" | "created_at";

export interface StewardDirectorySortState {
  field: StewardDirectorySortField;
  descending: boolean;
}

export const DEFAULT_STEWARD_DIRECTORY_SORT: StewardDirectorySortState = {
  field: "updated_at",
  descending: true,
};

export const STEWARD_DIRECTORY_SORT_FIELDS: StewardDirectorySortField[] = ["name", "updated_at", "created_at"];

export const toggleStewardDirectorySort = (
  current: StewardDirectorySortState,
  field: StewardDirectorySortField
): StewardDirectorySortState => {
  if (current.field === field) {
    return { field, descending: !current.descending };
  }
  return {
    field,
    descending: field !== "name",
  };
};

export const convertStewardDirectorySortToApiParams = (
  sort: StewardDirectorySortState
): { order_by: string; descending: boolean } => ({
  order_by: sort.field,
  descending: sort.descending,
});
