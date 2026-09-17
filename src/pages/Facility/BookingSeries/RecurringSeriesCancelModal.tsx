import type { RecurringBookingSeriesOccurrence, RecurringCancellationScope } from "@/api/services/facilityService";
import { DateUtil } from "@/utils/dateUtil";
import {
  affectedOccurrencesForScope,
  APPROVED_CANCELLATION_SCOPES,
  isCancellableOccurrence,
} from "./recurringSeriesCancellation";
import { Alert, Button, Modal, Radio, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface RecurringSeriesCancelModalProps {
  isOpen: boolean;
  occurrences: RecurringBookingSeriesOccurrence[];
  submitting: boolean;
  now?: Date;
  onClose: () => void;
  onConfirm: (scope: RecurringCancellationScope, occurrenceId: string | null, cancelReason: string) => void;
}

const SCOPE_LABEL_KEY: Record<RecurringCancellationScope, string> = {
  occurrence: "bookingSeries.cancel.scopeOccurrence",
  this_and_future: "bookingSeries.cancel.scopeThisAndFuture",
  entire_series: "bookingSeries.cancel.scopeEntireSeries",
};

const RecurringSeriesCancelModal = ({
  isOpen,
  occurrences,
  submitting,
  now = new Date(),
  onClose,
  onConfirm,
}: RecurringSeriesCancelModalProps) => {
  const { t } = useTranslation(["facility", "common"]);
  const cancellable = useMemo(
    () => occurrences.filter((occurrence) => isCancellableOccurrence(occurrence, now)),
    [now, occurrences]
  );
  const [scope, setScope] = useState<RecurringCancellationScope>("occurrence");
  const [occurrenceId, setOccurrenceId] = useState<string | null>(cancellable[0]?.id ?? null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setScope("occurrence");
    setOccurrenceId(cancellable[0]?.id ?? null);
    setCancelReason("");
  }, [cancellable, isOpen]);

  const needsOccurrence = scope === "occurrence" || scope === "this_and_future";
  const affected = affectedOccurrencesForScope(occurrences, scope, needsOccurrence ? occurrenceId : null, now);

  return (
    <Modal
      className="mx-4 w-full max-w-lg p-6"
      footer={
        <>
          <Button onClick={onClose} size="sm" variant="outline" disabled={submitting}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button
            disabled={submitting || affected.length === 0 || (needsOccurrence && !occurrenceId)}
            onClick={() => onConfirm(scope, needsOccurrence ? occurrenceId : null, cancelReason.trim())}
            size="sm"
            variant="primary"
          >
            {t("bookingSeries.cancel.confirm")}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title={t("bookingSeries.cancel.title")}
    >
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm text-gray-600 dark:text-gray-300">{t("bookingSeries.cancel.intro")}</p>
        <div className="flex flex-col gap-2">
          {APPROVED_CANCELLATION_SCOPES.map((value) => (
            <Radio
              checked={scope === value}
              id={`bs-cancel-scope-${value}`}
              key={value}
              label={t(SCOPE_LABEL_KEY[value])}
              name="recurring-series-cancel-scope"
              onChange={(next) => setScope(next as RecurringCancellationScope)}
              value={value}
            />
          ))}
        </div>
        {needsOccurrence ? (
          <fieldset className="m-0 space-y-2 border-0 p-0">
            <legend className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("bookingSeries.cancel.chooseOccurrence")}
            </legend>
            {cancellable.length === 0 ? (
              <p className="m-0 text-sm text-gray-600 dark:text-gray-300">
                {t("bookingSeries.cancel.noneCancellable")}
              </p>
            ) : (
              cancellable.map((occurrence) => (
                <Radio
                  checked={occurrenceId === occurrence.id}
                  id={`bs-cancel-occurrence-${occurrence.id}`}
                  key={occurrence.id}
                  label={DateUtil.format(occurrence.startAt, "YYYY-MM-DD") ?? occurrence.startAt}
                  name="recurring-series-cancel-occurrence"
                  onChange={setOccurrenceId}
                  value={occurrence.id}
                />
              ))
            )}
          </fieldset>
        ) : null}
        {affected.length > 0 ? (
          <div>
            <p className="m-0 text-sm font-semibold text-gray-900 dark:text-white">
              {t("bookingSeries.cancel.affectedTitle", { count: affected.length })}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
              {affected.map((occurrence) => (
                <li key={occurrence.id}>{DateUtil.format(occurrence.startAt, "YYYY-MM-DD")}</li>
              ))}
            </ul>
          </div>
        ) : (
          <Alert title={t("bookingSeries.cancel.noneAffected")} variant="warning" size="sm" width="full" />
        )}
        <TextArea
          id="bs-cancel-reason"
          label={t("bookingSeries.cancel.reason")}
          value={cancelReason}
          onChange={setCancelReason}
          rows={2}
        />
      </div>
    </Modal>
  );
};

export default RecurringSeriesCancelModal;
