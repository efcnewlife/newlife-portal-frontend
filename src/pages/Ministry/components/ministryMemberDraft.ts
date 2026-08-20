import type { MinistryMemberItem } from "@/api/services/ministryService";

export type MinistryMemberDraft = {
  userId: string;
  memberRole: "primary" | "secondary";
  email?: string;
  displayName?: string;
  contactEmail?: string;
};

export const groupMinistryMembersByRole = (members: MinistryMemberDraft[]) => ({
  primary: members.filter((m) => m.memberRole === "primary"),
  secondary: members.filter((m) => m.memberRole === "secondary"),
});

export const memberUserLabel = (member: Pick<MinistryMemberDraft, "userId" | "email" | "displayName">): string =>
  member.displayName ? `${member.displayName} (${member.email || member.userId})` : member.email || member.userId;

export const userSelectOptionsForMember = (
  member: MinistryMemberDraft,
  users: Array<{ id: string; label: string }>,
  selectedUserIds: Set<string>,
  selectUserLabel: string,
): Array<{ value: string; label: string }> => {
  const current = member.userId
    ? [
        {
          value: member.userId,
          label: users.find((user) => user.id === member.userId)?.label || memberUserLabel(member),
        },
      ]
    : [];
  const rest = users
    .filter((user) => user.id !== member.userId && !selectedUserIds.has(user.id))
    .map((user) => ({ value: user.id, label: user.label }));
  return [{ value: "", label: selectUserLabel }, ...current, ...rest];
};

export const validateMinistryMembers = (members: MinistryMemberDraft[], t: (key: string) => string): string | null => {
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

export const ministryMembersToDraft = (members: MinistryMemberItem[]): MinistryMemberDraft[] => {
  const drafts = members.map((m) => ({
    userId: m.userId,
    memberRole: (m.memberRole === "primary" ? "primary" : "secondary") as "primary" | "secondary",
    email: m.email,
    displayName: m.displayName,
    contactEmail: m.contactEmail,
  }));
  const grouped = groupMinistryMembersByRole(drafts);
  return [...grouped.primary, ...grouped.secondary];
};
