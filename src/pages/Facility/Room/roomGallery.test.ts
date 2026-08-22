import { describe, expect, it } from "vitest";
import type { FileItem } from "@/pages/Content/File/types";
import {
  ROOM_GALLERY_MAX_FILES,
  appendUploadedGalleryFiles,
  applyPickerSelection,
  canAddGalleryPick,
  galleryFileIds,
  hydrateGalleryFromFiles,
  reorderGallery,
  uniqueGalleryItems,
  validateGallery,
} from "./roomGallery";

const item = (id: string): FileItem => ({ id, url: `https://cdn.example/${id}.jpg`, name: `${id}.jpg` });

describe("room gallery helpers", () => {
  it("maps preview order to file ids", () => {
    expect(galleryFileIds([item("b"), item("a")])).toEqual(["b", "a"]);
  });

  it("ignores duplicate picks while keeping first-seen order", () => {
    expect(uniqueGalleryItems([item("a"), item("b"), item("a")]).map((file) => file.id)).toEqual(["a", "b"]);
  });

  it("reorders by drag indexes", () => {
    const reordered = reorderGallery([item("a"), item("b"), item("c")], 2, 0);
    expect(reordered.map((file) => file.id)).toEqual(["c", "a", "b"]);
  });

  it("does not allow adding a new pick at the cap", () => {
    expect(canAddGalleryPick(ROOM_GALLERY_MAX_FILES, false)).toBe(false);
    expect(canAddGalleryPick(ROOM_GALLERY_MAX_FILES, true)).toBe(true);
    expect(canAddGalleryPick(ROOM_GALLERY_MAX_FILES - 1, false)).toBe(true);
  });

  it("keeps current gallery order and appends new unique picks", () => {
    const result = applyPickerSelection([item("b"), item("a")], [item("a"), item("c"), item("b"), item("a")]);
    expect(result.overCap).toBe(false);
    expect(result.items.map((file) => file.id)).toEqual(["b", "a", "c"]);
  });

  it("appends uploaded images that are not already in the gallery", () => {
    const result = appendUploadedGalleryFiles([item("a")], [item("a"), item("b"), item("b")]);
    expect(result.overCap).toBe(false);
    expect(result.items.map((file) => file.id)).toEqual(["a", "b"]);
  });

  it("does not append uploaded images past the gallery cap", () => {
    const current = Array.from({ length: ROOM_GALLERY_MAX_FILES }, (_, index) => item(`keep-${index}`));
    const result = appendUploadedGalleryFiles(current, [item("extra")]);
    expect(result.overCap).toBe(true);
    expect(result.items).toHaveLength(ROOM_GALLERY_MAX_FILES);
  });

  it("fills remaining gallery slots then flags over-cap for the rest", () => {
    const current = Array.from({ length: ROOM_GALLERY_MAX_FILES - 1 }, (_, index) => item(`keep-${index}`));
    const result = appendUploadedGalleryFiles(current, [item("fits"), item("overflow")]);
    expect(result.overCap).toBe(true);
    expect(result.items.map((file) => file.id)).toEqual([...current.map((file) => file.id), "fits"]);
  });

  it("flags over-cap without dropping extras from the result set", () => {
    const current = Array.from({ length: 10 }, (_, index) => item(`keep-${index}`));
    const picked = [...current, item("extra")];
    const result = applyPickerSelection(current, picked);
    expect(result.overCap).toBe(true);
    expect(result.items).toHaveLength(11);
  });

  it("validates uniqueness and cap", () => {
    expect(validateGallery([item("a"), item("a")])).toBe("duplicate");
    const over = Array.from({ length: 11 }, (_, index) => item(`f-${index}`));
    expect(validateGallery(over)).toBe("max");
    expect(validateGallery([item("a")])).toBeNull();
  });

  it("hydrates from room detail files in API order", () => {
    const items = hydrateGalleryFromFiles([
      {
        id: "second",
        originalName: "second.jpg",
        url: "https://cdn.example/second.jpg",
      },
      {
        id: "first",
        originalName: "first.jpg",
        url: "https://cdn.example/first.jpg",
      },
    ]);
    expect(items.map((file) => file.id)).toEqual(["second", "first"]);
    expect(items[0].url).toBe("https://cdn.example/second.jpg");
  });
});
