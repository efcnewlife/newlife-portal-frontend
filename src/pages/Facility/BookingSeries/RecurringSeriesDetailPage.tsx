import {
  facilityService,
  type CancelRecurringBookingSeriesPayload,
  type OverrideLogItem,
  type RecurringBookingSeriesDetail,
  type RecurringCancellationScope,
} from "@/api/services/facilityService";
import ministryService from "@/api/services/ministryService";
import userService from "@/api/services/userService";
import type { ApiError } from "@/types/api";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { useRoomListOptions } from "@/pages/Facility/shared/useRoomListOptions";
import { DateUtil } from "@/utils/dateUtil";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { format_admin_user_label } from "@/utils/userDisplayName";
import { Badge, Button, Spinner } from "@efcnewlife/newlife-ui";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdArrowBack } from "react-icons/md";
import { useNavigate, useParams } from "react-router";
import RecurringSeriesCancelModal from "./RecurringSeriesCancelModal";
import { filterOverrideLogsForOccurrences } from "./recurringSeriesOverrideHistory";
import { resolveRecurringSeriesErrorMessage } from "./recurringSeriesErrorCode";

type StatusBadgeColor = "success" | "warning" | "error" | "light";

const STATUS_BADGE_COLOR: Record<string, StatusBadgeColor> = {
  pending_payment: "warning",
  confirmed: "success",
  cancelled: "light",
  overridden: "error",
};

const OVERRIDE_LOG_PAGE_SIZE = 100;

