import type { DemoCreate, DemoDelete, DemoDetail, DemoPagesParams, DemoPagesResponse, DemoUpdate } from "@/api/services/demoService";
import type { ApiResponse } from "@/types/api";
import { withMockDelay } from "./common-mock";

type MockDemoItem = DemoDetail & {
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  is_deleted?: boolean;
  delete_reason?: string;
};

let mockDemoItems: MockDemoItem[] = [
  {
    id: "1",
    name: "Mock Item A",
    remark: "Seed data for template",
    age: 22,
    gender: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "mock-admin-user",
    updated_by: "mock-admin-user",
    is_deleted: false,
  },
  {
    id: "2",
    name: "Mock Item B",
    remark: "Second seed record",
    age: 28,
    gender: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: "mock-admin-user",
    updated_by: "mock-admin-user",
    is_deleted: false,
  },
];

export const getMockDemoPages = async (params: DemoPagesParams): Promise<ApiResponse<DemoPagesResponse>> => {
  await withMockDelay(120);
  const page = params.page ?? 0;
  const pageSize = params.page_size ?? 10;
  const keyword = params.keyword?.trim().toLowerCase() || "";
  const deleted = params.deleted === true;
  const filtered = mockDemoItems.filter((item) => {
    if ((item.is_deleted || false) !== deleted) return false;
    if (!keyword) return true;
    return `${item.name} ${item.remark || ""}`.toLowerCase().includes(keyword);
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

export const createMockDemo = async (payload: DemoCreate): Promise<ApiResponse<{ id: string }>> => {
  await withMockDelay(120);
  const now = new Date().toISOString();
  const item: MockDemoItem = {
    id: crypto.randomUUID(),
    name: payload.name,
    remark: payload.remark,
    age: payload.age,
    gender: payload.gender,
    created_at: now,
    updated_at: now,
    created_by: "mock-admin-user",
    updated_by: "mock-admin-user",
    is_deleted: false,
  };
  mockDemoItems = [item, ...mockDemoItems];
  return { success: true, code: 201, data: { id: item.id } };
};

export const updateMockDemo = async (id: string, payload: DemoUpdate): Promise<ApiResponse<void>> => {
  await withMockDelay(120);
  mockDemoItems = mockDemoItems.map((item) =>
    item.id === id ? { ...item, ...payload, updated_at: new Date().toISOString(), updated_by: "mock-admin-user" } : item,
  );
  return { success: true, code: 200, data: undefined };
};

export const removeMockDemo = async (id: string, payload: DemoDelete): Promise<ApiResponse<void>> => {
  await withMockDelay(120);
  mockDemoItems = mockDemoItems.map((item) =>
    item.id === id
      ? { ...item, is_deleted: true, delete_reason: payload.reason, updated_at: new Date().toISOString(), updated_by: "mock-admin-user" }
      : item,
  );
  return { success: true, code: 200, data: undefined };
};

export const restoreMockDemo = async (ids: string[]): Promise<ApiResponse<void>> => {
  await withMockDelay(120);
  const idSet = new Set(ids);
  mockDemoItems = mockDemoItems.map((item) =>
    idSet.has(item.id) ? { ...item, is_deleted: false, delete_reason: undefined, updated_at: new Date().toISOString() } : item,
  );
  return { success: true, code: 200, data: undefined };
};
