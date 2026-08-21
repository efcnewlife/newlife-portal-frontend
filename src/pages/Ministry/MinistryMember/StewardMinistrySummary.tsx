import type { MinistryDetail } from "@/api/services/ministryService";
import { DateUtil } from "@/utils/dateUtil";
import { useTranslation } from "react-i18next";

interface StewardMinistrySummaryProps {
  ministry: MinistryDetail;
}

const StewardMinistrySummary = ({ ministry }: StewardMinistrySummaryProps) => {
  const { t } = useTranslation("ministry");
  const audienceNames = (ministry.targetAudiences || []).map((item) => item.name || item.code).filter(Boolean);
  const createdLabel = ministry.createAt ? DateUtil.format(ministry.createAt) : null;
  const updatedLabel = ministry.updateAt ? DateUtil.format(ministry.updateAt) : null;

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      <div>
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("ministry.table.ministryType")}</dt>
        <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
          {ministry.ministryType?.name || ministry.ministryType?.code || "-"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("ministry.table.targetAudiences")}</dt>
        <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
          {audienceNames.length > 0 ? audienceNames.join(", ") : "-"}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t("ministry.table.hasPriorityBooking")}
        </dt>
        <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
          {ministry.hasPriorityBooking ? t("shared.yes") : t("shared.no")}
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("ministry.table.createdAt")}</dt>
        <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{createdLabel || "-"}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("ministry.table.updatedAt")}</dt>
        <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{updatedLabel || "-"}</dd>
      </div>
    </dl>
  );
};

export default StewardMinistrySummary;
