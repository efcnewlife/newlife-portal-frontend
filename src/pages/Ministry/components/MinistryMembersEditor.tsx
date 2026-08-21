import { userService } from "@/api/services/userService";
import {
  groupMinistryMembersByRole,
  type MinistryMemberDraft,
  userSelectOptionsForMember,
} from "@/pages/Ministry/components/ministryMemberDraft";
import { cn } from "@/utils";
import { Alert, Button, Input, Select } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdDelete } from "react-icons/md";

export {
  groupMinistryMembersByRole,
  ministryMembersToDraft,
  validateMinistryMembers,
} from "@/pages/Ministry/components/ministryMemberDraft";
export type { MinistryMemberDraft };

interface MinistryMembersEditorProps {
  value: MinistryMemberDraft[];
  onChange: (members: MinistryMemberDraft[]) => void;
  disabled?: boolean;
  error?: string;
}

const emptyMember = (memberRole: "primary" | "secondary"): MinistryMemberDraft => ({
  userId: "",
  memberRole,
  contactEmail: "",
});

const MinistryMembersEditor = ({ value, onChange, disabled = false, error }: MinistryMembersEditorProps) => {
  const { t } = useTranslation("ministry");
  const [users, setUsers] = useState<Array<{ id: string; label: string; email?: string; displayName?: string }>>([]);

  useEffect(() => {
    void userService.getList({}).then((res) => {
      if (!res.success) return;
      const items = res.data?.items || [];
      setUsers(
        items.map((u) => ({
          id: u.id,
          label: u.displayName ? `${u.displayName} (${u.email || u.id})` : u.email || u.id,
          email: u.email,
          displayName: u.displayName,
        }))
      );
    });
  }, []);

  const { primary, secondary } = groupMinistryMembersByRole(value);

  const emit = (nextPrimary: MinistryMemberDraft[], nextSecondary: MinistryMemberDraft[]) => {
    onChange([
      ...nextPrimary.map((member) => ({ ...member, memberRole: "primary" as const })),
      ...nextSecondary.map((member) => ({ ...member, memberRole: "secondary" as const })),
    ]);
  };

  const selectedUserIds = useMemo(() => new Set(value.map((member) => member.userId).filter(Boolean)), [value]);

  const userOptionsFor = (member: MinistryMemberDraft) =>
    userSelectOptionsForMember(member, users, selectedUserIds, t("ministry.members.selectUser"));

  const patchMember = (role: "primary" | "secondary", index: number, patch: Partial<MinistryMemberDraft>) => {
    if (role === "primary") {
      emit(
        primary.map((member, i) => (i === index ? { ...member, ...patch } : member)),
        secondary
      );
      return;
    }
    emit(
      primary,
      secondary.map((member, i) => (i === index ? { ...member, ...patch } : member))
    );
  };

  const applyUser = (role: "primary" | "secondary", index: number, userId: string) => {
    const user = users.find((u) => u.id === userId);
    const current = role === "primary" ? primary[index] : secondary[index];
    patchMember(role, index, {
      userId,
      email: user?.email,
      displayName: user?.displayName,
      contactEmail: current?.contactEmail || user?.email,
    });
  };

  const canAddPrimary = primary.length === 0;

  return (
    <div className="space-y-5">
      <Alert variant="warning" size="sm" width="full" title={t("ministry.form.membersHint")} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("ministry.members.primary")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => emit([emptyMember("primary")], secondary)}
            disabled={disabled || !canAddPrimary}
          >
            {t("ministry.members.addPrimary")}
          </Button>
        </div>
        <p className="text-xs text-gray-500">{t("ministry.members.primaryHint")}</p>
        {primary.length === 0 ? (
          <p className="text-sm text-gray-500">{t("ministry.members.emptyPrimary")}</p>
        ) : (
          <div className="space-y-2">
            {primary.map((member, index) => (
              <MemberFields
                key={`primary-${member.userId || "new"}-${index}`}
                idPrefix={`ministry-member-primary-${index}`}
                member={member}
                disabled={disabled}
                userOptions={userOptionsFor(member)}
                t={t}
                onUserChange={(userId) => applyUser("primary", index, userId)}
                onContactChange={(contactEmail) => patchMember("primary", index, { contactEmail })}
                onRemove={() =>
                  emit(
                    primary.filter((_, i) => i !== index),
                    secondary
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("ministry.members.secondary")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => emit(primary, [...secondary, emptyMember("secondary")])}
            disabled={disabled}
          >
            {t("ministry.members.addSecondary")}
          </Button>
        </div>
        {secondary.length === 0 ? (
          <p className="text-sm text-gray-500">{t("ministry.members.emptySecondary")}</p>
        ) : (
          <div className="space-y-2">
            {secondary.map((member, index) => (
              <MemberFields
                key={`secondary-${member.userId || "new"}-${index}`}
                idPrefix={`ministry-member-secondary-${index}`}
                member={member}
                disabled={disabled}
                userOptions={userOptionsFor(member)}
                t={t}
                onUserChange={(userId) => applyUser("secondary", index, userId)}
                onContactChange={(contactEmail) => patchMember("secondary", index, { contactEmail })}
                onRemove={() =>
                  emit(
                    primary,
                    secondary.filter((_, i) => i !== index)
                  )
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface MemberFieldsProps {
  idPrefix: string;
  member: MinistryMemberDraft;
  disabled: boolean;
  userOptions: Array<{ value: string; label: string }>;
  t: (key: string) => string;
  onUserChange: (userId: string) => void;
  onContactChange: (contactEmail: string | undefined) => void;
  onRemove: () => void;
}

const MemberFields = ({
  idPrefix,
  member,
  disabled,
  userOptions,
  t,
  onUserChange,
  onContactChange,
  onRemove,
}: MemberFieldsProps) => (
  <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Select
          id={`${idPrefix}-user`}
          label={t("ministry.members.user")}
          options={userOptions}
          value={member.userId}
          disabled={disabled}
          onChange={(v) => onUserChange(String(v))}
        />
      </div>
      <button
        type="button"
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50",
          "dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10",
          disabled && "cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent"
        )}
        aria-label={t("ministry.members.remove")}
        disabled={disabled}
        onClick={onRemove}
      >
        <MdDelete className="size-5" />
      </button>
    </div>
    <Input
      id={`${idPrefix}-contact-email`}
      label={t("ministry.members.contactEmail")}
      value={member.contactEmail || ""}
      disabled={disabled}
      onChange={(e) => onContactChange(e.target.value || undefined)}
    />
  </div>
);

export default MinistryMembersEditor;
