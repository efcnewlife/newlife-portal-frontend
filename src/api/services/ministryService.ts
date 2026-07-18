// Ministry admin API service
import { API_ENDPOINTS } from "@/api";
import { IS_MOCK_API } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import type {
  BulkIdsPayload,
  DeletePayload,
  DetailQueryParams,
  PagesParams,
  PagesResponse,
} from "./facilityService";
import { httpClient } from "./httpClient";

export type { PagesParams, DetailQueryParams, DeletePayload, BulkIdsPayload, PagesResponse };

export interface MinistryListItem {
  id: string;
  name?: string;
  status: string;
  hasPriorityBooking: boolean;
  isActive: boolean;
  ministryType?: MinistryCatalogRef;
  targetAudiences?: MinistryCatalogRef[];
}

export interface MinistryCatalogRef {
  id: string;
  code: string;
  name?: string;
}

export interface MinistryScheduleItem {
  id?: string;
  daysOfWeek: number[];
  startTime?: string;
  endTime?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  sequence?: number;
}

export interface MinistryTranslationInput {
  localeId: string;
  name: string;
  description?: string;
  remark?: string;
  scheduleNote?: string;
}

export interface MinistryTranslationItem extends MinistryTranslationInput {
  id?: string;
}

export interface MinistryMemberItem {
  userId: string;
  memberRole: string;
  email?: string;
  displayName?: string;
  remark?: string;
  contactEmail?: string;
}

export interface MinistryDetail extends MinistryListItem {
  ownerPositionId?: string;
  ministryTypeId?: string;
  sequence?: number;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
  translations?: MinistryTranslationItem[];
  members: MinistryMemberItem[];
  schedules?: MinistryScheduleItem[];
}

export interface MinistryWrite {
  name?: string;
  ownerPositionId?: string;
  ministryTypeId?: string;
  targetAudienceIds?: string[];
  schedules?: MinistryScheduleItem[];
  hasPriorityBooking?: boolean;
  isActive?: boolean;
  sequence?: number;
  translations?: MinistryTranslationInput[];
}

export type MinistryCreate = MinistryWrite;

export type MinistryUpdate = MinistryWrite;

export interface MinistryReplaceMembers {
  members: Array<{
    userId: string;
    memberRole: "primary" | "secondary";
    remark?: string;
    contactEmail?: string;
  }>;
}

export interface MinistryApprove {
  comment?: string;
}

export interface MinistryReject {
  rejectionReason: string;
  comment?: string;
}

const emptyPages = <T>(): ApiResponse<PagesResponse<T>> => ({
  success: true,
  data: { page: 0, page_size: 10, total: 0, items: [] },
});

const emptyList = <T>(): ApiResponse<{ items: T[] }> => ({
  success: true,
  data: { items: [] },
});

class MinistryService {
  async getMinistryPages(params: PagesParams): Promise<ApiResponse<PagesResponse<MinistryDetail>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.MINISTRY.MINISTRIES.PAGES, params as Record<string, unknown>);
  }

  async getMinistryList(): Promise<ApiResponse<{ items: MinistryListItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.MINISTRY.MINISTRIES.LIST);
  }

  async getMinistryById(id: string, params?: DetailQueryParams): Promise<ApiResponse<MinistryDetail>> {
    if (IS_MOCK_API) return { success: true, data: {} as MinistryDetail };
    return httpClient.get(API_ENDPOINTS.MINISTRY.MINISTRIES.DETAIL(id), params as Record<string, unknown>);
  }

  async createMinistry(payload: MinistryCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.MINISTRY.MINISTRIES.CREATE, payload);
  }

  async updateMinistry(id: string, payload: MinistryUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.MINISTRY.MINISTRIES.UPDATE(id), payload);
  }

  async deleteMinistry(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.MINISTRY.MINISTRIES.DELETE(id),
      data: payload,
    });
  }

  async restoreMinistries(payload: BulkIdsPayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.MINISTRY.MINISTRIES.RESTORE, payload);
  }

  async replaceMinistryMembers(id: string, payload: MinistryReplaceMembers): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.MINISTRY.MINISTRIES.MEMBERS(id), payload);
  }

  async submitMinistry(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.post(API_ENDPOINTS.MINISTRY.MINISTRIES.SUBMIT(id));
  }

  async approveMinistry(id: string, payload: MinistryApprove): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.post(API_ENDPOINTS.MINISTRY.MINISTRIES.APPROVE(id), payload);
  }

  async rejectMinistry(id: string, payload: MinistryReject): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.post(API_ENDPOINTS.MINISTRY.MINISTRIES.REJECT(id), payload);
  }

  async getMinistryApprovalPages(params: PagesParams): Promise<ApiResponse<PagesResponse<MinistryDetail>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.MINISTRY.APPROVALS.PAGES, params as Record<string, unknown>);
  }
}

export const ministryService = new MinistryService();
export default ministryService;
