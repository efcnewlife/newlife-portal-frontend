import { API_ENDPOINTS } from "@/api";
import { IS_MOCK_API } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import { httpClient } from "./httpClient";

export type SettingValueType = "string" | "number" | "boolean" | "object" | "array";

export interface SettingItem {
  id: string;
  namespace: string;
  settingKey: string;
  valueType: SettingValueType;
  value: unknown;
  isBuiltIn: boolean;
  isActive: boolean;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface SettingList {
  items: SettingItem[];
}

export interface SettingListParams {
  namespace?: string;
  deleted?: boolean;
}

export interface SettingCreate {
  namespace: string;
  settingKey: string;
  valueType: SettingValueType;
  value: unknown;
  remark?: string | null;
  isActive?: boolean;
}

export interface SettingUpdate {
  value: unknown;
  remark?: string | null;
}

export interface SettingDelete {
  reason?: string;
  permanent?: boolean;
}

export interface SettingByKeyParams {
  namespace: string;
  settingKey: string;
}

const emptyList = (): ApiResponse<SettingList> => ({
  success: true,
  data: { items: [] },
});

class SettingService {
  async list(params?: SettingListParams): Promise<ApiResponse<SettingList>> {
    if (IS_MOCK_API) return emptyList();
    const query: Record<string, string | boolean> = {};
    if (params?.namespace) query.namespace = params.namespace;
    if (params?.deleted) query.deleted = true;
    return httpClient.get<SettingList>(
      API_ENDPOINTS.SETTING.LIST,
      Object.keys(query).length > 0 ? query : undefined,
    );
  }

  async getById(id: string): Promise<ApiResponse<SettingItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as SettingItem };
    return httpClient.get<SettingItem>(API_ENDPOINTS.SETTING.DETAIL(id));
  }

  async getByKey(params: SettingByKeyParams): Promise<ApiResponse<SettingItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as SettingItem };
    return httpClient.get<SettingItem>(API_ENDPOINTS.SETTING.BY_KEY, {
      namespace: params.namespace,
      settingKey: params.settingKey,
    });
  }

  async create(payload: SettingCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "mock-id" } };
    return httpClient.post<{ id: string }>(API_ENDPOINTS.SETTING.CREATE, payload);
  }

  async update(id: string, payload: SettingUpdate): Promise<ApiResponse<SettingItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as SettingItem };
    return httpClient.put<SettingItem>(API_ENDPOINTS.SETTING.UPDATE(id), payload);
  }

  async delete(id: string, payload: SettingDelete): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined };
    return httpClient.delete<void>(API_ENDPOINTS.SETTING.DELETE(id), { data: payload });
  }

  async restore(ids: string[]): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined };
    return httpClient.put<void>(API_ENDPOINTS.SETTING.RESTORE, { ids });
  }
}

export const settingService = new SettingService();
export default settingService;
