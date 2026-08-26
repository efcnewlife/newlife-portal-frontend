import { API_ENDPOINTS, httpClient } from "@/api";

export interface LegalDocumentTranslationItem {
  localeId: string;
  body: string;
}

export interface LegalDocumentCreatePayload {
  product: string;
  kind: string;
}

export interface LegalDocumentUpdatePayload {
  translations: LegalDocumentTranslationItem[];
}

export interface LegalDocumentItem {
  id: string;
  product: string;
  kind: string;
  createAt?: string | null;
  createdBy?: string | null;
  updateAt?: string | null;
  updatedBy?: string | null;
  deleteReason?: string | null;
}

export interface LegalDocumentDetail extends LegalDocumentItem {
  translations: LegalDocumentTranslationItem[];
}

export interface LegalDocumentPagesParams {
  page?: number;
  page_size?: number;
  order_by?: string;
  descending?: boolean;
  deleted?: boolean;
  product?: string;
  kind?: string;
}

export interface LegalDocumentPagesResponse {
  page: number;
  pageSize: number;
  total: number;
  items: LegalDocumentItem[];
}

export const legalDocumentService = {
  async getPages(params: LegalDocumentPagesParams) {
    return httpClient.get<LegalDocumentPagesResponse>(
      API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.PAGES,
      params as Record<string, unknown>
    );
  },

  async getById(id: string) {
    return httpClient.get<LegalDocumentDetail>(API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.DETAIL(id));
  },

  async create(payload: LegalDocumentCreatePayload) {
    return httpClient.post<{ id: string }>(API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.CREATE, payload);
  },

  async update(id: string, payload: LegalDocumentUpdatePayload) {
    return httpClient.put<LegalDocumentDetail>(API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.UPDATE(id), payload);
  },

  async delete(id: string, payload: { reason?: string; permanent?: boolean }) {
    return httpClient.delete<void>(API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.DELETE(id), { data: payload });
  },

  async restore(ids: string[]) {
    return httpClient.put<void>(API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.RESTORE, { ids });
  },
};

export default legalDocumentService;
