import type { FileSummaryResponse } from "./types";
import { formatBytes, getCategorySharePercent, getDonutGradient } from "./utils";
import { useTranslation } from "react-i18next";

interface StorageDetailsCardProps {
  summary: FileSummaryResponse | null;
}

const StorageDetailsCard = ({ summary }: StorageDetailsCardProps) => {
  const { t } = useTranslation("content");
  const totalBytes = summary?.total.sizeBytes ?? 0;
  const totalCount = summary?.total.count ?? 0;
  const imagesBytes = summary?.images.sizeBytes ?? 0;
  const filesBytes = summary?.files.sizeBytes ?? 0;
  const imagesPercent = getCategorySharePercent(imagesBytes, totalBytes);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6 dark:border-white/10 dark:bg-white/[0.03]">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white/90">
        {t("file.overview.storageDetails")}
      </h2>

      <div
        className="mx-auto mb-5 flex h-44 w-44 items-center justify-center rounded-full"
        style={{ background: getDonutGradient(imagesPercent) }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("file.overview.totalUsed")}</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white/90">{formatBytes(totalBytes)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("file.overview.totalFiles", { count: totalCount })}
          </p>
        </div>
      </div>

      <ul className="space-y-3 text-sm">
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="h-2.5 w-2.5 rounded-full bg-success-400" />
            {t("file.category.images")}
          </span>
          <span className="font-medium text-gray-900 dark:text-white/90">{formatBytes(imagesBytes)}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span className="h-2.5 w-2.5 rounded-full bg-warning-400" />
            {t("file.category.files")}
          </span>
          <span className="font-medium text-gray-900 dark:text-white/90">{formatBytes(filesBytes)}</span>
        </li>
      </ul>
    </section>
  );
};

export default StorageDetailsCard;
