import type { FileAssociationPreviewItem, FileDeleteAssociationGroup } from "./types";

export const groupFileAssociationPreview = (
  selectedIds: string[],
  items: FileAssociationPreviewItem[]
): FileDeleteAssociationGroup[] => {
  const bindingsByFileId = new Map<string, FileAssociationPreviewItem[]>();
  selectedIds.forEach((fileId) => {
    bindingsByFileId.set(fileId, []);
  });

  items.forEach((item) => {
    const bindings = bindingsByFileId.get(item.fileId);
    if (!bindings) {
      return;
    }
    bindings.push(item);
  });

  return selectedIds.map((fileId) => ({
    fileId,
    bindings: bindingsByFileId.get(fileId) ?? [],
  }));
};
