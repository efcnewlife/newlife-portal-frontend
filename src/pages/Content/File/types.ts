export type MediaCategory = "images" | "files";

export interface FileCategoryStats {
  count: number;
  sizeBytes: number;
}

export interface FileSummaryResponse {
  images: FileCategoryStats;
  files: FileCategoryStats;
  total: FileCategoryStats;
}

export interface FileGridItem {
  id: string;
  originalName: string;
  key: string;
  storage: string;
  bucket: string;
  region: string;
  contentType?: string;
  extension?: string;
  sizeBytes?: number;
  url?: string;
  createdAt?: string;
}

export interface FilePagesResponse {
  page: number;
  pageSize: number;
  total: number;
  items: FileGridItem[];
}

export interface FileUploadResponse {
  id: string;
  duplicate?: boolean;
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface FileBase {
  id: string;
  originalName: string;
  key: string;
  storage: string;
  bucket: string;
  region: string;
  contentType?: string;
  extension?: string;
  sizeBytes?: number;
}

export interface BulkDeleteResponse {
  successCount: number;
  failedItems?: FileBase[] | null;
}

export interface FileAssociationPreviewItem {
  fileId: string;
  resourceKind: string;
  resourceId: string;
  displayName: string;
  isDeleted: boolean;
}

export interface FileAssociationPreviewResponse {
  items: FileAssociationPreviewItem[];
}

export interface FileDeleteAssociationGroup {
  fileId: string;
  bindings: FileAssociationPreviewItem[];
}

export type SortOrder = "name_asc" | "name_desc" | "date_asc" | "date_desc" | "size_asc" | "size_desc";

export interface FilePagesParams extends Record<string, unknown> {
  page?: number;
  page_size?: number;
  keyword?: string;
  order_by?: string;
  descending?: boolean;
  media_category?: MediaCategory;
}

export interface FileItem {
  id: string;
  url: string;
  name: string;
  size?: number;
  createdAt?: string;
  contentType?: string;
  extension?: string;
}
