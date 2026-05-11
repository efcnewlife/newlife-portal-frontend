import { API_ENDPOINTS } from "@/api";
import { listMockLocales } from "@/api/mock/locale-mock";
import { IS_MOCK_API } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import { httpClient } from "./httpClient";

export interface LocaleItem {
  id: string;
  language_code: string;
  script_code?: string | null;
  region_code?: string | null;
  name?: string | null;
  native_name?: string | null;
  is_active: boolean;
  is_default: boolean;
}

export interface LocaleListResponse {
  items: LocaleItem[];
}

class LocaleService {
  async list(): Promise<ApiResponse<LocaleListResponse>> {
    if (IS_MOCK_API) {
      return listMockLocales();
    }
    return httpClient.get<LocaleListResponse>(API_ENDPOINTS.LOCALE.LIST);
  }
}

export const localeService = new LocaleService();
export default localeService;
