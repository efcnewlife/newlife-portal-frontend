import {
  groupMinistryMembersByRole,
  type MinistryMemberDraft,
} from "@/pages/Ministry/components/MinistryMembersEditor";
import { useTranslation } from "react-i18next";

interface StewardRosterViewProps {
  members: MinistryMemberDraft[];
}

const StewardRosterView = ({ members }: StewardRosterViewProps) => {
  const { t } = useTranslation("ministry");
  const grouped = groupMinistryMembersByRole(members);

  const renderGroup = (titleKey: string, emptyKey: string, items: MinistryMemberDraft[]) => (
    <section className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(titleKey)}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{t(emptyKey)}</p>
      ) : (
        <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          {items.map((member) => {
            const name = member.displayName || member.email || member.userId;
            const accountEmail = member.email?.trim() || "";
            const contactEmail = member.contactEmail?.trim() || "";
            const showContact = Boolean(contactEmail && contactEmail !== accountEmail);
            return (
              <li
                key={`${member.memberRole}-${member.userId}`}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <span className="font-medium">{name}</span>
                {accountEmail ? (
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("ministry.members.email")}: {accountEmail}
                  </span>
                ) : null}
                {showContact ? (
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {t("ministry.members.contactEmail")}: {contactEmail}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-5">
      {renderGroup("ministry.members.primary", "ministry.members.emptyPrimary", grouped.primary)}
      {renderGroup("ministry.members.secondary", "ministry.members.emptySecondary", grouped.secondary)}
    </div>
  );
};

export default StewardRosterView;
