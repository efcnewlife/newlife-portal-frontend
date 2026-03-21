import type { ApiResponse, PermissionCreate, PermissionDelete, PermissionDetail, PermissionListItem, PermissionPage, PermissionUpdate } from "@/types/api";

type MockPermission = PermissionDetail & { isDeleted?: boolean };

let mockPermissions: MockPermission[] = [
  {
    id: "perm-user-list",
    displayName: "User List",
    code: "system:user:list",
    isActive: true,
    description: "List users",
    resource: { id: "res-user", name: "User", key: "SYSTEM_USER", code: "system:user" },
    verb: { id: "verb-list", displayName: "List", action: "list" },
  },
  {
    id: "perm-role-list",
    displayName: "Role List",
    code: "system:role:list",
    isActive: true,
    description: "List roles",
    resource: { id: "res-role", name: "Role", key: "SYSTEM_ROLE", code: "system:role" },
    verb: { id: "verb-list", displayName: "List", action: "list" },
  },
];

export const getMockPermissionPages = (params: { page?: number; page_size?: number; keyword?: string; deleted?: boolean }): ApiResponse<PermissionPage> => {
  const page = Number(params.page ?? 0);
  const pageSize = Number(params.page_size ?? 10);
  const keyword = String(params.keyword ?? "").toLowerCase().trim();
  const deleted = params.deleted === true;
  const filtered = mockPermissions.filter((item) => {
    if ((item.isDeleted || false) !== deleted) return false;
    if (!keyword) return true;
    return item.displayName.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword);
  });
  return {
    success: true,
    code: 200,
    data: {
      page,
      page_size: pageSize,
      total: filtered.length,
      items: filtered.slice(page * pageSize, page * pageSize + pageSize).map((item) => ({
        id: item.id,
        displayName: item.displayName,
        code: item.code,
        isActive: item.isActive,
        description: item.description,
        remark: item.remark,
        resourceName: item.resource.name,
        verbName: item.verb.displayName,
      })),
    },
  };
};

export const listMockPermissions = (): ApiResponse<{ items: PermissionListItem[] }> => ({
  success: true,
  code: 200,
  data: {
    items: mockPermissions
      .filter((item) => !item.isDeleted)
      .map((item) => ({
        id: item.id,
        displayName: item.displayName,
        code: item.code,
        isActive: item.isActive,
        description: item.description,
        remark: item.remark,
        resourceId: item.resource.id,
        verbId: item.verb.id,
      })),
  },
});

export const getMockPermissionById = (id: string): ApiResponse<PermissionDetail> => {
  const found = mockPermissions.find((item) => item.id === id && !item.isDeleted);
  if (!found) return { success: false, code: 404, message: "Permission not found", data: undefined as unknown as PermissionDetail };
  return { success: true, code: 200, data: found };
};

export const createMockPermission = (data: PermissionCreate): ApiResponse<{ id: string }> => {
  const id = `perm-${Date.now()}`;
  mockPermissions.unshift({
    id,
    displayName: data.displayName,
    code: data.code,
    isActive: data.isActive,
    description: data.description,
    remark: data.remark,
    resource: { id: data.resourceId, name: "Resource", key: "RESOURCE", code: "resource" },
    verb: { id: data.verbId, displayName: "Verb", action: "list" },
  });
  return { success: true, code: 201, data: { id } };
};

export const updateMockPermission = (id: string, data: PermissionUpdate): ApiResponse<void> => {
  mockPermissions = mockPermissions.map((item) =>
    item.id === id
      ? {
          ...item,
          displayName: data.displayName,
          code: data.code,
          isActive: data.isActive,
          description: data.description,
          remark: data.remark,
          resource: data.resourceId ? { ...item.resource, id: data.resourceId } : item.resource,
          verb: data.verbId ? { ...item.verb, id: data.verbId } : item.verb,
        }
      : item
  );
  return { success: true, code: 200, data: undefined };
};

export const removeMockPermission = (id: string, data: PermissionDelete): ApiResponse<void> => {
  mockPermissions = mockPermissions.map((item) => (item.id === id ? { ...item, isDeleted: !data.permanent } : item));
  if (data.permanent) mockPermissions = mockPermissions.filter((item) => item.id !== id);
  return { success: true, code: 200, data: undefined };
};

export const restoreMockPermissions = (ids: string[]): ApiResponse<void> => {
  const idSet = new Set(ids);
  mockPermissions = mockPermissions.map((item) => (idSet.has(item.id) ? { ...item, isDeleted: false } : item));
  return { success: true, code: 200, data: undefined };
};
