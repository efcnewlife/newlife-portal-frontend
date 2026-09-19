import { facilityService, type BookingDetail, type SurchargeItem } from "@/api/services/facilityService";
import ministryService, { type MinistryListItem } from "@/api/services/ministryService";
import { DateUtil } from "@/utils/dateUtil";
import { Alert, Input, Select } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BOOKING_TITLE_MAX_LENGTH, validateBookingTitle } from "./bookingTitleValidation";

export interface BookingEditFormValues {
  title: string;
  ministryId: string | null;
  surchargeCodes: string[];
}

export interface BookingEditFormHandle {
  validate: () => boolean;
  getValues: () => BookingEditFormValues;
}

interface Props {
  booking: BookingDetail;
}

const TITLE_ERROR_KEY = {
  required: "booking.form.titleRequired",
  tooLong: "booking.form.titleTooLong",
  notPlainText: "booking.form.titleInvalid",
} as const;

const roomLabel = (booking: BookingDetail): string => {
  if (booking.facilityNames?.length) return booking.facilityNames.join(", ");
  return booking.facilityName || "";
};

const BookingEditForm = forwardRef<BookingEditFormHandle, Props>(function BookingEditForm({ booking }, ref) {
  const { t } = useTranslation("facility");

  const [title, setTitle] = useState(booking.title || "");
  const [ministryId, setMinistryId] = useState(booking.ministryId || "");
  const [surchargeCodes, setSurchargeCodes] = useState<string[]>([]);
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const [titleError, setTitleError] = useState<string | undefined>();

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

  const ministryOptions = useMemo(
    () => [
      { value: "", label: t("booking.form.noMinistry") },
      ...ministries.map((ministry) => ({ value: ministry.id, label: ministry.name || ministry.id })),
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
      const error = validateBookingTitle(title);
      setTitleError(error ? t(TITLE_ERROR_KEY[error], { count: BOOKING_TITLE_MAX_LENGTH }) : undefined);
      return !error;
    },
    getValues: () => ({
      title: title.trim(),
      ministryId: ministryId || null,
      surchargeCodes,
    }),
  }));

  return (
    <div className="space-y-4">
      <Input
        id="booking-edit-title"
        label={t("booking.form.title")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={titleError}
        hint={t("booking.form.titleHint", { count: BOOKING_TITLE_MAX_LENGTH })}
        required
      />
      <Input
        id="booking-edit-start"
        label={t("booking.form.startAt")}
        value={DateUtil.format(booking.startAt)}
        disabled
      />
      <Input id="booking-edit-end" label={t("booking.form.endAt")} value={DateUtil.format(booking.endAt)} disabled />
      <Input id="booking-edit-rooms" label={t("booking.form.rooms")} value={roomLabel(booking)} disabled />
      <Alert variant="info" title={t("booking.form.editRoomsTimeNotice")} size="sm" width="full" />
      <Select
        id="booking-edit-ministry"
        label={t("booking.form.ministry")}
        options={ministryOptions}
        value={ministryId}
        onChange={(v) => setMinistryId(String(v || ""))}
      />
      <Select
        id="booking-edit-surcharges"
        label={t("booking.form.surcharges")}
        options={surchargeOptions}
        value={surchargeCodes}
        multiple
        onChange={(v) =>
          setSurchargeCodes((Array.isArray(v) ? v : [v]).map((item) => String(item || "")).filter(Boolean))
        }
      />
    </div>
  );
});

export default BookingEditForm;
