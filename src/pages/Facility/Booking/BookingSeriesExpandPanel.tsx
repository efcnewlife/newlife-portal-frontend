import { facilityService, type RecurringBookingSeriesDetail } from "@/api/services/facilityService";
import { bookingSeriesDetailPath } from "@/pages/Facility/shared/bookingSeriesRoute";
import { bookingStatusBadgeColor } from "@/pages/Facility/shared/bookingStatusBadge";
import { DateUtil } from "@/utils/dateUtil";
import { Badge, Button, Spinner } from "@efcnewlife/newlife-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

interface BookingSeriesExpandPanelProps {
  seriesId: string;
}

const BookingSeriesExpandPanel = ({ seriesId }: BookingSeriesExpandPanelProps) => {
  const { t } = useTranslation("facility");
  const navigate = useNavigate();
  const [series, setSeries] = useState<RecurringBookingSeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void facilityService
      .getBookingSeriesById(seriesId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setSeries(res.data);
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  if (loading) {
    return <Spinner showText size="sm" text={t("booking.list.loadingOccurrences")} />;
  }

  if (failed || !series) {
    return <p className="text-sm text-error-500">{t("booking.list.loadOccurrencesFailed")}</p>;
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {series.occurrences.map((occurrence) => (
          <li key={occurrence.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-gray-800 dark:text-white/90">
              {DateUtil.format(occurrence.startAt)} – {DateUtil.format(occurrence.endAt, "hh:mm A")}
            </span>
            <Badge color={bookingStatusBadgeColor(occurrence.status)} size="sm">
              {t(`booking.status.${occurrence.status}`, { defaultValue: occurrence.status })}
            </Badge>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={() => navigate(bookingSeriesDetailPath(seriesId))}>
        {t("booking.list.viewSeries")}
      </Button>
    </div>
  );
};

export default BookingSeriesExpandPanel;
