import { Button, Modal } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

interface StewardUnsavedModalProps {
  isOpen: boolean;
  canModify: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

const StewardUnsavedModal = ({ isOpen, canModify, onClose, onDiscard, onSave }: StewardUnsavedModalProps) => {
  const { t } = useTranslation("ministry");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("ministryMember.unsaved.title")} className="max-w-md mx-4 p-6">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t("ministryMember.unsaved.body")}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("common:cancel", { ns: "common" })}
        </Button>
        <Button variant="outline" size="sm" onClick={onDiscard}>
          {t("ministryMember.unsaved.discard")}
        </Button>
        {canModify ? (
          <Button variant="primary" size="sm" onClick={onSave}>
            {t("ministryMember.save")}
          </Button>
        ) : null}
      </div>
    </Modal>
  );
};

export default StewardUnsavedModal;
