import { Button, TextArea } from "@efcnewlife/newlife-ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface BookingCancelFormProps {
  onSubmit: (payload: { cancelReason?: string; scope?: string }) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const BookingCancelForm = ({ onSubmit, onCancel, submitting }: BookingCancelFormProps) => {
  const { t } = useTranslation("facility");
  const [cancelReason, setCancelReason] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ cancelReason: cancelReason.trim() || undefined, scope: "single" });
      }}
    >
      <TextArea
        id="cancel-reason"
        label={t("booking.cancel.reason")}
        value={cancelReason}
        onChange={setCancelReason}
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button btnType="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          {t("common:cancel", { ns: "common" })}
        </Button>
        <Button btnType="submit" variant="primary" size="sm" disabled={submitting}>
          {t("booking.cancel.confirm")}
        </Button>
      </div>
    </form>
  );
};

export default BookingCancelForm;
