import type { FileItem } from "@/pages/Content/File/types";
import { appendUploadedFiles } from "@/pages/Content/File/utils";

export interface RoomGalleryFile {
  id: string;
  originalName: string;
  url?: string;
  sizeBytes?: number;
}

export const ROOM_GALLERY_MAX_FILES = 10;

export type RoomGalleryError = "max" | "duplicate";

export const galleryFileIds = (items: FileItem[]): string[] => items.map((item) => item.id);

export const uniqueGalleryItems = (items: FileItem[]): FileItem[] => {
  const seen = new Set<string>();
  const unique: FileItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
};

export const reorderGallery = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

export const canAddGalleryPick = (
  selectedCount: number,
  isAlreadySelected: boolean,
  max: number = ROOM_GALLERY_MAX_FILES
): boolean => {
  if (isAlreadySelected) {
    return true;
  }
  return selectedCount < max;
};

export const applyPickerSelection = (
  current: FileItem[],
  picked: FileItem[],
  max: number = ROOM_GALLERY_MAX_FILES
): { items: FileItem[]; overCap: boolean } => {
  const uniquePicked = uniqueGalleryItems(picked);
  const pickedIds = new Set(uniquePicked.map((item) => item.id));
  const kept = current.filter((item) => pickedIds.has(item.id));
  const keptIds = new Set(kept.map((item) => item.id));
  const appended = uniquePicked.filter((item) => !keptIds.has(item.id));
  const items = [...kept, ...appended];
  return { items, overCap: items.length > max };
};

export const appendUploadedGalleryFiles = (
  current: FileItem[],
  uploaded: FileItem[],
  max: number = ROOM_GALLERY_MAX_FILES
): { items: FileItem[]; overCap: boolean } => {
  return appendUploadedFiles(current, uploaded, max);
};

export const validateGallery = (items: FileItem[], max: number = ROOM_GALLERY_MAX_FILES): RoomGalleryError | null => {
  if (items.length > max) {
    return "max";
  }
  if (uniqueGalleryItems(items).length !== items.length) {
    return "duplicate";
  }
  return null;
};

export const hydrateGalleryFromFiles = (files?: RoomGalleryFile[]): FileItem[] => {
  if (!files || files.length === 0) {
    return [];
  }
  return uniqueGalleryItems(
    files.map((file) => ({
      id: file.id,
      url: file.url || "",
      name: file.originalName,
      size: file.sizeBytes,
    }))
  );
};
