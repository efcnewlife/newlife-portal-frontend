import {
  facilityService,
  type PreviewQuoteResponse,
  type SurchargeItem,
} from "@/api/services/facilityService";
import ministryService, { type MinistryListItem } from "@/api/services/ministryService";
import userService, { type UserBase } from "@/api/services/userService";
import { usePickerLabels } from "@/hooks/usePickerLabels";
import { DateUtil } from "@/utils/dateUtil";
import { getLocalTimezone } from "@/utils/dayjsApi";
import { Button, Checkbox, ComboBox, DateTimePicker, Select, TextArea } from "@efcnewlife/newlife-ui";
import type { Dayjs } from "dayjs";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface BookingFormValues {
  userId: string;
  facilityIds: string[];
  startAt: Dayjs | null;
  endAt: Dayjs | null;
  ministryId: string | null;
  isMissionAligned: boolean;
  surchargeCodes: string[];
  remark: string;
}

export interface BookingDataFormHandle {
  validate: () => boolean;
  getValues: () => BookingFormValues;
}

interface Props {
  defaultValues?: Partial<BookingFormValues> | null;
  rooms: Array<{ id: string; code: string; name?: string }>;
}

const USER_SEARCH_DEBOUNCE_MS = 300;

const billedHoursBetween = (startAt: Dayjs | null, endAt: Dayjs | null): number => {
  if (startAt == null || endAt == null || !startAt.isValid() || !endAt.isValid() || !endAt.isAfter(startAt)) {
    return 0;
  }
  return Math.round((endAt.diff(startAt, "millisecond") / 3_600_000) * 100) / 100;
};

const MAX_BOOKING_ROOMS = 3;

const userOptionLabel = (user: UserBase): string => user.displayName || user.email || user.id;

