import type { MinistryDetail, MinistryListItem } from "@/api/services/ministryService";
import type { MinistryMemberDraft } from "@/pages/Ministry/components/MinistryMembersEditor";
import { Spinner } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { MdEdit } from "react-icons/md";
import StewardDetailHeader from "./StewardDetailHeader";
import StewardDetailSection from "./StewardDetailSection";
import StewardMinistrySummary from "./StewardMinistrySummary";
import StewardOwnerPositionSummary from "./StewardOwnerPositionSummary";
import StewardRosterView from "./StewardRosterView";
import StewardStewardsEditModal from "./StewardStewardsEditModal";

interface StewardDetailPaneProps {
  selectedId: string | null;
  ministry: MinistryDetail | null;
  railItem: MinistryListItem | null;
  loadingRoster: boolean;
  isEditing: boolean;
  canModify: boolean;
  members: MinistryMemberDraft[];
  onMembersChange: (members: MinistryMemberDraft[]) => void;
  memberError?: string;
  ownerPositionLabel: string | null;
  ownerPositionIncumbent: string | null;
  ownerPositionId: string | null;
  saving: boolean;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
}

const StewardDetailPane = ({
  selectedId,
  ministry,
  railItem,
  loadingRoster,
  isEditing,
  canModify,
  members,
  onMembersChange,
  memberError,
  ownerPositionLabel,
  ownerPositionIncumbent,
  ownerPositionId,
  saving,
  onEnterEdit,
  onCancelEdit,
  onSave,
}: StewardDetailPaneProps) => {
  const { t } = useTranslation("ministry");

  if (!selectedId) {
    return (
      <section className="flex-1 min-h-0 flex flex-col">
        <p className="p-4 text-sm text-gray-500">{t("ministryMember.emptyDetail")}</p>
      </section>
    );
  }

  const ministryName = ministry?.name || railItem?.name || selectedId;
  const ministryStatus = ministry?.status || railItem?.status || "";

  return (
    <section className="relative flex-1 min-h-0 flex flex-col">
      {ministryStatus ? <StewardDetailHeader name={ministryName} status={ministryStatus} /> : null}
      <div className="relative min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-5xl">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ministry ? (
              <StewardDetailSection title={t("ministryMember.sections.overview")}>
                <StewardMinistrySummary ministry={ministry} />
              </StewardDetailSection>
            ) : (
              <StewardDetailSection title={t("ministryMember.sections.overview")}>
                <div className="h-16" aria-hidden />
              </StewardDetailSection>
            )}
            <StewardDetailSection title={t("ministryMember.sections.owner")}>
              {ownerPositionId || ownerPositionLabel ? (
                <StewardOwnerPositionSummary
                  label={ownerPositionLabel}
                  incumbent={ownerPositionIncumbent}
                  hasPosition={Boolean(ownerPositionId)}
                />
              ) : (
                <div className="h-10" aria-hidden />
              )}
            </StewardDetailSection>
          </div>
          <StewardDetailSection
            title={t("ministryMember.sections.stewards")}
            headerAction={
              canModify && !loadingRoster ? (
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                  aria-label={t("common:edit", { ns: "common", defaultValue: "Edit" })}
                  onClick={onEnterEdit}
                >
                  <MdEdit className="size-4" aria-hidden />
                </button>
              ) : null
            }
          >
            <StewardRosterView members={members} />
          </StewardDetailSection>
        </div>
      </div>
      {loadingRoster ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-gray-900"
          role="status"
          aria-live="polite"
          aria-label={t("common:loading", { ns: "common", defaultValue: "Loading..." })}
        >
          <Spinner size="lg" color="primary" />
        </div>
      ) : null}
      <StewardStewardsEditModal
        isOpen={isEditing}
        ministryName={ministryName}
        members={members}
        onMembersChange={onMembersChange}
        memberError={memberError}
        saving={saving}
        onClose={onCancelEdit}
        onSave={onSave}
      />
    </section>
  );
};

export default StewardDetailPane;
