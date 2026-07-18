import type { BookingDetail } from "@/api/services/facilityService";
import { DateUtil } from "@/utils/dateUtil";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface BookingDetailDrawerProps {
  booking: BookingDetail;
}

const BookingDetailDrawer = ({ booking }: BookingDetailDrawerProps) => {
  const { t } = useTranslation("facility");

  const row = (label: string, value: ReactNode) => (
    <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-100 dark:border-gray-800">
      <dt className="text-sm text-gray-500 col-span-1">{label}</dt>
      <dd className="text-sm col-span-2">{value ?? "-"}</dd>
    </div>
  );

  return (
    <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
      {row(t("booking.table.user"), booking.userDisplayName || booking.userEmail)}
      {row(t("booking.detail.userEmail"), booking.userEmail)}
      {row(t("booking.table.facility"), booking.facilityName)}
      {row(t("booking.detail.status"), t(`booking.status.${booking.status}`, { defaultValue: booking.status }))}
      {row(t("booking.detail.bookingType"), t(`booking.bookingType.${booking.bookingType}`, { defaultValue: booking.bookingType }))}
      {row(t("booking.table.startAt"), DateUtil.format(booking.startAt))}
      {row(t("booking.table.endAt"), DateUtil.format(booking.endAt))}
      {row(t("booking.detail.missionAligned"), booking.isMissionAligned ? t("shared.yes") : t("shared.no"))}
      {row(t("booking.detail.subtotal"), booking.subtotalAmount != null ? `${booking.subtotalAmount} ${booking.currency || ""}` : "-")}
      {row(t("booking.detail.discount"), booking.discountAmount)}
      {row(t("booking.detail.surcharge"), booking.surchargeAmount)}
      {row(t("booking.detail.deposit"), booking.depositAmount)}
      {row(t("booking.detail.quoted"), booking.quotedAmount != null ? `${booking.quotedAmount} ${booking.currency || ""}` : "-")}
      {booking.cancelReason && row(t("booking.detail.cancelReason"), booking.cancelReason)}

      {booking.rooms?.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">{t("booking.detail.rooms")}</h4>
          <ul className="list-disc pl-5 space-y-1">
            {booking.rooms.map((line) => (
              <li key={line.id}>
                {line.facilityName || line.facilityCode} · {DateUtil.format(line.startAt)} – {DateUtil.format(line.endAt)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {booking.slots?.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">{t("booking.detail.slots")}</h4>
          <ul className="list-disc pl-5 space-y-1">
            {booking.slots.map((slot) => (
              <li key={slot.id}>
                {DateUtil.format(slot.startAt)} – {DateUtil.format(slot.endAt)} ({slot.status})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookingDetailDrawer;
