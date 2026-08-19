export const MINISTRY_QUERY_KEY = "ministry";

export const parseMinistryQueryId = (search: string): string | null => {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const value = params.get(MINISTRY_QUERY_KEY);
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const withMinistryQueryId = (search: string, ministryId: string | null): string => {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!ministryId) {
    params.delete(MINISTRY_QUERY_KEY);
  } else {
    params.set(MINISTRY_QUERY_KEY, ministryId);
  }
  const next = params.toString();
  return next ? `?${next}` : "";
};

export type StewardDirectorySelectionReason = "load" | "filter" | "rail-click" | "url-change";

export interface ResolveStewardDirectorySelectionInput {
  reason: StewardDirectorySelectionReason;
  urlMinistryId: string | null;
  railIds: string[];
  currentSelectedId: string | null;
  isDirty: boolean;
  requestedId?: string | null;
}

export type ResolveStewardDirectorySelectionResult =
  | { action: "select"; ministryId: string; syncUrl: boolean }
  | { action: "keep" }
  | { action: "clear" }
  | { action: "block" };

export const resolveStewardDirectorySelection = (
  input: ResolveStewardDirectorySelectionInput,
): ResolveStewardDirectorySelectionResult => {
  const { reason, urlMinistryId, railIds, currentSelectedId, isDirty, requestedId } = input;

  if (reason === "rail-click") {
    if (!requestedId || requestedId === currentSelectedId) return { action: "keep" };
    if (isDirty) return { action: "block" };
    return { action: "select", ministryId: requestedId, syncUrl: true };
  }

  if (reason === "url-change") {
    if (!urlMinistryId || urlMinistryId === currentSelectedId) return { action: "keep" };
    if (isDirty) return { action: "block" };
    return { action: "select", ministryId: urlMinistryId, syncUrl: false };
  }

  if (reason === "load") {
    if (urlMinistryId) {
      return { action: "select", ministryId: urlMinistryId, syncUrl: false };
    }
    if (railIds[0]) {
      return { action: "select", ministryId: railIds[0], syncUrl: true };
    }
    return { action: "clear" };
  }

  if (currentSelectedId && railIds.includes(currentSelectedId)) {
    return { action: "keep" };
  }
  if (isDirty && currentSelectedId) {
    return { action: "keep" };
  }
  if (railIds[0]) {
    return { action: "select", ministryId: railIds[0], syncUrl: true };
  }
  return { action: "clear" };
};
