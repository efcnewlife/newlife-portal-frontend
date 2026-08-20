import MinistryMembersEditor, { type MinistryMemberDraft } from "@/pages/Ministry/components/MinistryMembersEditor";
import { Button, ModalForm } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

interface StewardStewardsEditModalProps {
  isOpen: boolean;
  ministryName: string;
  members: MinistryMemberDraft[];
  onMembersChange: (members: MinistryMemberDraft[]) => void;
  memberError?: string;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

const StewardStewardsEditModal = ({
  isOpen,
  ministryName,
  members,
  onMembersChange,
  memberError,
  saving,
  onClose,
  onSave,
}: StewardStewardsEditModalProps) => {
  const { t } = useTranslation("ministry");

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title={t("ministryMember.editModal.title", { name: ministryName })}
      className="max-w-3xl w-full mx-4 p-6"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {t("ministryMember.save")}
          </Button>
        </>
      }
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <MinistryMembersEditor value={members} onChange={onMembersChange} error={memberError} disabled={saving} />
    </ModalForm>
  );
};

export default StewardStewardsEditModal;
