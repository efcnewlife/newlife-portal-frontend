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
import { AdminResourceType } from "@/const/resource";

let mockResources: ResourceMenuItem[] = [
  {
    id: "res-dashboard",
    name: "Dashboard",
    key: "DASHBOARD",
    code: "dashboard",
    icon: "MdDashboard",
    path: "/",
    type: AdminResourceType.GENERAL,
    sequence: 1,
    is_visible: true,
    is_deleted: false,
  },
  {
    id: "res-system-user",
    name: "Users",
    key: "SYSTEM_USER",
    code: "system:user",
    icon: "MdPerson",
    path: "/system/users",
    type: AdminResourceType.SYSTEM,
    sequence: 2,
    is_visible: true,
    is_deleted: false,
  },
];

export const getMockResources = (deleted: boolean): ApiResponse<ResourceMenusResponse> => ({
  success: true,
  code: 200,
  data: { items: mockResources.filter((item) => (item.is_deleted || false) === deleted) },
});

export const getMockResourceById = (id: string): ApiResponse<ResourceMenuItem> => {
  const found = mockResources.find((item) => item.id === id);
  if (!found) {
    return { success: false, code: 404, message: "Resource not found", data: undefined as unknown as ResourceMenuItem };
  }
  return { success: true, code: 200, data: found };
};

export const getMockAdminMenus = (): ApiResponse<ResourceMenusResponse> => ({
  success: true,
  code: 200,
  data: { items: mockResources.filter((item) => item.is_visible !== false && !item.is_deleted) },
});

export const changeMockResourceSequence = (data: ResourceChangeSequenceData): ApiResponse<void> => {
  const first = mockResources.find((item) => item.id === data.id);
  const second = mockResources.find((item) => item.id === data.another_id);
  if (first) first.sequence = data.sequence;
  if (second) second.sequence = data.another_sequence;
  return { success: true, code: 200, data: undefined };
};

export const createMockResource = (data: ResourceCreateData): ApiResponse<{ id: string; created_at: string; updated_at: string }> => {
  const now = new Date().toISOString();
  const id = `res-${Date.now()}`;
  mockResources = [
    {
      id,
      name: data.name,
      key: data.key,
      code: data.code,
      path: data.path,
      icon: data.icon,
      type: data.type,
      is_visible: data.is_visible ?? true,
      description: data.description,
      remark: data.remark,
      pid: data.pid,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    },
    ...mockResources,
  ];
  return { success: true, code: 201, data: { id, created_at: now, updated_at: now } };
};

export const updateMockResource = (id: string, data: ResourceUpdateData): ApiResponse<void> => {
  mockResources = mockResources.map((item) => (item.id === id ? { ...item, ...data, updated_at: new Date().toISOString() } : item));
  return { success: true, code: 200, data: undefined };
};

export const deleteMockResource = (id: string, data?: DeleteResourceData): ApiResponse<void> => {
  if (data?.permanent) {
    mockResources = mockResources.filter((item) => item.id !== id);
  } else {
    mockResources = mockResources.map((item) => (item.id === id ? { ...item, is_deleted: true } : item));
  }
  return { success: true, code: 200, data: undefined };
};

export const restoreMockResource = (id: string): ApiResponse<void> => {
  mockResources = mockResources.map((item) => (item.id === id ? { ...item, is_deleted: false } : item));
  return { success: true, code: 200, data: undefined };
};

export const changeMockResourceParent = (id: string, data: ResourceChangeParentData): ApiResponse<void> => {
  mockResources = mockResources.map((item) => (item.id === id ? { ...item, pid: data.pid } : item));
  return { success: true, code: 200, data: undefined };
};
