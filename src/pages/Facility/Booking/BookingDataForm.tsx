import {
  facilityService,
  type PreviewQuoteResponse,
  type SurchargeItem,
} from "@/api/services/facilityService";
import ministryService, { type MinistryListItem } from "@/api/services/ministryService";
import userService, { type UserBase } from "@/api/services/userService";
import { Button, Checkbox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface BookingFormValues {
  userId: string;
  facilityIds: string[];
  startAtLocal: string;
  endAtLocal: string;
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

const billedHoursBetween = (startLocal: string, endLocal: string): number => {
  const start = new Date(startLocal);
  const end = new Date(endLocal);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }
  return Math.round(((end.getTime() - start.getTime()) / 3_600_000) * 100) / 100;
};

const BookingDataForm = forwardRef<BookingDataFormHandle, Props>(function BookingDataForm(
  { defaultValues, rooms },
  ref
) {
  const { t } = useTranslation("facility");
  const [userId, setUserId] = useState(defaultValues?.userId || "");
  const [facilityIds, setFacilityIds] = useState<string[]>(defaultValues?.facilityIds || []);
  const [startAtLocal, setStartAtLocal] = useState(defaultValues?.startAtLocal || "");
  const [endAtLocal, setEndAtLocal] = useState(defaultValues?.endAtLocal || "");
  const [ministryId, setMinistryId] = useState<string>(defaultValues?.ministryId || "");
  const [isMissionAligned, setIsMissionAligned] = useState(defaultValues?.isMissionAligned ?? false);
  const [surchargeCodes, setSurchargeCodes] = useState<string[]>(defaultValues?.surchargeCodes || []);
  const [remark, setRemark] = useState(defaultValues?.remark || "");
  const [users, setUsers] = useState<UserBase[]>([]);
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const [quote, setQuote] = useState<PreviewQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [errors, setErrors] = useState<{
    userId?: string;
    facilityIds?: string;
    startAtLocal?: string;
    endAtLocal?: string;
  }>({});

  useEffect(() => {
    setUserId(defaultValues?.userId || "");
    setFacilityIds(defaultValues?.facilityIds || []);
    setStartAtLocal(defaultValues?.startAtLocal || "");
    setEndAtLocal(defaultValues?.endAtLocal || "");
    setMinistryId(defaultValues?.ministryId || "");
    setIsMissionAligned(defaultValues?.isMissionAligned ?? false);
    setSurchargeCodes(defaultValues?.surchargeCodes || []);
    setRemark(defaultValues?.remark || "");
    setQuote(null);
    setQuoteError(null);
    setErrors({});
  }, [defaultValues]);

  useEffect(() => {
    void (async () => {
      try {
        const [userRes, ministryRes, surchargeRes] = await Promise.all([
          userService.getList({ keyword: "" }),
          ministryService.getMinistryList(),
          facilityService.listSurcharges(),
        ]);
        if (userRes.success) setUsers(userRes.data.items || []);
        if (ministryRes.success) setMinistries((ministryRes.data.items || []).filter((m) => m.status === "active"));
        if (surchargeRes.success) setSurcharges((surchargeRes.data.items || []).filter((s) => s.isActive));
      } catch {
        setUsers([]);
        setMinistries([]);
        setSurcharges([]);
      }
    })();
  }, []);

  const userOptions = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: user.displayName || user.email || user.id,
      })),
    [users]
  );

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        value: room.id,
        label: room.name ? `${room.code} - ${room.name}` : room.code,
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
      if (!startAtLocal) next.startAtLocal = t("booking.form.startRequired");
      if (!endAtLocal) next.endAtLocal = t("booking.form.endRequired");
      if (startAtLocal && endAtLocal && new Date(endAtLocal) <= new Date(startAtLocal)) {
        next.endAtLocal = t("booking.form.endAfterStart");
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      userId,
      facilityIds,
      startAtLocal,
      endAtLocal,
      ministryId: ministryId || null,
      isMissionAligned,
      surchargeCodes,
      remark,
    }),
  }));

  const handlePreviewQuote = async () => {
    if (!facilityIds.length || !startAtLocal || !endAtLocal) {
      setQuoteError(t("booking.form.quoteNeedTimesRooms"));
      return;
    }
    const hours = billedHoursBetween(startAtLocal, endAtLocal);
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
      <Select
        id="booking-booker"
        label={t("booking.form.booker")}
        options={userOptions}
        value={userId}
        onChange={(v) => setUserId(String(v || ""))}
        error={errors.userId}
        required
      />
      <Select
        id="booking-rooms"
        label={t("booking.form.rooms")}
        options={roomOptions}
        value={facilityIds}
        multiple
        onChange={(v) => setFacilityIds((Array.isArray(v) ? v : [v]).map((item) => String(item || "")).filter(Boolean))}
        error={errors.facilityIds}
        required
      />
      <Input
        id="booking-start"
        type="datetime-local"
        label={t("booking.form.startAt")}
        value={startAtLocal}
        onChange={(e) => setStartAtLocal(e.target.value)}
        error={errors.startAtLocal}
        required
      />
      <Input
        id="booking-end"
        type="datetime-local"
        label={t("booking.form.endAt")}
        value={endAtLocal}
        onChange={(e) => setEndAtLocal(e.target.value)}
        error={errors.endAtLocal}
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
