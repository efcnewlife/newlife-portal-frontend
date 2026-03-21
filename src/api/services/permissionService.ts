// Permission service
import { API_ENDPOINTS } from "@/api";
import {
  createMockPermission,
  getMockPermissionById,
  getMockPermissionPages,
  listMockPermissions,
  removeMockPermission,
  restoreMockPermissions,
  updateMockPermission,
} from "@/api/mock/permission-mock";
import type {
  ApiResponse,
  PermissionCreate,
  PermissionDelete,
  PermissionDetail,
  PermissionListItem,
  PermissionPage,
  PermissionUpdate,
} from "@/types/api";
import { IS_MOCK_API } from "@/config/env";
import { httpClient } from "./httpClient";

interface PermissionQueryParams extends Record<string, unknown> {
  page?: number;
  page_size?: number;
  order_by?: string;
  descending?: boolean;
  keyword?: string;
  deleted?: boolean;
  is_active?: boolean;
}

class PermissionService {
  async pages(params: PermissionQueryParams = {}): Promise<ApiResponse<PermissionPage>> {
    // API implementation: delegate mock pagination/filtering to api/mock module.
    if (IS_MOCK_API) {
      return getMockPermissionPages(params);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<PermissionPage>(API_ENDPOINTS.PERMISSIONS.PAGES, params);
  }

  async list(): Promise<ApiResponse<{ items: PermissionListItem[] }>> {
    // API implementation: delegate mock list generation to api/mock module.
    if (IS_MOCK_API) {
      return listMockPermissions();
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<{ items: PermissionListItem[] }>(API_ENDPOINTS.PERMISSIONS.LIST);
  }

  async getById(id: string): Promise<ApiResponse<PermissionDetail>> {
    // API implementation: delegate mock detail lookup to api/mock module.
    if (IS_MOCK_API) {
      return getMockPermissionById(id);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<PermissionDetail>(API_ENDPOINTS.PERMISSIONS.DETAIL(id));
  }

  async create(data: PermissionCreate): Promise<ApiResponse<{ id: string }>> {
    // API implementation: delegate mock create logic to api/mock module.
    if (IS_MOCK_API) {
      return createMockPermission(data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<{ id: string }>(API_ENDPOINTS.PERMISSIONS.CREATE, data);
  }

  async update(id: string, data: PermissionUpdate): Promise<ApiResponse<void>> {
    // API implementation: delegate mock update logic to api/mock module.
    if (IS_MOCK_API) {
      return updateMockPermission(id, data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.PERMISSIONS.UPDATE(id), data);
  }

  async remove(id: string, data: PermissionDelete): Promise<ApiResponse<void>> {
    // API implementation: delegate mock delete logic to api/mock module.
    if (IS_MOCK_API) {
      return removeMockPermission(id, data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.delete<void>(API_ENDPOINTS.PERMISSIONS.DELETE(id), { data });
  }

  async restore(ids: string[]): Promise<ApiResponse<void>> {
    // API implementation: delegate mock restore logic to api/mock module.
    if (IS_MOCK_API) {
      return restoreMockPermissions(ids);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.PERMISSIONS.RESTORE, { ids });
  }
}

export const permissionService = new PermissionService();
export default permissionService;
