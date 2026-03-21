// Resource management service
import { API_ENDPOINTS } from "@/api";
import {
  changeMockResourceParent,
  changeMockResourceSequence,
  createMockResource,
  deleteMockResource,
  getMockAdminMenus,
  getMockResourceById,
  getMockResources,
  restoreMockResource,
  updateMockResource,
} from "@/api/mock/resource-mock";
import type { ApiResponse } from "@/types/api";
import type {
  DeleteResourceData,
  ResourceChangeParentData,
  ResourceChangeSequenceData,
  ResourceCreateData,
  ResourceMenuItem,
  ResourceMenusResponse,
  ResourceUpdateData,
} from "@/types/resource-admin";
import { IS_MOCK_API } from "@/config/env";
import { httpClient } from "./httpClient";

// Resource service class
class ResourceService {
  // Get resource list (supports querying deleted/non-deleted resources)
  async getResources(deleted: boolean = false): Promise<ApiResponse<ResourceMenusResponse>> {
    // API implementation: delegate mock filtering logic to api/mock module.
    if (IS_MOCK_API) {
      return getMockResources(deleted);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<ResourceMenusResponse>(`${API_ENDPOINTS.RESOURCES.LIST}?deleted=${deleted}`);
  }

  // Get resource details
  async getResource(id: string): Promise<ApiResponse<ResourceMenuItem>> {
    // API implementation: delegate mock single-resource lookup to api/mock module.
    if (IS_MOCK_API) {
      return getMockResourceById(id);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<ResourceMenuItem>(API_ENDPOINTS.RESOURCES.DETAIL(id));
  }

  // Get user permission menu (admin)
  async getAdminMenus(): Promise<ApiResponse<ResourceMenusResponse>> {
    // API implementation: delegate mock menu assembly to api/mock module.
    if (IS_MOCK_API) {
      return getMockAdminMenus();
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<ResourceMenusResponse>(API_ENDPOINTS.RESOURCES.MENUS);
  }

  // Change resource sequence
  async changeSequence(data: ResourceChangeSequenceData): Promise<ApiResponse<void>> {
    // API implementation: delegate mock sequence update to api/mock module.
    if (IS_MOCK_API) {
      return changeMockResourceSequence(data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<void>(API_ENDPOINTS.RESOURCES.CHANGE_SEQUENCE, data);
  }

  // Create resource
  async createResource(data: ResourceCreateData): Promise<ApiResponse<{ id: string; created_at: string; updated_at: string }>> {
    // API implementation: delegate mock resource creation to api/mock module.
    if (IS_MOCK_API) {
      return createMockResource(data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<{ id: string; created_at: string; updated_at: string }>(API_ENDPOINTS.RESOURCES.CREATE, data);
  }

  // Update resource
  async updateResource(id: string, data: ResourceUpdateData): Promise<ApiResponse<void>> {
    // API implementation: delegate mock resource update to api/mock module.
    if (IS_MOCK_API) {
      return updateMockResource(id, data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.RESOURCES.UPDATE(id), data);
  }

  // Delete resource
  async deleteResource(id: string, data?: DeleteResourceData): Promise<ApiResponse<void>> {
    // API implementation: delegate mock delete behavior to api/mock module.
    if (IS_MOCK_API) {
      return deleteMockResource(id, data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.delete<void>(API_ENDPOINTS.RESOURCES.DELETE(id), data);
  }

  // Restore resource
  async restoreResource(id: string): Promise<ApiResponse<void>> {
    // API implementation: delegate mock restore behavior to api/mock module.
    if (IS_MOCK_API) {
      return restoreMockResource(id);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.RESOURCES.RESTORE(id));
  }

  // Change parent resource
  async changeParent(id: string, data: ResourceChangeParentData): Promise<ApiResponse<void>> {
    // API implementation: delegate mock re-parent behavior to api/mock module.
    if (IS_MOCK_API) {
      return changeMockResourceParent(id, data);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.RESOURCES.CHANGE_PARENT(id), data);
  }
}

// Create global resource service instance
export const resourceService = new ResourceService();

export default resourceService;
