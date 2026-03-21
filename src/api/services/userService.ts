import { API_ENDPOINTS, httpClient } from "@/api";
import { IS_MOCK_API } from "@/config/env";

export interface UserBase {
  id: string;
  phoneNumber?: string;
  email?: string;
  displayName?: string;
}

export interface UserDetail {
  id: string;
  phone_number: string;
  email: string;
  verified: boolean;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  last_login_at?: string;
  display_name?: string;
  gender?: number; // 0: Unknown, 1: Male, 2: Female
  created_at?: string;
  updated_at?: string;
  remark?: string;
}

export interface UserCreate {
  phone_number: string;
  email: string;
  password: string;
  password_confirm: string;
  verified?: boolean;
  is_active?: boolean;
  is_superuser?: boolean;
  is_admin?: boolean;
  display_name?: string;
  gender?: number;
  remark?: string;
}

export interface UserUpdate {
  phone_number: string;
  email: string;
  verified?: boolean;
  is_active?: boolean;
  is_superuser?: boolean;
  is_admin?: boolean;
  display_name?: string;
  gender?: number;
  remark?: string;
}

export interface UserDelete {
  reason?: string;
  permanent?: boolean;
}

export interface UserBulkDelete {
  ids: string[];
}

export interface UserPagesParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  order_by?: string;
  descending?: boolean;
  verified?: boolean;
  is_active?: boolean;
  is_superuser?: boolean;
  is_admin?: boolean;
  gender?: number;
  deleted?: boolean;
}

export interface UserPagesResponse {
  page: number; // 0-based from backend
  pageSize?: number; // API may return pageSize or page_size
  page_size?: number; // API may return pageSize or page_size
  total: number;
  items?: UserDetail[];
}

export interface UserListResponse {
  items?: UserBase[];
}

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
    display_name: "Template Admin",
    gender: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    remark: "Mock admin account",
    role_ids: ["role-superadmin"],
  },
];

