import {
  facilityService,
  type PreviewRecurringBookingSeriesPayload,
  type RecurringBookingConflict,
  type RecurringBookingSeriesDetail,
} from "@/api/services/facilityService";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { Button, Modal } from "@efcnewlife/newlife-ui";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import RecurringSeriesConflictReview from "./RecurringSeriesConflictReview";
import RecurringSeriesDataForm, { type RecurringSeriesDataFormHandle } from "./RecurringSeriesDataForm";
import { canCreateRecurringSeriesWithExclusions } from "./recurringSeriesConflicts";
import { buildRecurringSeriesCreatePayload } from "./recurringSeriesPayload";
import { resolveRecurringSeriesErrorMessage } from "./recurringSeriesErrorCode";

interface RoomOption {
  id: string;
  code: string;
  name?: string;
}

interface RecurringSeriesCreateModalProps {
  isOpen: boolean;
  rooms: RoomOption[];
  onClose: () => void;
  onCreated: (series: RecurringBookingSeriesDetail) => void;
}

type Phase = "form" | "conflicts";

const RecurringSeriesCreateModal = ({ isOpen, rooms, onClose, onCreated }: RecurringSeriesCreateModalProps) => {
  const { t } = useTranslation(["facility", "common"]);
  const formRef = useRef<RecurringSeriesDataFormHandle>(null);
  const titleRef = useRef("");

  const [resetKey, setResetKey] = useState(0);
  const [phase, setPhase] = useState<Phase>("form");
  const [previewPayload, setPreviewPayload] = useState<PreviewRecurringBookingSeriesPayload | null>(null);
  const [conflicts, setConflicts] = useState<RecurringBookingConflict[]>([]);
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [totalOccurrenceCount, setTotalOccurrenceCount] = useState(0);
  const [isPriorityMinistry, setIsPriorityMinistry] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetAndClose = () => {
    titleRef.current = "";
    setPhase("form");
    setPreviewPayload(null);
    setConflicts([]);
    setExcludedDates([]);
    setTotalOccurrenceCount(0);
    setIsPriorityMinistry(false);
    setResetKey((key) => key + 1);
    onClose();
  };

  const finishCreate = async (payload: PreviewRecurringBookingSeriesPayload, excluded: string[]) => {
    setSubmitting(true);
    try {
      const res = await facilityService.createBookingSeries(
        buildRecurringSeriesCreatePayload(payload, titleRef.current, excluded)
      );
      if (res.success) {
        notifySuccess({ title: t("common:feedback.created") });
        onCreated(res.data);
        resetAndClose();
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.saveFailed"),
        fallbackDescription: t("common:feedback.saveFailedDesc"),
        resolveDescription: (apiError) => resolveRecurringSeriesErrorMessage(apiError, rooms, t),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async () => {
    if (!formRef.current?.validate()) return;
    const payload = formRef.current.getPreviewPayload();
    if (!payload) return;
    titleRef.current = formRef.current.getTitle();

    setSubmitting(true);
    try {
      const res = await facilityService.previewBookingSeries(payload);
      if (!res.success) return;
      const occurrenceCount = formRef.current.getOccurrenceCount();
      setTotalOccurrenceCount(occurrenceCount);
      setIsPriorityMinistry(formRef.current.isPriorityMinistry());
      if (res.data.conflicts.length === 0) {
        setSubmitting(false);
        await finishCreate(payload, []);
        return;
      }
      setPreviewPayload(payload);
      setConflicts(res.data.conflicts);
      setExcludedDates([]);
      setPhase("conflicts");
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.saveFailed"),
        fallbackDescription: t("common:feedback.saveFailedDesc"),
        resolveDescription: (apiError) => resolveRecurringSeriesErrorMessage(apiError, rooms, t),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExcludedDate = (occurrenceDate: string) => {
    setExcludedDates((current) =>
      current.includes(occurrenceDate)
        ? current.filter((date) => date !== occurrenceDate)
        : [...current, occurrenceDate]
    );
  };

  const canCreate = canCreateRecurringSeriesWithExclusions(conflicts, excludedDates);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) resetAndClose();
      }}
      title={phase === "form" ? t("bookingSeries.modal.createTitle") : t("bookingSeries.modal.reviewConflictsTitle")}
      className="max-w-2xl w-full mx-4 p-6"
      footer={
        phase === "form" ? (
          <>
            <Button variant="outline" size="sm" onClick={resetAndClose} disabled={submitting}>
              {t("common:cancel", { ns: "common" })}
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handlePreview()} disabled={submitting}>
              {submitting ? t("bookingSeries.modal.previewing") : t("bookingSeries.modal.previewAction")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => setPhase("form")} disabled={submitting}>
              {t("bookingSeries.modal.back")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submitting || !canCreate || !previewPayload}
              onClick={() => {
                if (previewPayload) void finishCreate(previewPayload, excludedDates);
              }}
            >
              {t("bookingSeries.modal.createAction")}
            </Button>
          </>
        )
      }
    >
      {phase === "form" ? (
        <RecurringSeriesDataForm key={resetKey} ref={formRef} rooms={rooms} />
      ) : (
        <RecurringSeriesConflictReview
          conflicts={conflicts}
          excludedDates={excludedDates}
          isPriorityMinistry={isPriorityMinistry}
          onToggleExcludeDate={toggleExcludedDate}
          rooms={rooms}
          totalOccurrenceCount={totalOccurrenceCount}
        />
      )}
    </Modal>
  );
};

export default RecurringSeriesCreateModal;
