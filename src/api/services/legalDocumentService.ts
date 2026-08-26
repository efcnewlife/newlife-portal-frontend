import { API_ENDPOINTS, httpClient } from "@/api";

export interface LegalDocumentTranslationItem {
  localeId: string;
  body: string;
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

  async update(id: string, payload: LegalDocumentUpdatePayload) {
    return httpClient.put<LegalDocumentDetail>(API_ENDPOINTS.CONTENT.LEGAL_DOCUMENTS.UPDATE(id), payload);
  },
};

export default legalDocumentService;
