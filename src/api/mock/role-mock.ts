import type { ApiResponse } from "@/types/api";
import type {
  RoleCreate,
  RoleDelete,
  RoleListResponse,
  RolePageItem,
  RolePagesResponse,
  RolePermissionAssign,
  RoleUpdate,
} from "@/api/services/roleService";

type MockRole = RolePageItem & { isDeleted?: boolean };

let mockRoles: MockRole[] = [
  {
    id: "role-superadmin",
    code: "superadmin",
    name: "Super Admin",
    isActive: true,
    description: "Template super admin role",
    permissions: [{ id: "perm-user-list", resourceName: "User", displayName: "User List", code: "system:user:list" }],
  },
];

export const getMockRolePages = (params: {
  page?: number;
  page_size?: number;
  keyword?: string;
  deleted?: boolean;
}): ApiResponse<RolePagesResponse> => {
  const page = params.page ?? 0;
  const pageSize = params.page_size ?? 10;
  const keyword = (params.keyword || "").toLowerCase().trim();
  const deleted = params.deleted === true;
  const filtered = mockRoles.filter((item) => {
    if ((item.isDeleted || false) !== deleted) return false;
    if (!keyword) return true;
    return item.code.toLowerCase().includes(keyword) || (item.name || "").toLowerCase().includes(keyword);
  });
  return {
    success: true,
    code: 200,
    data: { page, page_size: pageSize, total: filtered.length, items: filtered.slice(page * pageSize, page * pageSize + pageSize) },
  };
};

export const getMockRoleById = (id: string): ApiResponse<RolePageItem> => {
  const role = mockRoles.find((item) => item.id === id && !item.isDeleted);
  if (!role) return { success: false, code: 404, message: "Role not found", data: undefined as unknown as RolePageItem };
  return { success: true, code: 200, data: role };
};

export const createMockRole = (payload: RoleCreate): ApiResponse<{ id: string }> => {
  const id = `role-${Date.now()}`;
  mockRoles = [{ id, code: payload.code, name: payload.name, isActive: payload.isActive ?? true, permissions: [] }, ...mockRoles];
  return { success: true, code: 201, data: { id } };
};

export const updateMockRole = (id: string, payload: RoleUpdate): ApiResponse<void> => {
  mockRoles = mockRoles.map((item) =>
    item.id === id
      ? {
          ...item,
          code: payload.code,
          name: payload.name,
          isActive: payload.isActive ?? item.isActive,
          description: payload.description,
          remark: payload.remark,
        }
      : item
  );
  return { success: true, code: 200, data: undefined };
};

export const removeMockRole = (id: string, payload: RoleDelete): ApiResponse<void> => {
  if (payload.permanent) mockRoles = mockRoles.filter((item) => item.id !== id);
  else mockRoles = mockRoles.map((item) => (item.id === id ? { ...item, isDeleted: true, deleteReason: payload.reason } : item));
  return { success: true, code: 200, data: undefined };
};

export const restoreMockRole = (id: string): ApiResponse<void> => {
  mockRoles = mockRoles.map((item) => (item.id === id ? { ...item, isDeleted: false } : item));
  return { success: true, code: 200, data: undefined };
};

export const assignMockRolePermissions = (id: string, payload: RolePermissionAssign): ApiResponse<void> => {
  mockRoles = mockRoles.map((item) =>
    item.id === id
      ? {
          ...item,
          permissions: payload.permissionIds.map((permissionId) => ({
            id: permissionId,
            resourceName: "Resource",
            displayName: permissionId,
            code: permissionId,
          })),
        }
      : item
  );
  return { success: true, code: 200, data: undefined };
};

export const listMockRoles = (): ApiResponse<RoleListResponse> => ({
  success: true,
  code: 200,
  data: { items: mockRoles.filter((item) => !item.isDeleted).map((item) => ({ id: item.id, code: item.code, name: item.name })) },
});
