// Organization and member person admin API service
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
import type { PositionOffice, PositionTeam } from "@/const/positionEnums";

export type { PagesParams, DetailQueryParams, DeletePayload, BulkIdsPayload, PagesResponse };

// Position translations
export interface PositionTranslationInput {
  localeId: string;
  name: string;
  description?: string;
  remark?: string;
}

export interface PositionTranslationItem extends PositionTranslationInput {
  id?: string;
}

export interface PositionListItem {
  id: string;
  code: string;
  team?: PositionTeam;
  office?: PositionOffice;
  name?: string;
  canOwnMinistry: boolean;
  isActive: boolean;
}

export interface PositionDetail extends PositionListItem {
  sequence?: number;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
  translations?: PositionTranslationItem[];
  currentUserId?: string;
  currentUserDisplayName?: string;
}

export interface PositionWrite {
  team: PositionTeam;
  office: PositionOffice;
  canOwnMinistry?: boolean;
  isActive?: boolean;
  sequence?: number;
  translations?: PositionTranslationInput[];
}

export interface PositionCreate extends PositionWrite {
  code: string;
}

export type PositionUpdate = PositionWrite;

export interface PositionAssign {
  userId: string;
  startAt?: string;
}

export interface AssignablePositionItem {
  id: string;
  code: string;
  team?: PositionTeam;
  office?: PositionOffice;
  name?: string;
  incumbentUserId?: string;
  incumbentDisplayName?: string;
}

// Member person
export interface MemberPersonListItem {
  id: string;
  legalName?: string;
  userId?: string;
  email?: string;
  displayName?: string;
}

export type MemberPersonDetail = MemberPersonListItem;

export interface MemberPersonCreate {
  legalName?: string;
  userId?: string;
}

export interface MemberPersonUpdate {
  legalName?: string;
}

export interface MemberPersonLink {
  userId: string;
}

const emptyPages = <T>(): ApiResponse<PagesResponse<T>> => ({
  success: true,
  data: { page: 0, page_size: 10, total: 0, items: [] },
});

const emptyList = <T>(): ApiResponse<{ items: T[] }> => ({
  success: true,
  data: { items: [] },
});

class OrgService {
  // Positions
  async getPositionPages(params: PagesParams): Promise<ApiResponse<PagesResponse<PositionDetail>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.ORG.POSITIONS.PAGES, params as Record<string, unknown>);
  }

  async getPositionById(id: string, params?: DetailQueryParams): Promise<ApiResponse<PositionDetail>> {
    if (IS_MOCK_API) return { success: true, data: {} as PositionDetail };
    return httpClient.get(API_ENDPOINTS.ORG.POSITIONS.DETAIL(id), params as Record<string, unknown>);
  }

  async getAssignablePositions(): Promise<ApiResponse<{ items: AssignablePositionItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.ORG.POSITIONS.ASSIGNABLE);
  }

  async createPosition(payload: PositionCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.ORG.POSITIONS.CREATE, payload);
  }

  async updatePosition(id: string, payload: PositionUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.ORG.POSITIONS.UPDATE(id), payload);
  }

  async deletePosition(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.ORG.POSITIONS.DELETE(id),
      data: payload,
    });
  }

  async restorePositions(payload: BulkIdsPayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.ORG.POSITIONS.RESTORE, payload);
  }

  async assignPosition(id: string, payload: PositionAssign): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.ORG.POSITIONS.ASSIGN(id), payload);
  }

  // Member persons
  async getMemberPersonPages(params: PagesParams): Promise<ApiResponse<PagesResponse<MemberPersonDetail>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.ORG.MEMBERS.PAGES, params as Record<string, unknown>);
  }

  async getMemberPersonById(id: string): Promise<ApiResponse<MemberPersonDetail>> {
    if (IS_MOCK_API) return { success: true, data: {} as MemberPersonDetail };
    return httpClient.get(API_ENDPOINTS.ORG.MEMBERS.DETAIL(id));
  }

  async createMemberPerson(payload: MemberPersonCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.ORG.MEMBERS.CREATE, payload);
  }

  async updateMemberPerson(id: string, payload: MemberPersonUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.ORG.MEMBERS.UPDATE(id), payload);
  }

  async linkMemberPerson(id: string, payload: MemberPersonLink): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.ORG.MEMBERS.LINK(id), payload);
  }
}

export const orgService = new OrgService();
export default orgService;
