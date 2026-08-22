import { describe, expect, it } from "vitest";
import type { FileAssociationPreviewItem } from "./types";
import { groupFileAssociationPreview } from "./fileAssociationPreview";

const binding = (
  overrides: Partial<FileAssociationPreviewItem> & Pick<FileAssociationPreviewItem, "fileId">
): FileAssociationPreviewItem => ({
  resourceKind: "facility.room",
  resourceId: "room-1",
  displayName: "Sanctuary",
  isDeleted: false,
  ...overrides,
});

describe("groupFileAssociationPreview", () => {
  it("keeps every selected file in order, including files with no bindings", () => {
    const items = [binding({ fileId: "file-b", displayName: "Hall A" })];
    const groups = groupFileAssociationPreview(["file-a", "file-b"], items);

    expect(groups.map((group) => group.fileId)).toEqual(["file-a", "file-b"]);
    expect(groups[0].bindings).toEqual([]);
    expect(groups[1].bindings.map((row) => row.displayName)).toEqual(["Hall A"]);
  });

  it("lists named bindings and marks soft-deleted rooms", () => {
    const items = [
      binding({ fileId: "file-1", resourceId: "room-live", displayName: "Sanctuary", isDeleted: false }),
      binding({ fileId: "file-1", resourceId: "room-gone", displayName: "OLD-HALL", isDeleted: true }),
    ];
    const groups = groupFileAssociationPreview(["file-1"], items);

    expect(groups).toHaveLength(1);
    expect(groups[0].bindings).toEqual([
      {
        fileId: "file-1",
        resourceKind: "facility.room",
        resourceId: "room-live",
        displayName: "Sanctuary",
        isDeleted: false,
      },
      {
        fileId: "file-1",
        resourceKind: "facility.room",
        resourceId: "room-gone",
        displayName: "OLD-HALL",
        isDeleted: true,
      },
    ]);
  });

  it("ignores bindings for files that are not selected", () => {
    const items = [binding({ fileId: "other", displayName: "Ignored" })];
    const groups = groupFileAssociationPreview(["file-1"], items);

    expect(groups).toEqual([{ fileId: "file-1", bindings: [] }]);
  });
});
