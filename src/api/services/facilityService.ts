// Facility admin API service
import { API_ENDPOINTS } from "@/api";
import { IS_MOCK_API } from "@/config/env";
import type { ApiResponse } from "@/types/api";
import { httpClient } from "./httpClient";

export interface PagesParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  order_by?: string;
  descending?: boolean;
  deleted?: boolean;
}

export interface DetailQueryParams {
  all_locales?: boolean;
}

export interface PagesResponse<T> {
  page: number;
  page_size: number;
  total: number;
  items?: T[];
}

export interface DeletePayload {
  reason?: string;
  permanent?: boolean;
}

export interface BulkIdsPayload {
  ids: string[];
}

// Room
export interface FacilityTranslationInput {
  localeId: string;
  name: string;
  description?: string;
}

export interface FacilityTranslationItem extends FacilityTranslationInput {
  id?: string;
}

export interface RoomListItem {
  id: string;
  code: string;
  name?: string;
}

export interface RoomDetail extends RoomListItem {
  roomNumber?: string;
  capacity?: number;
  isActive: boolean;
  sequence?: number;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
  description?: string;
  translations?: FacilityTranslationItem[];
}

export interface RoomWrite {
  name?: string;
  roomNumber?: string;
  capacity?: number;
  isActive?: boolean;
  sequence?: number;
  translations?: FacilityTranslationInput[];
}

export interface RoomCreate extends RoomWrite {
  code: string;
}

export type RoomUpdate = RoomWrite;

// Room slot template
export interface RoomSlotTemplateItem {
  id: string;
  facilityId: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
}

export type RoomSlotTemplateCreate = Omit<
  RoomSlotTemplateItem,
  "id" | "createAt" | "createdBy" | "updateAt" | "updatedBy" | "deleteReason"
>;
export type RoomSlotTemplateUpdate = RoomSlotTemplateCreate;

// Room blackout
export type RoomBlackoutKind = "one_off" | "recurring";

export interface RoomBlackoutItem {
  id: string;
  facilityId?: string | null;
  name: string;
  reason: string;
  kind: RoomBlackoutKind;
  blackoutDate?: string;
  daysOfWeek?: number[];
  startTime: string;
  endTime: string;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
}

export type RoomBlackoutCreate = Omit<
  RoomBlackoutItem,
  "id" | "createAt" | "createdBy" | "updateAt" | "updatedBy" | "deleteReason"
>;
export type RoomBlackoutUpdate = RoomBlackoutCreate;

// Rental rate applicability (lives on templates)
export type RateApplicabilityLeaf =
  | { op: "hours_gte"; value: number | string }
  | { op: "hours_lt"; value: number | string }
  | { op: "hours_range"; min?: number | string; max: number | string; max_exclusive?: boolean };

export type RateApplicabilityRule =
  | RateApplicabilityLeaf
  | { all: RateApplicabilityRule[] }
  | { any: RateApplicabilityRule[] }
  | { not: RateApplicabilityRule };

// Rental rate template
export interface RentalRateTemplateItem {
  id: string;
  name: string;
  billingUnit: string;
  applicability?: RateApplicabilityRule | null;
  unitAmount: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
}

