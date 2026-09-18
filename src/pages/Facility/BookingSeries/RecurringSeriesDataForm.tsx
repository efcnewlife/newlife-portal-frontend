import {
  facilityService,
  type PreviewRecurringBookingSeriesPayload,
  type SurchargeItem,
} from "@/api/services/facilityService";
import ministryService, { type MinistryListItem } from "@/api/services/ministryService";
import userService, { type UserBase } from "@/api/services/userService";
import { usePickerLabels } from "@/hooks/usePickerLabels";
import DiscountEligibilityNotice from "@/pages/Facility/shared/DiscountEligibilityNotice";
import { useDiscountEligibility } from "@/pages/Facility/shared/useDiscountEligibility";
import { apiTimeToDayjs, dayjsToApiDate, dayjsToApiTime } from "@/utils/dayjsApi";
import { buildRecurringSeriesPreviewPayload } from "./recurringSeriesPayload";
import { isSameWeekday, occurrencePeriodForDate, weeklyOccurrenceDates } from "./recurringSeriesScheduling";
import { ComboBox, DatePicker, Select, TextArea, TimePicker } from "@efcnewlife/newlife-ui";
import type { Dayjs } from "dayjs";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface RecurringSeriesDataFormHandle {
  validate: () => boolean;
  getPreviewPayload: () => PreviewRecurringBookingSeriesPayload | null;
  getOccurrenceCount: () => number;
  isPriorityMinistry: () => boolean;
}

interface Props {
  rooms: Array<{ id: string; code: string; name?: string }>;
}

const USER_SEARCH_DEBOUNCE_MS = 300;
const MAX_RECURRING_SERIES_ROOMS = 3;

const userOptionLabel = (user: UserBase): string => user.displayName || user.email || user.id;

