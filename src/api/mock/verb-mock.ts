import type { ApiResponse } from "@/types/api";
import type { VerbItem, VerbListResponse } from "@/api/services/verbService";

const mockVerbs: VerbItem[] = [
  { id: "verb-create", displayName: "Create", action: "create" },
  { id: "verb-read", displayName: "Read", action: "read" },
  { id: "verb-update", displayName: "Update", action: "update" },
  { id: "verb-delete", displayName: "Delete", action: "delete" },
  { id: "verb-list", displayName: "List", action: "list" },
];

export const listMockVerbs = (): ApiResponse<VerbListResponse> => {
  return {
    success: true,
    code: 200,
    data: { items: mockVerbs },
  };
};