export interface RentalRateTemplateWrite {
  name: string;
  billingUnit: string;
  applicability?: RateApplicabilityRule | null;
  unitAmount: number;
  currency?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export type RentalRateTemplateCreate = RentalRateTemplateWrite;
export type RentalRateTemplateUpdate = RentalRateTemplateWrite;

export interface RentalRateTemplateEmbed {
  id: string;
  name: string;
  billingUnit: string;
  applicability?: RateApplicabilityRule | null;
  unitAmount: number;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

// Rental rate (room/global binding to a template; price from template)
export interface RentalRateItem {
  id: string;
  facilityId?: string | null;
  templateId: string;
  isActive: boolean;
  createAt?: string;
  createdBy?: string;
  updateAt?: string;
  updatedBy?: string;
  deleteReason?: string;
  template?: RentalRateTemplateEmbed;
}

export interface RentalRateWrite {
  facilityId: string;
  templateId: string;
  isActive?: boolean;
}

export type RentalRateCreate = RentalRateWrite;
export type RentalRateUpdate = RentalRateWrite;

export interface PreviewQuoteRoomLine {
  facilityId: string;
  billedHours: string | number;
}

export interface PreviewQuoteRequest {
  bookingType: string;
  isMissionAligned?: boolean;
  currency?: string;
  asOfDate?: string;
  roomLines?: PreviewQuoteRoomLine[];
  surchargeCodes?: string[];
}

export interface PreviewQuoteRoomLineResult {
  facilityId: string;
  billedHours: string | number;
  rentalRateName: string;
  billingUnit: string;
  unitAmount: string | number;
  currency: string;
  applicability?: Record<string, unknown> | null;
  isDefault?: boolean;
  lineSubtotal: string | number;
}

export interface PreviewQuoteResponse {
  subtotalAmount: string | number;
  discountPercent: string | number;
  discountAmount: string | number;
  surchargeAmount: string | number;
  quotedAmount: string | number;
  currency: string;
  roomLines: PreviewQuoteRoomLineResult[];
}

// Rental catalog
export interface DiscountRuleItem {
  id: string;
  code: string;
  percentOff: string | number;
  isActive: boolean;
  description?: string;
  createAt?: string;
  updateAt?: string;
}

export interface DiscountRuleWrite {
  code: string;
  percentOff: string | number;
  isActive?: boolean;
  description?: string;
}

export interface SurchargeItem {
  id: string;
  code: string;
  chargeType: string;
  unitAmount: string | number;
  currency: string;
  isActive: boolean;
  appliesToBookingType?: string;
  remark?: string;
  createAt?: string;
  updateAt?: string;
}

export interface SurchargeWrite {
  code: string;
  chargeType: string;
  unitAmount: string | number;
  currency?: string;
  isActive?: boolean;
  appliesToBookingType?: string;
  remark?: string;
}

export interface PolicySettingItem {
  id: string;
  settingKey: string;
  facilityId?: string;
  amount: string | number;
  currency: string;
  isActive: boolean;
  createAt?: string;
  updateAt?: string;
}

export interface PolicySettingUpdate {
  amount: string | number;
  currency?: string;
  isActive?: boolean;
}

// Booking
export interface BookingPagesParams extends PagesParams {
  facilityId?: string;
  userId?: string;
  status?: string;
  bookingType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BookingListItem {
  id: string;
  userId: string;
  userEmail?: string;
  userDisplayName?: string;
  facilityId?: string;
  facilityName?: string;
  facilityNames?: string[];
  bookingType: string;
  startAt: string;
  endAt: string;
  status: string;
  quotedAmount?: string | number;
  currency?: string;
  createdAt?: string;
}

export interface BookingRoomLine {
  id: string;
  facilityId: string;
  facilityName?: string;
  facilityCode?: string;
  sequence: number;
  startAt: string;
  endAt: string;
  billedHours?: string | number;
  rentalRateName?: string;
  billingUnit?: string;
  unitAmount?: string | number;
  currency?: string;
  applicability?: Record<string, unknown> | null;
  isDefault?: boolean;
  lineSubtotal?: string | number;
}

export interface BookingSlot {
  id: string;
  facilityId: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface BookingDetail extends BookingListItem {
  ministryId?: string;
  /** iCal RRULE string (RFC 5545); series anchor is startAt */
  recurrenceRule?: string;
  recurrenceEndAt?: string;
  isMissionAligned: boolean;
  subtotalAmount?: string | number;
  discountPercent?: string | number;
  discountAmount?: string | number;
  surchargeAmount?: string | number;
  depositAmount?: string | number;
  cancelledAt?: string;
  cancelReason?: string;
  remark?: string;
  createdById?: string;
  createdBy?: string;
  rooms: BookingRoomLine[];
  slots: BookingSlot[];
}

export interface BookingRoomInput {
  facilityId: string;
  startAt?: string;
  endAt?: string;
  sequence?: number;
}

export interface BookingCreate {
  userId: string;
  startAt: string;
  endAt: string;
  isMissionAligned?: boolean;
  ministryId?: string;
  rooms: BookingRoomInput[];
  surchargeCodes?: string[];
  remark?: string;
}

export interface BookingUpdate {
  startAt: string;
  endAt: string;
  isMissionAligned?: boolean;
  ministryId?: string;
  rooms?: BookingRoomInput[];
  surchargeCodes?: string[];
}

export interface BookingCancel {
  scope?: string;
  cancelReason?: string;
}

// Override log
export interface OverrideLogPagesParams extends PagesParams {
  facilityId?: string;
  overriddenById?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface OverrideLogItem {
  id: string;
  facilityBookingId: string;
  overriddenBookingId?: string;
  overriddenById: string;
  overriddenByName?: string;
  facilityId: string;
  facilityName?: string;
  outcome: string;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}

const emptyPages = <T>(): ApiResponse<PagesResponse<T>> => ({
  success: true,
  data: { page: 0, page_size: 10, total: 0, items: [] },
});

const emptyList = <T>(): ApiResponse<{ items: T[] }> => ({
  success: true,
  data: { items: [] },
});

class FacilityService {
  // Rooms
  async getRoomPages(params: PagesParams): Promise<ApiResponse<PagesResponse<RoomDetail>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOMS.PAGES, params as Record<string, unknown>);
  }

