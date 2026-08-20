import { Badge } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import { ministryStatusBadgeColor } from "./ministryStatusBadge";

interface StewardDetailHeaderProps {
  name: string;
  status: string;
}

const StewardDetailHeader = ({ name, status }: StewardDetailHeaderProps) => {
  const { t } = useTranslation("ministry");

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
      <h2 className="min-w-0 truncate text-lg font-semibold text-gray-800 dark:text-white/90">{name}</h2>
      <span className="shrink-0">
        <Badge variant="light" size="sm" color={ministryStatusBadgeColor(status)}>
          {t(`ministry.status.${status}`, { defaultValue: status })}
        </Badge>
      </span>
    </div>
  );
};

export default StewardDetailHeader;
