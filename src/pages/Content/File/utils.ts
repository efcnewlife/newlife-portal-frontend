import type { FileGridItem, FileItem, MediaCategory, SortOrder } from "./types";

export const IMAGE_ACCEPT: Record<string, string[]> = {
  "image/apng": [".apng"],
  "image/avif": [".avif"],
  "image/gif": [".gif"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/svg+xml": [".svg"],
  "image/webp": [".webp"],
};

export const FILE_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "application/x-rar-compressed": [".rar"],
  "application/vnd.rar": [".rar"],
  "text/plain": [".txt"],
};

export const IMAGE_EXTENSIONS = new Set(
  Object.values(IMAGE_ACCEPT)
    .flat()
    .map((extension) => extension.replace(/^\./, "").toLowerCase())
);

export const MIXED_ACCEPT: Record<string, string[]> = {
  ...IMAGE_ACCEPT,
  ...FILE_ACCEPT,
};

/** Align with backend settings.MAX_UPLOAD_SIZE default (5MB). */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, index);
  return `${Math.round(value * 100) / 100} ${sizes[index]}`;
};

export const isImageContentType = (contentType?: string): boolean => {
  return Boolean(contentType?.startsWith("image/"));
};

export const resolveMediaCategoryFromFile = (file: File): MediaCategory => {
  if (isImageContentType(file.type)) {
    return "images";
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && IMAGE_EXTENSIONS.has(extension)) {
    return "images";
  }
  return "files";
};

export const convertSortOrderToApiParams = (sortOrder: SortOrder): { order_by: string; descending: boolean } => {
  switch (sortOrder) {
    case "name_asc":
      return { order_by: "original_name", descending: false };
    case "name_desc":
      return { order_by: "original_name", descending: true };
    case "date_asc":
      return { order_by: "created_at", descending: false };
    case "date_desc":
      return { order_by: "created_at", descending: true };
    case "size_asc":
      return { order_by: "size_bytes", descending: false };
    case "size_desc":
      return { order_by: "size_bytes", descending: true };
    default:
      return { order_by: "created_at", descending: true };
  }
};

export const convertFileGridItemToFileItem = (item: FileGridItem): FileItem => {
  return {
    id: item.id,
    url: item.url || "",
    name: item.originalName,
    size: item.sizeBytes,
    createdAt: item.createdAt,
    contentType: item.contentType,
    extension: item.extension,
  };
};

export const getCategorySharePercent = (sizeBytes: number, totalBytes: number): number => {
  if (totalBytes <= 0) return 0;
  return Math.round((sizeBytes / totalBytes) * 100);
};

export const getDonutGradient = (imagesPercent: number): string => {
  const clamped = Math.max(0, Math.min(100, imagesPercent));
  // TailAdmin File Manager Storage Details chart colors (Media / Documents)
  return `conic-gradient(#32d583 0% ${clamped}%, #fdb022 ${clamped}% 100%)`;
};

export const getFileIconTone = (extension?: string): string => {
  const ext = (extension || "").toLowerCase();
  if (ext === "pdf") return "text-red-500 bg-red-50 dark:bg-red-500/10";
  if (["doc", "docx"].includes(ext)) return "text-blue-500 bg-blue-50 dark:bg-blue-500/10";
  if (["xls", "xlsx"].includes(ext)) return "text-green-600 bg-green-50 dark:bg-green-500/10";
  if (["ppt", "pptx"].includes(ext)) return "text-orange-500 bg-orange-50 dark:bg-orange-500/10";
  if (["zip", "rar", "7z"].includes(ext)) return "text-amber-600 bg-amber-50 dark:bg-amber-500/10";
  return "text-gray-500 bg-gray-100 dark:bg-gray-800";
};

export const mediaCategoryLabelKey = (category: MediaCategory): string => {
  return category === "images" ? "content:file.category.images" : "content:file.category.files";
};