  async getRoomList(): Promise<ApiResponse<{ items: RoomListItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOMS.LIST);
  }

  async getRoomById(id: string, params?: DetailQueryParams): Promise<ApiResponse<RoomDetail>> {
    if (IS_MOCK_API) return { success: true, data: {} as RoomDetail };
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOMS.DETAIL(id), params as Record<string, unknown>);
  }

  async createRoom(payload: RoomCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.ROOMS.CREATE, payload);
  }

  async updateRoom(id: string, payload: RoomUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.ROOMS.UPDATE(id), payload);
  }

  async deleteRoom(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({ method: "DELETE", url: API_ENDPOINTS.FACILITY.ROOMS.DELETE(id), data: payload });
  }

  async restoreRooms(payload: BulkIdsPayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.ROOMS.RESTORE, payload);
  }

  // Room slot templates
  async getRoomSlotTemplatePages(params: PagesParams & { facilityId?: string }): Promise<ApiResponse<PagesResponse<RoomSlotTemplateItem>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.PAGES, params as Record<string, unknown>);
  }

  async getRoomSlotTemplateList(facilityId: string): Promise<ApiResponse<{ items: RoomSlotTemplateItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.LIST, { facilityId });
  }

  async getRoomSlotTemplateById(id: string): Promise<ApiResponse<RoomSlotTemplateItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as RoomSlotTemplateItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.DETAIL(id));
  }

  async createRoomSlotTemplate(payload: RoomSlotTemplateCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.CREATE, payload);
  }

  async updateRoomSlotTemplate(id: string, payload: RoomSlotTemplateUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.UPDATE(id), payload);
  }

  async deleteRoomSlotTemplate(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.DELETE(id),
      data: payload,
    });
  }

  async restoreRoomSlotTemplate(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.ROOM_SLOT_TEMPLATES.RESTORE(id));
  }

  // Room blackouts
  async getRoomBlackoutPages(params: PagesParams & { facilityId?: string }): Promise<ApiResponse<PagesResponse<RoomBlackoutItem>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.PAGES, params as Record<string, unknown>);
  }

  async getRoomBlackoutList(facilityId?: string | null): Promise<ApiResponse<{ items: RoomBlackoutItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.LIST, facilityId ? { facilityId } : undefined);
  }

  async getRoomBlackoutById(id: string): Promise<ApiResponse<RoomBlackoutItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as RoomBlackoutItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.DETAIL(id));
  }

  async createRoomBlackout(payload: RoomBlackoutCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.CREATE, payload);
  }

  async updateRoomBlackout(id: string, payload: RoomBlackoutUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.UPDATE(id), payload);
  }

  async deleteRoomBlackout(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.DELETE(id),
      data: payload,
    });
  }

  async restoreRoomBlackout(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.ROOM_BLACKOUTS.RESTORE(id));
  }

  // Rental rate templates
  async getRentalRateTemplatePages(
    params: PagesParams
  ): Promise<ApiResponse<PagesResponse<RentalRateTemplateItem>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.PAGES, params as Record<string, unknown>);
  }

  async getRentalRateTemplateList(): Promise<ApiResponse<{ items: RentalRateTemplateItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.LIST);
  }

  async getRentalRateTemplateById(id: string): Promise<ApiResponse<RentalRateTemplateItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as RentalRateTemplateItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.DETAIL(id));
  }

  async createRentalRateTemplate(payload: RentalRateTemplateCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.CREATE, payload);
  }

  async updateRentalRateTemplate(id: string, payload: RentalRateTemplateUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.UPDATE(id), payload);
  }

  async deleteRentalRateTemplate(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.DELETE(id),
      data: payload,
    });
  }

  async restoreRentalRateTemplate(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.RENTAL_RATE_TEMPLATES.RESTORE(id));
  }

  // Rental rates
  async getRentalRatePages(
    params: PagesParams & { facilityId?: string }
  ): Promise<ApiResponse<PagesResponse<RentalRateItem>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.RENTAL_RATES.PAGES, params as Record<string, unknown>);
  }

  async getRentalRateList(params?: {
    facilityId?: string;
  }): Promise<ApiResponse<{ items: RentalRateItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.RENTAL_RATES.LIST, params as Record<string, unknown>);
  }

  async previewQuote(payload: PreviewQuoteRequest): Promise<ApiResponse<PreviewQuoteResponse>> {
    if (IS_MOCK_API) return { success: true, data: {} as PreviewQuoteResponse };
    return httpClient.post(API_ENDPOINTS.FACILITY.RENTAL_RATES.PREVIEW_QUOTE, payload);
  }

  async getRentalRateById(id: string): Promise<ApiResponse<RentalRateItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as RentalRateItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.RENTAL_RATES.DETAIL(id));
  }

  async createRentalRate(payload: RentalRateCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.RENTAL_RATES.CREATE, payload);
  }

  async updateRentalRate(id: string, payload: RentalRateUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.RENTAL_RATES.UPDATE(id), payload);
  }

  async deleteRentalRate(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.FACILITY.RENTAL_RATES.DELETE(id),
      data: payload,
    });
  }

  async restoreRentalRate(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.RENTAL_RATES.RESTORE(id));
  }

  // Discount rules
  async listDiscountRules(): Promise<ApiResponse<{ items: DiscountRuleItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.DISCOUNT_RULES.LIST);
  }

  async getDiscountRule(id: string): Promise<ApiResponse<DiscountRuleItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as DiscountRuleItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.DISCOUNT_RULES.DETAIL(id));
  }

  async createDiscountRule(payload: DiscountRuleWrite): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.DISCOUNT_RULES.CREATE, payload);
  }

  async updateDiscountRule(id: string, payload: DiscountRuleWrite): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.DISCOUNT_RULES.UPDATE(id), payload);
  }

  async deleteDiscountRule(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.FACILITY.DISCOUNT_RULES.DELETE(id),
      data: payload,
    });
  }

  // Surcharges
  async listSurcharges(): Promise<ApiResponse<{ items: SurchargeItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.SURCHARGES.LIST);
  }

  async getSurcharge(id: string): Promise<ApiResponse<SurchargeItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as SurchargeItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.SURCHARGES.DETAIL(id));
  }

  async createSurcharge(payload: SurchargeWrite): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.SURCHARGES.CREATE, payload);
  }

  async updateSurcharge(id: string, payload: SurchargeWrite): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.SURCHARGES.UPDATE(id), payload);
  }

  async deleteSurcharge(id: string, payload: DeletePayload): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.request({
      method: "DELETE",
      url: API_ENDPOINTS.FACILITY.SURCHARGES.DELETE(id),
      data: payload,
    });
  }

  // Policy settings
  async listPolicySettings(facilityId?: string): Promise<ApiResponse<{ items: PolicySettingItem[] }>> {
    if (IS_MOCK_API) return emptyList();
    return httpClient.get(API_ENDPOINTS.FACILITY.POLICY_SETTINGS.LIST, facilityId ? { facilityId } : undefined);
  }

  async getPolicySetting(id: string): Promise<ApiResponse<PolicySettingItem>> {
    if (IS_MOCK_API) return { success: true, data: {} as PolicySettingItem };
    return httpClient.get(API_ENDPOINTS.FACILITY.POLICY_SETTINGS.DETAIL(id));
  }

  async updatePolicySetting(id: string, payload: PolicySettingUpdate): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.put(API_ENDPOINTS.FACILITY.POLICY_SETTINGS.UPDATE(id), payload);
  }

  // Bookings
  async getBookingPages(params: BookingPagesParams): Promise<ApiResponse<PagesResponse<BookingListItem>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.BOOKINGS.PAGES, params as Record<string, unknown>);
  }

  async getBookingById(id: string): Promise<ApiResponse<BookingDetail>> {
    if (IS_MOCK_API) return { success: true, data: {} as BookingDetail };
    return httpClient.get(API_ENDPOINTS.FACILITY.BOOKINGS.DETAIL(id));
  }

  async createBooking(payload: BookingCreate): Promise<ApiResponse<{ id: string }>> {
    if (IS_MOCK_API) return { success: true, data: { id: "mock-booking-id" } };
    return httpClient.post(API_ENDPOINTS.FACILITY.BOOKINGS.CREATE, payload);
  }

  async updateBooking(id: string, payload: BookingUpdate): Promise<ApiResponse<BookingDetail>> {
    if (IS_MOCK_API) return { success: true, data: {} as BookingDetail };
    return httpClient.put(API_ENDPOINTS.FACILITY.BOOKINGS.UPDATE(id), payload);
  }

  async cancelBooking(id: string, payload: BookingCancel): Promise<ApiResponse<void>> {
    if (IS_MOCK_API) return { success: true, data: undefined as void };
    return httpClient.post(API_ENDPOINTS.FACILITY.BOOKINGS.CANCEL(id), payload);
  }

  // Override logs
  async getOverrideLogPages(params: OverrideLogPagesParams): Promise<ApiResponse<PagesResponse<OverrideLogItem>>> {
    if (IS_MOCK_API) return emptyPages();
    return httpClient.get(API_ENDPOINTS.FACILITY.BOOKING_OVERRIDE_LOGS.PAGES, params as Record<string, unknown>);
  }
}

export const facilityService = new FacilityService();
export default facilityService;
