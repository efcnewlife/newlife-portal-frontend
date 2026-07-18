import type { MinistryMemberItem } from "@/api/services/ministryService";
import { userService } from "@/api/services/userService";
import { Button, Input, Select } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdDelete } from "react-icons/md";

export type MinistryMemberDraft = {
  userId: string;
  memberRole: "primary" | "secondary";
  email?: string;
  displayName?: string;
  contactEmail?: string;
};

export const validateMinistryMembers = (
  members: MinistryMemberDraft[],
  t: (key: string) => string,
): string | null => {
  const user_ids = members.map((m) => m.userId).filter(Boolean);
  if (new Set(user_ids).size !== user_ids.length) {
    return t("ministry.members.duplicateUser");
  }
  const primary_count = members.filter((m) => m.memberRole === "primary").length;
  const secondary_count = members.filter((m) => m.memberRole === "secondary").length;
  if (primary_count !== 1) return t("ministry.members.validationPrimary");
  if (secondary_count < 1) return t("ministry.members.validationSecondary");
  return null;
};

export const ministryMembersToDraft = (members: MinistryMemberItem[]): MinistryMemberDraft[] =>
  members.map((m) => ({
    userId: m.userId,
    memberRole: m.memberRole === "primary" ? "primary" : "secondary",
    email: m.email,
    displayName: m.displayName,
    contactEmail: m.contactEmail,
  }));

interface MinistryMembersEditorProps {
  value: MinistryMemberDraft[];
  onChange: (members: MinistryMemberDraft[]) => void;
  disabled?: boolean;
  error?: string;
}

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
        })),
      );
    });
  }, []);

  const userOptions = useMemo(
    () => [{ value: "", label: t("ministry.members.selectUser") }, ...users.map((u) => ({ value: u.id, label: u.label }))],
    [users, t],
  );

  const roleOptions = useMemo(
    () => [
      { value: "primary", label: t("ministry.members.primary") },
      { value: "secondary", label: t("ministry.members.secondary") },
    ],
    [t],
  );

  const updateMember = (index: number, patch: Partial<MinistryMemberDraft>) => {
    const next = value.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const addMember = () => {
    onChange([...value, { userId: "", memberRole: "secondary", contactEmail: "" }]);
  };

  const removeMember = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("ministry.form.members")}</p>
        <Button variant="outline" size="sm" onClick={addMember} disabled={disabled}>
          {t("ministry.members.add")}
        </Button>
      </div>
      <p className="text-xs text-gray-500">{t("ministry.form.membersHint")}</p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {value.length === 0 ? (
        <p className="text-sm text-gray-500">{t("ministry.detail.noMembers")}</p>
      ) : (
        <div className="space-y-2">
          {value.map((member, index) => (
            <div key={`${member.userId || "new"}-${index}`} className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6">
                  <Select
                    id={`ministry-member-user-${index}`}
                    label={t("ministry.members.user")}
                    options={userOptions}
                    value={member.userId}
                    disabled={disabled}
                    onChange={(v) => {
                      const user_id = String(v);
                      const user = users.find((u) => u.id === user_id);
                      updateMember(index, {
                        userId: user_id,
                        email: user?.email,
                        displayName: user?.displayName,
                        contactEmail: member.contactEmail || user?.email,
                      });
                    }}
                  />
                </div>
                <div className="col-span-5">
                  <Select
                    id={`ministry-member-role-${index}`}
                    label={t("ministry.members.role")}
                    options={roleOptions}
                    value={member.memberRole}
                    disabled={disabled}
                    onChange={(v) => updateMember(index, { memberRole: String(v) as "primary" | "secondary" })}
                  />
                </div>
                <div className="col-span-1 flex justify-end pb-1">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={t("ministry.members.remove")}
                    disabled={disabled}
                    onClick={() => removeMember(index)}
                  >
                    <MdDelete />
                  </Button>
                </div>
              </div>
              <Input
                id={`ministry-member-contact-email-${index}`}
                label={t("ministry.members.contactEmail")}
                value={member.contactEmail || ""}
                disabled={disabled}
                onChange={(e) => updateMember(index, { contactEmail: e.target.value || undefined })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MinistryMembersEditor;
