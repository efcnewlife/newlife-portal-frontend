import { API_ENDPOINTS, httpClient } from "@/api";
import type {
  BulkDeleteRequest,
  BulkDeleteResponse,
  FileAssociationPreviewResponse,
  FilePagesParams,
  FilePagesResponse,
  FileSummaryResponse,
  FileUploadResponse,
  MediaCategory,
} from "@/pages/Content/File/types";
import type { AxiosProgressEvent } from "axios";

export const fileService = {
  async getSummary() {
    return httpClient.get<FileSummaryResponse>(API_ENDPOINTS.CONTENT.FILES.SUMMARY);
  },

  async getPages(params: FilePagesParams) {
    return httpClient.get<FilePagesResponse>(API_ENDPOINTS.CONTENT.FILES.PAGES, params);
  },

  async uploadOne(file: File, mediaCategory: MediaCategory, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append("file", file);

    return httpClient.request<FileUploadResponse>({
      method: "POST",
      url: API_ENDPOINTS.CONTENT.FILES.UPLOAD,
      data: formData,
      params: { media_category: mediaCategory },
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (evt: AxiosProgressEvent) => {
        if (!onProgress) return;
        const total = evt.total ?? file.size ?? 0;
        if (total > 0) {
          const percent = Math.round((evt.loaded * 100) / total);
          onProgress(Math.max(0, Math.min(100, percent)));
        }
      },
    });
  },

  async previewAssociations(payload: BulkDeleteRequest) {
    return httpClient.post<FileAssociationPreviewResponse>(API_ENDPOINTS.CONTENT.FILES.ASSOCIATION_PREVIEW, payload);
  },

  async bulkDelete(payload: BulkDeleteRequest) {
    return httpClient.request<BulkDeleteResponse>({
      method: "DELETE",
      url: API_ENDPOINTS.CONTENT.FILES.BULK_DELETE,
      data: payload,
    });
  },
};

export default fileService;
