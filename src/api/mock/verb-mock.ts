import type { ApiResponse } from "@/types/api";
import type { VerbItem, VerbListResponse } from "@/api/services/verbService";

const mockVerbs: VerbItem[] = [
  { id: "verb-create", name: "Create", action: "create" },
  { id: "verb-read", name: "Read", action: "read" },
  { id: "verb-update", name: "Update", action: "update" },
  { id: "verb-delete", name: "Delete", action: "delete" },
  { id: "verb-list", name: "List", action: "list" },
];

export const listMockVerbs = (): ApiResponse<VerbListResponse> => {
  return {
    success: true,
    code: 200,
    data: { items: mockVerbs },
  };
};
