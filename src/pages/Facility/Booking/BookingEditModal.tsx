import { facilityService, type BookingDetail } from "@/api/services/facilityService";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { Button, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import BookingEditForm, { type BookingEditFormHandle } from "./BookingEditForm";
import { resolveBookingSaveErrorMessage } from "./bookingSaveError";
import { buildBookingUpdatePayload } from "./bookingUpdatePayload";

interface Props {
  booking: BookingDetail | null;
  isOpen: boolean;
  rooms: Array<{ id: string; code: string; name?: string }>;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

const BookingEditModal = ({ booking, isOpen, rooms, onClose, onSaved }: Props) => {
  const { t } = useTranslation(["facility", "common"]);
  const formRef = useRef<BookingEditFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <ModalForm
      ref={modalRef}
      isOpen={isOpen}
      onClose={onClose}
      title={t("booking.modal.editTitle")}
      className="max-w-2xl w-full mx-4 p-6"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button variant="primary" size="sm" onClick={() => modalRef.current?.submit()} disabled={submitting}>
            {t("common:save", { ns: "common" })}
          </Button>
        </>
      }
      onSubmit={async (e) => {
        e.preventDefault();
        if (!formRef.current?.validate() || !booking) return;
        const payload = buildBookingUpdatePayload(formRef.current.getValues());
        setSubmitting(true);
        try {
          await facilityService.updateBooking(booking.id, payload);
          notifySuccess({ title: t("common:feedback.updated") });
          onClose();
          await onSaved();
        } catch (error) {
          notifyApiError(error, {
            title: t("common:feedback.saveFailed"),
            fallbackDescription: t("common:feedback.saveFailedDesc"),
            resolveDescription: (apiError) => resolveBookingSaveErrorMessage(apiError, rooms, t),
          });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {booking && <BookingEditForm ref={formRef} booking={booking} />}
    </ModalForm>
  );
};

export default BookingEditModal;
