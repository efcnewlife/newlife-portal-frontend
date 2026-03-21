// Role service (aligned with backend Admin Role API)
import { API_ENDPOINTS } from "@/api";
import {
  assignMockRolePermissions,
  createMockRole,
  getMockRoleById,
  getMockRolePages,
  listMockRoles,
  removeMockRole,
  restoreMockRole,
  updateMockRole,
} from "@/api/mock/role-mock";
import type { ApiResponse } from "@/types/api";
import { IS_MOCK_API } from "@/config/env";
import { httpClient } from "./httpClient";

export interface RolePermissionItem {
  id: string;
  resourceName: string;
  displayName: string;
  code: string;
}

export interface RolePageItem extends Record<string, unknown> {
  id: string;
  code: string;
  name?: string;
  isActive: boolean;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
  description?: string;
  remark?: string;
  permissions: RolePermissionItem[];
}

export interface RolePagesResponse {
  page: number;
  page_size: number;
  total: number;
  items?: RolePageItem[];
}

export interface RoleCreate {
  code: string;
  name?: string;
  isActive?: boolean;
  description?: string;
  remark?: string;
  permissions?: string[]; // permission IDs
}

export type RoleUpdate = RoleCreate;

export interface RoleDelete {
  reason?: string;
  permanent?: boolean;
}

export interface RolePermissionAssign {
  permissionIds: string[];
}

export interface RoleBase {
  id: string;
  code: string;
  name?: string;
}

export interface RoleListResponse {
  items: RoleBase[];
}

class RoleService {
  async getPages(params: {
    page?: number;
    page_size?: number;
    keyword?: string;
    order_by?: string;
    descending?: boolean;
    deleted?: boolean;
  }): Promise<ApiResponse<RolePagesResponse>> {
    // API implementation: delegate mock pagination/filtering to api/mock module.
    if (IS_MOCK_API) {
      return getMockRolePages(params);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<RolePagesResponse>(API_ENDPOINTS.ROLES.PAGES, params);
  }

  async getById(id: string): Promise<ApiResponse<RolePageItem>> {
    // API implementation: delegate mock detail lookup to api/mock module.
    if (IS_MOCK_API) {
      return getMockRoleById(id);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<RolePageItem>(API_ENDPOINTS.ROLES.DETAIL(id));
  }

  async create(payload: RoleCreate) {
    // API implementation: delegate mock create logic to api/mock module.
    if (IS_MOCK_API) {
      return createMockRole(payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<{ id: string }>(API_ENDPOINTS.ROLES.CREATE, payload);
  }

  async update(id: string, payload: RoleUpdate) {
    // API implementation: delegate mock update logic to api/mock module.
    if (IS_MOCK_API) {
      return updateMockRole(id, payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.ROLES.UPDATE(id), payload);
  }

  async remove(id: string, payload: RoleDelete) {
    // API implementation: delegate mock delete logic to api/mock module.
    if (IS_MOCK_API) {
      return removeMockRole(id, payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.request<void>({ method: "DELETE", url: API_ENDPOINTS.ROLES.DELETE(id), data: payload });
  }

  async restore(id: string) {
    // API implementation: delegate mock restore logic to api/mock module.
    if (IS_MOCK_API) {
      return restoreMockRole(id);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.ROLES.RESTORE(id));
  }

  async assignPermissions(id: string, payload: RolePermissionAssign) {
    // API implementation: delegate mock permission-binding logic to api/mock module.
    if (IS_MOCK_API) {
      return assignMockRolePermissions(id, payload);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<void>(API_ENDPOINTS.ROLES.ASSIGN_PERMISSIONS(id), payload);
  }

  async getList(): Promise<ApiResponse<RoleListResponse>> {
    // API implementation: delegate mock list generation to api/mock module.
    if (IS_MOCK_API) {
      return listMockRoles();
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<RoleListResponse>(API_ENDPOINTS.ROLES.LIST);
  }
}

export const roleService = new RoleService();
export default roleService;
