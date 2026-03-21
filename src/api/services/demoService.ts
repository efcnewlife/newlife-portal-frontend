import { API_ENDPOINTS, httpClient } from "@/api";
import { createMockDemo, getMockDemoPages, removeMockDemo, restoreMockDemo, updateMockDemo } from "@/api/mock/demo-mock";
import { IS_MOCK_DEMO } from "@/config/env";

export interface DemoDetail {
  id: string;
  name: string;
  remark?: string;
  age?: number;
  gender?: 0 | 1 | 2;
}

export interface DemoCreate {
  name: string;
  remark?: string;
  age?: number;
  gender?: 0 | 1 | 2;
}

export interface DemoUpdate extends DemoCreate {}

export interface DemoDelete {
  reason?: string;
  permanent?: boolean;
}

export interface DemoPagesParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  order_by?: string;
  descending?: boolean;
  deleted?: boolean;
}

export interface DemoPagesResponse {
  page: number;
  page_size: number;
  total: number;
  items?: DemoDetail[];
}

export const demoService = {
  async getPages(params: DemoPagesParams) {
    // API implementation: delegate mock paging/filtering to api/mock module.
    if (IS_MOCK_DEMO) {
      return getMockDemoPages(params);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<DemoPagesResponse>(API_ENDPOINTS.DEMOS.PAGES, params as Record<string, unknown>);
  },

  async create(payload: DemoCreate) {
    // API implementation: delegate mock create logic to api/mock module.
    if (IS_MOCK_DEMO) {
      return createMockDemo(payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<{ id: string }>(API_ENDPOINTS.DEMOS.CREATE, payload);
  },

  async update(id: string, payload: DemoUpdate) {
    // API implementation: delegate mock update logic to api/mock module.
    if (IS_MOCK_DEMO) {
      return updateMockDemo(id, payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.DEMOS.UPDATE(id), payload);
  },

  async remove(id: string, payload: DemoDelete) {
    // API implementation: delegate mock delete logic to api/mock module.
    if (IS_MOCK_DEMO) {
      return removeMockDemo(id, payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.request<void>({ method: "DELETE", url: API_ENDPOINTS.DEMOS.DELETE(id), data: payload });
  },

  async restore(ids: string[]) {
    // API implementation: delegate mock restore logic to api/mock module.
    if (IS_MOCK_DEMO) {
      return restoreMockDemo(ids);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.DEMOS.RESTORE, { ids });
  },
};

export default demoService;
