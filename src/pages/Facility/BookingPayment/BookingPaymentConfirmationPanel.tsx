import { facilityService, type PendingPaymentSeriesItem } from "@/api/services/facilityService";
import { usePermissions } from "@/context/AuthContext";
import { DateUtil } from "@/utils/dateUtil";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { Badge, Button, Modal } from "@efcnewlife/newlife-ui";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdRefresh } from "react-icons/md";
import { resolveConfirmPaymentErrorMessage } from "./pendingPaymentConfirmError";
import { canConfirmPendingPayment } from "./pendingPaymentPermission";

const BookingPaymentConfirmationPanel = () => {
  const { t } = useTranslation(["facility", "common"]);
  const { hasPermission } = usePermissions();
  const canConfirm = canConfirmPendingPayment(hasPermission);

  const [items, setItems] = useState<PendingPaymentSeriesItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<PendingPaymentSeriesItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getPendingPaymentSeriesList();
      if (res.success) {
        setItems(res.data.items || []);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleConfirm = useCallback(async () => {
    if (!confirming) return;
    setSubmitting(true);
    try {
      await facilityService.confirmSeriesPayment(confirming.id);
      notifySuccess({ title: t("facility:bookingPayment.feedback.confirmed") });
      setConfirming(null);
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.saveFailed"),
        fallbackDescription: t("common:feedback.saveFailedDesc"),
        resolveDescription: (apiError) => resolveConfirmPaymentErrorMessage(apiError, t),
      });
      // The Series may have expired or already been resolved by another Operator;
      // refresh so a stale row is never left looking actionable.
      setConfirming(null);
    } finally {
      setSubmitting(false);
      await fetchList();
    }
  }, [confirming, fetchList, t]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchList()}
          disabled={loading}
          startIcon={<MdRefresh className="size-4" />}
        >
          {t("facility:bookingPayment.panel.refresh")}
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("facility:bookingPayment.panel.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("facility:bookingPayment.panel.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.userDisplayName || item.userEmail || item.userId}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {item.ministryName && `${item.ministryName} · `}
                    {t("facility:bookingPayment.table.occurrences")}: {item.occurrenceCount}
                    {" · "}
                    {item.quotedAmount} {item.currency}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("facility:bookingPayment.table.holdExpires")}:{" "}
                    {item.paymentHoldExpiresAt ? DateUtil.format(item.paymentHoldExpiresAt) : "—"}
                    {item.paymentHoldExpiresAt && ` (${DateUtil.friendlyDate(item.paymentHoldExpiresAt)})`}
                  </p>
                  {item.isPriority && (
                    <Badge color="warning" size="sm">
                      {t("facility:bookingPayment.badge.priority")}
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {canConfirm && (
                    <Button variant="primary" size="sm" onClick={() => setConfirming(item)}>
                      {t("facility:bookingPayment.modal.confirmAction")}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        title={t("facility:bookingPayment.modal.confirmTitle")}
        className="max-w-lg mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirming(null)} disabled={submitting}>
              {t("common:cancel", { ns: "common" })}
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleConfirm()} disabled={submitting}>
              {t("facility:bookingPayment.modal.confirmAction")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">{t("facility:bookingPayment.modal.confirmBody")}</p>
      </Modal>
    </div>
  );
};

export default BookingPaymentConfirmationPanel;