const RecurringSeriesDetailPage = () => {
  const { t } = useTranslation(["facility", "common"]);
  const navigate = useNavigate();
  const { seriesId } = useParams<{ seriesId: string }>();
  const { hasPermission } = usePermissions();
  const canCancel = hasPermission(`${Resource.FacilityBooking}:${Verb.Modify}`);
  const { roomLabelById } = useRoomListOptions();

  const [series, setSeries] = useState<RecurringBookingSeriesDetail | null>(null);
  const [bookerLabel, setBookerLabel] = useState<string>("");
  const [ministryLabel, setMinistryLabel] = useState<string>("");
  const [overrideLogs, setOverrideLogs] = useState<OverrideLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const { isOpen: isCancelOpen, openModal: openCancel, closeModal: closeCancel } = useModal(false);

  const loadSeries = useCallback(async () => {
    if (!seriesId) return;
    setLoading(true);
    setNotFound(false);

    let detail: RecurringBookingSeriesDetail;
    try {
      const res = await facilityService.getBookingSeriesById(seriesId);
      detail = res.data;
    } catch (error) {
      const apiError = error as Partial<ApiError>;
      if (apiError && typeof apiError === "object" && apiError.code === 404) {
        setNotFound(true);
      } else {
        notifyApiError(error, {
          title: t("common:feedback.loadFailed"),
          fallbackDescription: t("common:feedback.loadFailedDesc"),
        });
      }
      setLoading(false);
      return;
    }

    setSeries(detail);
    try {
      const [bookerRes, ministryRes] = await Promise.all([
        userService.getById(detail.userId).catch(() => null),
        detail.ministryId ? ministryService.getMinistryById(detail.ministryId).catch(() => null) : null,
      ]);
      setBookerLabel(bookerRes?.success ? format_admin_user_label(bookerRes.data) || detail.userId : detail.userId);
      setMinistryLabel(ministryRes?.success ? ministryRes.data.name || detail.ministryId || "" : "");

      const dateFrom = DateUtil.format(detail.firstOccurrenceDate, "YYYY-MM-DD");
      const dateTo = DateUtil.format(detail.lastOccurrenceDate, "YYYY-MM-DD");
      const logsRes = await facilityService
        .getOverrideLogPages({ page: 0, page_size: OVERRIDE_LOG_PAGE_SIZE, dateFrom, dateTo })
        .catch(() => null);
      setOverrideLogs(
        logsRes?.success ? filterOverrideLogsForOccurrences(logsRes.data.items || [], detail.occurrences) : []
      );
    } finally {
      setLoading(false);
    }
  }, [seriesId, t]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const rooms = useMemo(
    () => Array.from(roomLabelById.entries()).map(([id, name]) => ({ id, code: id, name })),
    [roomLabelById]
  );

  const handleCancel = async (scope: RecurringCancellationScope, occurrenceId: string | null, cancelReason: string) => {
    if (!seriesId) return;
    setCancelSubmitting(true);
    const payload: CancelRecurringBookingSeriesPayload = {
      scope,
      occurrenceId,
      cancelReason: cancelReason || undefined,
    };
    try {
      const res = await facilityService.cancelBookingSeries(seriesId, payload);
      if (res.success) {
        notifySuccess({ title: t("common:feedback.updated") });
        setSeries(res.data);
        closeCancel();
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.cancelFailed"),
        fallbackDescription: t("common:feedback.cancelFailedDesc"),
        resolveDescription: (apiError) => resolveRecurringSeriesErrorMessage(apiError, rooms, t),
      });
    } finally {
      setCancelSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t("bookingSeries.detail.notFound")}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/facility/bookings")}>
          {t("bookingSeries.detail.back")}
        </Button>
      </div>
    );
  }

  const canCancelSeries = Boolean(series && series.status !== "cancelled");
  const row = (label: string, value: ReactNode) => (
    <div className="grid grid-cols-3 gap-2 border-b border-gray-100 py-1 dark:border-gray-800">
      <dt className="col-span-1 text-sm text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm">{value ?? "-"}</dd>
    </div>
  );

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        size="sm"
        startIcon={<MdArrowBack className="size-4" />}
        onClick={() => navigate("/facility/bookings")}
      >
        {t("bookingSeries.detail.back")}
      </Button>

      {loading ? <Spinner showText size="sm" text={t("common:loading", { defaultValue: "Loading..." })} /> : null}

      {series && !loading ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-2xl font-bold text-gray-900 dark:text-white">{t("bookingSeries.detail.title")}</h1>
            <Badge color={STATUS_BADGE_COLOR[series.status] ?? "light"}>
              {t(`booking.status.${series.status}`, { defaultValue: series.status })}
            </Badge>
            {series.isPriority ? <Badge color="info">{t("bookingSeries.detail.priorityBadge")}</Badge> : null}
            {canCancel && canCancelSeries ? (
              <Button variant="outline" size="sm" className="ml-auto text-red-600 border-red-300" onClick={openCancel}>
                {t("bookingSeries.detail.cancelAction")}
              </Button>
            ) : null}
          </div>

          <dl className="space-y-1 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
            {row(t("bookingSeries.form.booker"), bookerLabel)}
            {row(t("bookingSeries.form.ministry"), ministryLabel || "-")}
            {row(
              t("bookingSeries.detail.range"),
              `${DateUtil.format(series.firstOccurrenceDate, "YYYY-MM-DD")} – ${DateUtil.format(series.lastOccurrenceDate, "YYYY-MM-DD")}`
            )}
            {row(
              t("bookingSeries.detail.timeWindow"),
              `${series.localStartTime.slice(0, 5)} – ${series.localEndTime.slice(0, 5)}`
            )}
            {row(t("bookingSeries.detail.occurrenceCount"), series.occurrenceCount)}
            {row(t("bookingSeries.detail.total"), `${series.quotedAmount} ${series.currency}`)}
            {row(
              t("bookingSeries.detail.holdDeadline"),
              series.paymentHoldExpiresAt ? DateUtil.format(series.paymentHoldExpiresAt) : "-"
            )}
          </dl>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("bookingSeries.detail.occurrencesTitle")}
            </h2>
            <ul className="space-y-2">
              {series.occurrences.map((occurrence) => (
                <li
                  key={occurrence.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                >
                  <div>
                    <p className="m-0 font-medium text-gray-900 dark:text-white">
                      {DateUtil.format(occurrence.startAt)} – {DateUtil.format(occurrence.endAt, "hh:mm A")}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {occurrence.facilityIds.map((id) => roomLabelById.get(id) ?? id).join(", ")}
                      {" · "}
                      {occurrence.quotedAmount} {occurrence.currency}
                    </p>
                  </div>
                  <Badge color={STATUS_BADGE_COLOR[occurrence.status] ?? "light"} size="sm">
                    {t(`booking.status.${occurrence.status}`, { defaultValue: occurrence.status })}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("bookingSeries.detail.overrideHistoryTitle")}
            </h2>
            {overrideLogs.length === 0 ? (
              <p className="text-sm text-gray-500">{t("bookingSeries.detail.overrideHistoryEmpty")}</p>
            ) : (
              <ul className="space-y-2">
                {overrideLogs.map((log) => (
                  <li key={log.id} className="rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-800">
                    <p className="m-0 text-gray-900 dark:text-white">
                      {DateUtil.format(log.createdAt)} · {log.facilityName || log.facilityId}
                    </p>
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {t("bookingSeries.detail.overriddenBy")}: {log.overriddenByName || log.overriddenById}
                      {log.reason ? ` · ${log.reason}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <RecurringSeriesCancelModal
            isOpen={isCancelOpen}
            occurrences={series.occurrences}
            onClose={closeCancel}
            onConfirm={(scope, occurrenceId, cancelReason) => {
              void handleCancel(scope, occurrenceId, cancelReason);
            }}
            submitting={cancelSubmitting}
          />
        </>
      ) : null}
    </div>
  );
};

export default RecurringSeriesDetailPage;
