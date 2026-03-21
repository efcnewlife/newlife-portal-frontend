import { API_ENDPOINTS } from "@/api";
import type { ApiResponse } from "@/types/api";
import { listMockVerbs } from "@/api/mock/verb-mock";
import { IS_MOCK_API } from "@/config/env";
import { httpClient } from "./httpClient";

export interface VerbItem {
  id: string;
  displayName: string;
  action: string; // e.g., create/read/update/delete/list/get
}

export interface VerbListResponse {
  items: VerbItem[];
}

class VerbService {
  async list(): Promise<ApiResponse<VerbListResponse>> {
    // API implementation: delegate mock response generation to api/mock module.
    if (IS_MOCK_API) {
      return listMockVerbs();
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<VerbListResponse>(API_ENDPOINTS.VERBS.LIST);
  }
}

export const verbService = new VerbService();
export default verbService;
