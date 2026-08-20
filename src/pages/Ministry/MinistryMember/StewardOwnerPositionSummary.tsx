import { useTranslation } from "react-i18next";

interface StewardOwnerPositionSummaryProps {
  label: string | null;
  incumbent: string | null;
  hasPosition: boolean;
}

const StewardOwnerPositionSummary = ({ label, incumbent, hasPosition }: StewardOwnerPositionSummaryProps) => {
  const { t: tOrg } = useTranslation("org");

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-700 dark:text-gray-300">{label || "-"}</p>
      {hasPosition ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {tOrg("position.detail.currentIncumbent")}: {incumbent || tOrg("position.detail.noIncumbent")}
        </p>
      ) : null}
    </div>
  );
};

export default StewardOwnerPositionSummary;
