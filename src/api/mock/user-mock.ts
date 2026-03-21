import type {
  UserBase,
  UserCreate,
  UserDelete,
  UserDetail,
  UserListResponse,
  UserPagesParams,
  UserPagesResponse,
  UserUpdate,
} from "@/api/services/userService";
import type { ApiResponse } from "@/types/api";

type MockUser = UserDetail & { role_ids?: string[]; is_deleted?: boolean };

let mockUsers: MockUser[] = [
  {
    id: "user-admin",
    phone_number: "0912345678",
    email: "admin@example.com",
    verified: true,
    is_active: true,
    is_superuser: true,
    is_admin: true,
    display_name: "Newlife Portal Admin",
    gender: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    remark: "Mock admin account",
    role_ids: ["role-superadmin"],
  },
];

export const getMockUserPages = (params: UserPagesParams): ApiResponse<UserPagesResponse> => {
  const page = params.page ?? 0;
  const pageSize = params.page_size ?? 10;
  const keyword = (params.keyword || "").toLowerCase().trim();
  const deleted = params.deleted === true;
  const filtered = mockUsers.filter((item) => {
    if ((item.is_deleted || false) !== deleted) return false;
    if (!keyword) return true;
    return (item.email || "").toLowerCase().includes(keyword) || (item.display_name || "").toLowerCase().includes(keyword);
  });
  return {
    success: true,
    code: 200,
    data: {
      page,
      page_size: pageSize,
      total: filtered.length,
      items: filtered.slice(page * pageSize, page * pageSize + pageSize),
    },
  };
};

export const listMockUsers = (keyword?: string): ApiResponse<UserListResponse> => {
  const text = (keyword || "").toLowerCase().trim();
  const items: UserBase[] = mockUsers
    .filter((item) => !item.is_deleted)
    .filter((item) => !text || (item.email || "").toLowerCase().includes(text) || (item.display_name || "").toLowerCase().includes(text))
    .map((item) => ({
      id: item.id,
      email: item.email,
      phoneNumber: item.phone_number,
      displayName: item.display_name,
    }));
  return { success: true, code: 200, data: { items } };
};

export const getMockUserById = (id: string): ApiResponse<UserDetail> => {
  const user = mockUsers.find((item) => item.id === id && !item.is_deleted);
  if (!user) return { success: false, code: 404, message: "User not found", data: undefined as unknown as UserDetail };
  return { success: true, code: 200, data: user };
};

export const createMockUser = (payload: UserCreate): ApiResponse<{ id: string }> => {
  const id = `user-${Date.now()}`;
  const user: MockUser = {
    id,
    phone_number: payload.phone_number,
    email: payload.email,
    verified: payload.verified ?? false,
    is_active: payload.is_active ?? true,
    is_superuser: payload.is_superuser ?? false,
    is_admin: payload.is_admin ?? false,
    display_name: payload.display_name,
    gender: payload.gender,
    remark: payload.remark,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    role_ids: [],
  };
  mockUsers = [user, ...mockUsers];
  return { success: true, code: 201, data: { id } };
};

export const updateMockCurrentUser = (payload: UserUpdate): ApiResponse<void> => {
  mockUsers = mockUsers.map((item, index) =>
    index === 0 ? { ...item, ...payload, phone_number: payload.phone_number, updated_at: new Date().toISOString() } : item,
  );
  return { success: true, code: 200, data: undefined };
};

export const updateMockUser = (id: string, payload: UserUpdate): ApiResponse<void> => {
  mockUsers = mockUsers.map((item) =>
    item.id === id ? { ...item, ...payload, phone_number: payload.phone_number, updated_at: new Date().toISOString() } : item,
  );
  return { success: true, code: 200, data: undefined };
};

export const removeMockUser = (id: string, payload: UserDelete): ApiResponse<void> => {
  if (payload.permanent) mockUsers = mockUsers.filter((item) => item.id !== id);
  else mockUsers = mockUsers.map((item) => (item.id === id ? { ...item, is_deleted: true, remark: payload.reason } : item));
  return { success: true, code: 200, data: undefined };
};

export const restoreMockUsers = (ids: string[]): ApiResponse<void> => {
  const idSet = new Set(ids);
  mockUsers = mockUsers.map((item) => (idSet.has(item.id) ? { ...item, is_deleted: false } : item));
  return { success: true, code: 200, data: undefined };
};

export const bindMockUserRoles = (userId: string, roleIds: string[]): ApiResponse<void> => {
  mockUsers = mockUsers.map((item) => (item.id === userId ? { ...item, role_ids: roleIds } : item));
  return { success: true, code: 200, data: undefined };
};

export const getMockUserRoles = (userId: string): ApiResponse<{ role_ids: string[] }> => {
  const user = mockUsers.find((item) => item.id === userId);
  return { success: true, code: 200, data: { role_ids: user?.role_ids || [] } };
};

export const getMockCurrentUser = (): ApiResponse<UserDetail> => {
  const current = mockUsers.find((item) => !item.is_deleted) || mockUsers[0];
  if (!current) return { success: false, code: 404, message: "Current user not found", data: undefined as unknown as UserDetail };
  return { success: true, code: 200, data: current };
};
