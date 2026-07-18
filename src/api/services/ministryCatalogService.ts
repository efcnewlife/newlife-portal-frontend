import { API_ENDPOINTS } from "@/api";
import { IS_MOCK_API } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import { httpClient } from "./httpClient";

export interface MinistryCatalogItem {
  id: string;
  code: string;
  name?: string;
}

class MinistryCatalogService {
  async getMinistryTypes(): Promise<ApiResponse<{ items: MinistryCatalogItem[] }>> {
    if (IS_MOCK_API) return { success: true, data: { items: [] } };
    return httpClient.get(API_ENDPOINTS.MINISTRY.CATALOG.MINISTRY_TYPES);
  }

  async getTargetAudiences(): Promise<ApiResponse<{ items: MinistryCatalogItem[] }>> {
    if (IS_MOCK_API) return { success: true, data: { items: [] } };
    return httpClient.get(API_ENDPOINTS.MINISTRY.CATALOG.TARGET_AUDIENCES);
  }
}

export const ministryCatalogService = new MinistryCatalogService();
export default ministryCatalogService;