export const userService = {
  async getPages(params: UserPagesParams) {
    // API implementation: perform filtering and pagination on in-memory user store.
    if (IS_MOCK_API) {
      const page = params.page ?? 0;
      const pageSize = params.page_size ?? 10;
      const keyword = (params.keyword || "").toLowerCase().trim();
      const deleted = params.deleted === true;
      const filtered = mockUsers.filter((item) => {
        if ((item.is_deleted || false) !== deleted) return false;
        if (!keyword) return true;
        return (item.email || "").toLowerCase().includes(keyword) || (item.display_name || "").toLowerCase().includes(keyword);
      });
      const start = page * pageSize;
      return {
        success: true,
        code: 200,
        data: {
          page,
          page_size: pageSize,
          total: filtered.length,
          items: filtered.slice(start, start + pageSize),
        },
      };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<UserPagesResponse>(API_ENDPOINTS.USER.PAGES, params as Record<string, unknown>);
  },

  async getList(params: { keyword?: string }) {
    // API implementation: return lightweight user list from in-memory store.
    if (IS_MOCK_API) {
      const keyword = (params.keyword || "").toLowerCase().trim();
      return {
        success: true,
        code: 200,
        data: {
          items: mockUsers
            .filter((item) => !item.is_deleted)
            .filter(
              (item) =>
                !keyword || (item.email || "").toLowerCase().includes(keyword) || (item.display_name || "").toLowerCase().includes(keyword),
            )
            .map((item) => ({
              id: item.id,
              email: item.email,
              phoneNumber: item.phone_number,
              displayName: item.display_name,
            })),
        },
      };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<UserListResponse>(API_ENDPOINTS.USER.LIST, params);
  },

  /** Return only users with FCM device tokens (same params as getList) */
  async getListWithDeviceToken(params: { keyword?: string }) {
    // API implementation: reuse mock list method for device-token list.
    if (IS_MOCK_API) {
      return this.getList(params);
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<UserListResponse>(API_ENDPOINTS.USER.LIST_WITH_DEVICE_TOKEN, params);
  },

  async getById(id: string) {
    // API implementation: return one user record from in-memory store.
    if (IS_MOCK_API) {
      const user = mockUsers.find((item) => item.id === id && !item.is_deleted);
      if (!user) {
        return { success: false, code: 404, message: "User not found", data: undefined as unknown as UserDetail };
      }
      return { success: true, code: 200, data: user };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<UserDetail>(API_ENDPOINTS.USER.DETAIL(id));
  },

  async create(payload: UserCreate) {
    // API implementation: create user in in-memory store.
    if (IS_MOCK_API) {
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
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<{ id: string }>(API_ENDPOINTS.USER.CREATE, payload);
  },

  async updateCurrentUser(payload: UserUpdate) {
    // API implementation: update current mock user profile in in-memory store.
    if (IS_MOCK_API) {
      mockUsers = mockUsers.map((item, index) =>
        index === 0 ? { ...item, ...payload, updated_at: new Date().toISOString(), phone_number: payload.phone_number } : item,
      );
      return { success: true, code: 200, data: undefined };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.USER.UPDATE_ME, payload);
  },

  async update(id: string, payload: UserUpdate) {
    // API implementation: update user record in in-memory store.
    if (IS_MOCK_API) {
      mockUsers = mockUsers.map((item) =>
        item.id === id
          ? {
              ...item,
              ...payload,
              phone_number: payload.phone_number,
              updated_at: new Date().toISOString(),
            }
          : item,
      );
      return { success: true, code: 200, data: undefined };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.USER.UPDATE(id), payload);
  },

  async remove(id: string, payload: UserDelete) {
    // API implementation: perform soft-delete/permanent-delete in in-memory store.
    if (IS_MOCK_API) {
      if (payload.permanent) {
        mockUsers = mockUsers.filter((item) => item.id !== id);
      } else {
        mockUsers = mockUsers.map((item) => (item.id === id ? { ...item, is_deleted: true, remark: payload.reason } : item));
      }
      return { success: true, code: 200, data: undefined };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.request<void>({ method: "DELETE", url: API_ENDPOINTS.USER.DELETE(id), data: payload });
  },

  async restore(ids: string[]) {
    // API implementation: restore soft-deleted users in in-memory store.
    if (IS_MOCK_API) {
      const idSet = new Set(ids);
      mockUsers = mockUsers.map((item) => (idSet.has(item.id) ? { ...item, is_deleted: false } : item));
      return { success: true, code: 200, data: undefined };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.put<void>(API_ENDPOINTS.USER.RESTORE, { ids });
  },

  async bindRoles(userId: string, roleIds: string[]) {
    // API implementation: bind role ids to mock user in in-memory store.
    if (IS_MOCK_API) {
      mockUsers = mockUsers.map((item) => (item.id === userId ? { ...item, role_ids: roleIds } : item));
      return { success: true, code: 200, data: undefined };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.post<void>(API_ENDPOINTS.USER.BIND_ROLE(userId), { role_ids: roleIds });
  },

  async getUserRoles(userId: string) {
    // API implementation: return role ids from in-memory mock user.
    if (IS_MOCK_API) {
      const user = mockUsers.find((item) => item.id === userId);
      return { success: true, code: 200, data: { role_ids: user?.role_ids || [] } };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<{ role_ids: string[] }>(API_ENDPOINTS.USER.ROLES(userId));
  },

  async getCurrentUser() {
    // API implementation: return first active mock user as current user.
    if (IS_MOCK_API) {
      const current = mockUsers.find((item) => !item.is_deleted) || mockUsers[0];
      if (!current) {
        return { success: false, code: 404, message: "Current user not found", data: undefined as unknown as UserDetail };
      }
      return { success: true, code: 200, data: current };
    }

    // API implementation: call backend endpoint in non-mock mode.
    return httpClient.get<UserDetail>(API_ENDPOINTS.USER.ME);
  },
};

export default userService;