const BookingDataForm = forwardRef<BookingDataFormHandle, Props>(function BookingDataForm(
  { defaultValues, rooms },
  ref
) {
  const { t } = useTranslation("facility");
  const displayTimezone = useMemo(() => getLocalTimezone(), []);
  const pickerLabels = usePickerLabels();

  const [userId, setUserId] = useState(defaultValues?.userId || "");
  const [facilityIds, setFacilityIds] = useState<string[]>(defaultValues?.facilityIds || []);
  const [startAt, setStartAt] = useState<Dayjs | null>(defaultValues?.startAt ?? null);
  const [endAt, setEndAt] = useState<Dayjs | null>(defaultValues?.endAt ?? null);
  const [ministryId, setMinistryId] = useState<string>(defaultValues?.ministryId || "");
  const [isMissionAligned, setIsMissionAligned] = useState(defaultValues?.isMissionAligned ?? false);
  const [surchargeCodes, setSurchargeCodes] = useState<string[]>(defaultValues?.surchargeCodes || []);
  const [remark, setRemark] = useState(defaultValues?.remark || "");
  const [users, setUsers] = useState<UserBase[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserBase | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const [quote, setQuote] = useState<PreviewQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [errors, setErrors] = useState<{
    userId?: string;
    facilityIds?: string;
    startAt?: string;
    endAt?: string;
  }>({});

  useEffect(() => {
    setUserId(defaultValues?.userId || "");
    setFacilityIds(defaultValues?.facilityIds || []);
    setStartAt(defaultValues?.startAt ?? null);
    setEndAt(defaultValues?.endAt ?? null);
    setMinistryId(defaultValues?.ministryId || "");
    setIsMissionAligned(defaultValues?.isMissionAligned ?? false);
    setSurchargeCodes(defaultValues?.surchargeCodes || []);
    setRemark(defaultValues?.remark || "");
    setSelectedUser(null);
    setQuote(null);
    setQuoteError(null);
    setErrors({});
  }, [defaultValues]);

  const userSearchRequestId = useRef(0);
  const userSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (res.success) {
        setUsers(res.data.items || []);
      } else {
        setUsers([]);
      }
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
    for (const user of users) {
      byId.set(user.id, user);
    }
    if (selectedUser) {
      byId.set(selectedUser.id, selectedUser);
    }
    return Array.from(byId.values()).map((user) => ({
      value: user.id,
      label: userOptionLabel(user),
    }));
  }, [selectedUser, users]);

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        value: room.id,
        label: room.name || room.code,
      })),
    [rooms]
  );

  const ministryOptions = useMemo(
    () => [
      { value: "", label: t("booking.form.noMinistry") },
      ...ministries.map((ministry) => ({
        value: ministry.id,
        label: ministry.name || ministry.id,
      })),
    ],
    [ministries, t]
  );

  const surchargeOptions = useMemo(
    () =>
      surcharges.map((item) => ({
        value: item.code,
        label: `${item.code} (${item.unitAmount} ${item.currency})`,
      })),
    [surcharges]
  );

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: typeof errors = {};
      if (!userId) next.userId = t("booking.form.bookerRequired");
      if (!facilityIds.length) next.facilityIds = t("booking.form.roomsRequired");
      else if (facilityIds.length > MAX_BOOKING_ROOMS) {
        next.facilityIds = t("booking.form.roomsMax", { count: MAX_BOOKING_ROOMS });
      }
      if (!startAt) next.startAt = t("booking.form.startRequired");
      if (!endAt) next.endAt = t("booking.form.endRequired");
      if (startAt && endAt && !endAt.isAfter(startAt)) {
        next.endAt = t("booking.form.endAfterStart");
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      userId,
      facilityIds,
      startAt,
      endAt,
      ministryId: ministryId || null,
      isMissionAligned,
      surchargeCodes,
      remark,
    }),
  }));

  const handlePreviewQuote = async () => {
    if (!facilityIds.length || !startAt || !endAt) {
      setQuoteError(t("booking.form.quoteNeedTimesRooms"));
      return;
    }
    const hours = billedHoursBetween(startAt, endAt);
    if (hours <= 0) {
      setQuoteError(t("booking.form.endAfterStart"));
      return;
    }
    setQuoting(true);
    setQuoteError(null);
    try {
      const res = await facilityService.previewQuote({
        bookingType: "one_time",
        isMissionAligned,
        currency: "CAD",
        roomLines: facilityIds.map((facilityId) => ({
          facilityId,
          billedHours: hours,
        })),
        surchargeCodes,
      });
      if (res.success) {
        setQuote(res.data);
      } else {
        setQuote(null);
        setQuoteError(t("booking.form.quoteFailed"));
      }
    } catch {
      setQuote(null);
      setQuoteError(t("booking.form.quoteFailed"));
    } finally {
      setQuoting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ComboBox<string>
        id="booking-booker"
        label={t("booking.form.booker")}
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
        placeholder={t("booking.form.bookerSearchPlaceholder")}
        error={errors.userId}
        clearable
        required
      />
      <Select
        id="booking-rooms"
        label={t("booking.form.rooms")}
        options={roomOptions}
        value={facilityIds}
        multiple
        onChange={(v) => {
          const nextIds = (Array.isArray(v) ? v : [v]).map((item) => String(item || "")).filter(Boolean);
          setFacilityIds(nextIds);
          setErrors((prev) => {
            if (nextIds.length > MAX_BOOKING_ROOMS) {
              return {
                ...prev,
                facilityIds: t("booking.form.roomsMax", { count: MAX_BOOKING_ROOMS }),
              };
            }
            if (!prev.facilityIds) return prev;
            const { facilityIds: _removed, ...rest } = prev;
            return rest;
          });
        }}
        error={errors.facilityIds}
        hint={t("booking.form.roomsMaxHint", { count: MAX_BOOKING_ROOMS })}
        required
      />
      <DateTimePicker
        id="booking-start"
        label={t("booking.form.startAt")}
        value={startAt}
        onChange={(value: Dayjs | null) => setStartAt(value)}
        timezone={displayTimezone}
        minuteStep={15}
        ampm
        format={DateUtil.DATETIME_DISPLAY_FORMAT}
        showSubmitButton={false}
        labels={pickerLabels}
        error={errors.startAt}
        required
      />
      <DateTimePicker
        id="booking-end"
        label={t("booking.form.endAt")}
        value={endAt}
        onChange={(value: Dayjs | null) => setEndAt(value)}
        timezone={displayTimezone}
        minuteStep={15}
        ampm
        format={DateUtil.DATETIME_DISPLAY_FORMAT}
        showSubmitButton={false}
        labels={pickerLabels}
        error={errors.endAt}
        required
      />
      <Select
        id="booking-ministry"
        label={t("booking.form.ministry")}
        options={ministryOptions}
        value={ministryId}
        onChange={(v) => setMinistryId(String(v || ""))}
      />
      <Checkbox
        id="booking-mission-aligned"
        label={t("booking.form.missionAligned")}
        checked={isMissionAligned}
        onChange={setIsMissionAligned}
      />
      <Select
        id="booking-surcharges"
        label={t("booking.form.surcharges")}
        options={surchargeOptions}
        value={surchargeCodes}
        multiple
        onChange={(v) =>
          setSurchargeCodes((Array.isArray(v) ? v : [v]).map((item) => String(item || "")).filter(Boolean))
        }
      />
      <TextArea
        id="booking-remark"
        label={t("booking.form.remark")}
        value={remark}
        onChange={setRemark}
        rows={3}
      />
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => void handlePreviewQuote()} disabled={quoting}>
          {quoting ? t("booking.form.quoting") : t("booking.form.previewQuote")}
        </Button>
        {quote && (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {t("booking.form.quotedAmount")}: {quote.quotedAmount} {quote.currency}
          </span>
        )}
      </div>
      {quoteError && <p className="text-sm text-error-500">{quoteError}</p>}
    </div>
  );
});

export default BookingDataForm;