const RecurringSeriesDataForm = forwardRef<RecurringSeriesDataFormHandle, Props>(function RecurringSeriesDataForm(
  { rooms },
  ref
) {
  const { t } = useTranslation("facility");
  const pickerLabels = usePickerLabels();

  const [userId, setUserId] = useState("");
  const [ministryId, setMinistryId] = useState<string>("");
  const [firstOccurrenceDate, setFirstOccurrenceDate] = useState<Dayjs | null>(null);
  const [lastOccurrenceDate, setLastOccurrenceDate] = useState<Dayjs | null>(null);
  const [localStartTime, setLocalStartTime] = useState<Dayjs | null>(apiTimeToDayjs("09:00"));
  const [localEndTime, setLocalEndTime] = useState<Dayjs | null>(apiTimeToDayjs("11:00"));
  const [facilityIds, setFacilityIds] = useState<string[]>([]);
  const [surchargeCodes, setSurchargeCodes] = useState<string[]>([]);
  const [remark, setRemark] = useState("");

  const [users, setUsers] = useState<UserBase[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserBase | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const eligibility = useDiscountEligibility("recurring", ministryId || null, userId);

  const [errors, setErrors] = useState<{
    userId?: string;
    facilityIds?: string;
    firstOccurrenceDate?: string;
    lastOccurrenceDate?: string;
    localStartTime?: string;
    localEndTime?: string;
  }>({});

  useEffect(() => {
    void (async () => {
      try {
        const [ministryRes, surchargeRes] = await Promise.all([
          ministryService.getMinistryList(),
          facilityService.listSurcharges(),
        ]);
        if (ministryRes.success) setMinistries((ministryRes.data.items || []).filter((m) => m.status === "active"));
        if (surchargeRes.success) setSurcharges((surchargeRes.data.items || []).filter((s) => s.isActive));
      } catch {
        setMinistries([]);
        setSurcharges([]);
      }
    })();
  }, []);

  const userSearchRequestId = useRef(0);
  const userSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (userSearchTimeoutRef.current) clearTimeout(userSearchTimeoutRef.current);
    };
  }, []);

  const searchUsers = useCallback(async (keyword: string) => {
    const requestId = ++userSearchRequestId.current;
    setUsersLoading(true);
    try {
      const res = await userService.getList({ keyword });
      if (requestId !== userSearchRequestId.current) return;
      setUsers(res.success ? res.data.items || [] : []);
    } catch {
      if (requestId !== userSearchRequestId.current) return;
      setUsers([]);
    } finally {
      if (requestId === userSearchRequestId.current) {
        setUsersLoading(false);
      }
    }
  }, []);

  const handleUserQueryChange = useCallback(
    (query: string) => {
      if (userSearchTimeoutRef.current) clearTimeout(userSearchTimeoutRef.current);
      userSearchTimeoutRef.current = setTimeout(() => {
        void searchUsers(query.trim());
      }, USER_SEARCH_DEBOUNCE_MS);
    },
    [searchUsers]
  );

  const handleUserOpen = useCallback(() => {
    if (users.length === 0 && !usersLoading) {
      void searchUsers("");
    }
  }, [searchUsers, users.length, usersLoading]);

  const userOptions = useMemo(() => {
    const byId = new Map<string, UserBase>();
    for (const user of users) byId.set(user.id, user);
    if (selectedUser) byId.set(selectedUser.id, selectedUser);
    return Array.from(byId.values()).map((user) => ({ value: user.id, label: userOptionLabel(user) }));
  }, [selectedUser, users]);

  const roomOptions = useMemo(() => rooms.map((room) => ({ value: room.id, label: room.name || room.code })), [rooms]);

  const ministryOptions = useMemo(
    () => [
      { value: "", label: t("bookingSeries.form.noMinistry") },
      ...ministries.map((ministry) => ({ value: ministry.id, label: ministry.name || ministry.id })),
    ],
    [ministries, t]
  );

  const surchargeOptions = useMemo(
    () => surcharges.map((item) => ({ value: item.code, label: `${item.code} (${item.unitAmount} ${item.currency})` })),
    [surcharges]
  );

  const isPriorityMinistry = Boolean(ministries.find((m) => m.id === ministryId)?.hasPriorityBooking);

  const firstDateStr = dayjsToApiDate(firstOccurrenceDate) ?? null;
  const lastDateStr = dayjsToApiDate(lastOccurrenceDate) ?? null;
  const weekdayMismatch = Boolean(firstDateStr && lastDateStr && !isSameWeekday(firstDateStr, lastDateStr));
  const usePeriodMismatch =
    !weekdayMismatch &&
    Boolean(
      firstDateStr && lastDateStr && occurrencePeriodForDate(firstDateStr) !== occurrencePeriodForDate(lastDateStr)
    );
  const occurrenceDates = useMemo(() => {
    if (!firstDateStr || !lastDateStr || weekdayMismatch || usePeriodMismatch) return [];
    return weeklyOccurrenceDates(firstDateStr, lastDateStr);
  }, [firstDateStr, lastDateStr, usePeriodMismatch, weekdayMismatch]);

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: typeof errors = {};
      if (!userId) next.userId = t("bookingSeries.form.bookerRequired");
      if (!facilityIds.length) next.facilityIds = t("bookingSeries.form.roomsRequired");
      else if (facilityIds.length > MAX_RECURRING_SERIES_ROOMS) {
        next.facilityIds = t("bookingSeries.form.roomsMax", { count: MAX_RECURRING_SERIES_ROOMS });
      }
      if (!firstOccurrenceDate) next.firstOccurrenceDate = t("bookingSeries.form.firstOccurrenceRequired");
      if (!lastOccurrenceDate) next.lastOccurrenceDate = t("bookingSeries.form.lastOccurrenceRequired");
      if (firstDateStr && lastDateStr) {
        if (lastDateStr < firstDateStr) {
          next.lastOccurrenceDate = t("bookingSeries.form.lastAfterFirst");
        } else if (weekdayMismatch) {
          next.lastOccurrenceDate = t("bookingSeries.form.weekdayMismatch");
        } else if (usePeriodMismatch) {
          next.lastOccurrenceDate = t("bookingSeries.form.usePeriodMismatch");
        }
      }
      if (!localStartTime) next.localStartTime = t("bookingSeries.form.startTimeRequired");
      if (!localEndTime) next.localEndTime = t("bookingSeries.form.endTimeRequired");
      if (localStartTime && localEndTime && !localEndTime.isAfter(localStartTime)) {
        next.localEndTime = t("bookingSeries.form.endAfterStart");
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getPreviewPayload: () =>
      buildRecurringSeriesPreviewPayload({
        userId,
        ministryId: ministryId || null,
        firstOccurrenceDate: firstDateStr,
        lastOccurrenceDate: lastDateStr,
        localStartTime: dayjsToApiTime(localStartTime) ?? null,
        localEndTime: dayjsToApiTime(localEndTime) ?? null,
        facilityIds,
        surchargeCodes,
        remark,
      }),
    getOccurrenceCount: () => occurrenceDates.length,
    isPriorityMinistry: () => isPriorityMinistry,
  }));

  return (
    <div className="space-y-4">
      <ComboBox<string>
        id="booking-series-booker"
        label={t("bookingSeries.form.booker")}
        options={userOptions}
        value={userId || null}
        onChange={(value) => {
          const nextId = value || "";
          setUserId(nextId);
          setSelectedUser(nextId ? users.find((user) => user.id === nextId) || selectedUser : null);
        }}
        onQueryChange={handleUserQueryChange}
        onOpen={handleUserOpen}
        loading={usersLoading}
        filterFunction={() => true}
        placeholder={t("bookingSeries.form.bookerSearchPlaceholder")}
        error={errors.userId}
        clearable
        required
      />
      <Select
        id="booking-series-ministry"
        label={t("bookingSeries.form.ministry")}
        options={ministryOptions}
        value={ministryId}
        onChange={(v) => setMinistryId(String(v || ""))}
        hint={isPriorityMinistry ? t("bookingSeries.form.priorityMinistryHint") : undefined}
      />
      <DiscountEligibilityNotice eligibility={eligibility} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          id="booking-series-first-occurrence"
          label={t("bookingSeries.form.firstOccurrenceDate")}
          value={firstOccurrenceDate}
          onChange={setFirstOccurrenceDate}
          showTodayButton={false}
          labels={pickerLabels}
          error={errors.firstOccurrenceDate}
          required
        />
        <DatePicker
          id="booking-series-last-occurrence"
          label={t("bookingSeries.form.lastOccurrenceDate")}
          value={lastOccurrenceDate}
          onChange={setLastOccurrenceDate}
          showTodayButton={false}
          labels={pickerLabels}
          error={errors.lastOccurrenceDate}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TimePicker
          id="booking-series-local-start"
          label={t("bookingSeries.form.localStartTime")}
          value={localStartTime}
          onChange={setLocalStartTime}
          clearable={false}
          minuteStep={15}
          ampm
          labels={pickerLabels}
          error={errors.localStartTime}
          required
        />
        <TimePicker
          id="booking-series-local-end"
          label={t("bookingSeries.form.localEndTime")}
          value={localEndTime}
          onChange={setLocalEndTime}
          clearable={false}
          minuteStep={15}
          ampm
          labels={pickerLabels}
          error={errors.localEndTime}
          required
        />
      </div>
      {occurrenceDates.length > 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t("bookingSeries.form.occurrenceCount", { count: occurrenceDates.length })}
        </p>
      ) : null}
      <Select
        id="booking-series-rooms"
        label={t("bookingSeries.form.rooms")}
        options={roomOptions}
        value={facilityIds}
        multiple
        onChange={(v) => {
          const nextIds = (Array.isArray(v) ? v : [v]).map((item) => String(item || "")).filter(Boolean);
          setFacilityIds(nextIds);
          setErrors((prev) => {
            if (nextIds.length > MAX_RECURRING_SERIES_ROOMS) {
              return { ...prev, facilityIds: t("bookingSeries.form.roomsMax", { count: MAX_RECURRING_SERIES_ROOMS }) };
            }
            if (!prev.facilityIds) return prev;
            const { facilityIds: _removed, ...rest } = prev;
            return rest;
          });
        }}
        error={errors.facilityIds}
        hint={t("bookingSeries.form.roomsMaxHint", { count: MAX_RECURRING_SERIES_ROOMS })}
        required
      />
      <Select
        id="booking-series-surcharges"
        label={t("bookingSeries.form.surcharges")}
        options={surchargeOptions}
        value={surchargeCodes}
        multiple
        onChange={(v) =>
          setSurchargeCodes((Array.isArray(v) ? v : [v]).map((item) => String(item || "")).filter(Boolean))
        }
      />
      <TextArea
        id="booking-series-remark"
        label={t("bookingSeries.form.remark")}
        value={remark}
        onChange={setRemark}
        rows={3}
      />
    </div>
  );
});

export default RecurringSeriesDataForm;
