import type { ReactNode } from "react";
import { Button } from "@efcnewlife/newlife-ui";
import type { FileSummaryResponse, MediaCategory } from "./types";
import { formatBytes, getCategorySharePercent } from "./utils";
import { cn } from "@/utils";
import { useTranslation } from "react-i18next";
import { MdDescription, MdImage } from "react-icons/md";

interface MediaCategoryCardsProps {
  summary: FileSummaryResponse | null;
  activeCategory: MediaCategory;
  onCategoryChange: (category: MediaCategory) => void;
  onUploadClick: () => void;
}

const MediaCategoryCards = ({
  summary,
  activeCategory,
  onCategoryChange,
  onUploadClick,
}: MediaCategoryCardsProps) => {
  const { t } = useTranslation("content");
  const totalBytes = summary?.total.sizeBytes ?? 0;
  const imagesCount = summary?.images.count ?? 0;
  const filesCount = summary?.files.count ?? 0;
  const imagesBytes = summary?.images.sizeBytes ?? 0;
  const filesBytes = summary?.files.sizeBytes ?? 0;
  const imagesShare = getCategorySharePercent(imagesBytes, totalBytes);
  const filesShare = getCategorySharePercent(filesBytes, totalBytes);

  const cards: Array<{
    category: MediaCategory;
    icon: ReactNode;
    iconClassName: string;
    count: number;
    sizeBytes: number;
    share: number;
    barClassName: string;
    activeRingClassName: string;
  }> = [
    {
      category: "images",
      icon: <MdImage className="size-5" />,
      iconClassName: "bg-success-500/[0.08] text-success-500",
      count: imagesCount,
      sizeBytes: imagesBytes,
      share: imagesShare,
      barClassName: "bg-success-400",
      activeRingClassName: "border-blue-200 bg-blue-50/40 ring-2 ring-blue-500 dark:border-blue-500/40 dark:bg-blue-500/10",
    },
    {
      category: "files",
      icon: <MdDescription className="size-5" />,
      iconClassName: "bg-warning-500/[0.08] text-warning-500",
      count: filesCount,
      sizeBytes: filesBytes,
      share: filesShare,
      barClassName: "bg-warning-400",
      activeRingClassName: "border-blue-200 bg-blue-50/40 ring-2 ring-blue-500 dark:border-blue-500/40 dark:bg-blue-500/10",
    },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6 lg:col-span-2 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white/90">{t("file.overview.allMedia")}</h2>
        <Button variant="primary" size="sm" onClick={onUploadClick}>
          {t("file.toolbar.upload")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const isActive = activeCategory === card.category;
          return (
            <button
              key={card.category}
              type="button"
              aria-pressed={isActive}
              onClick={() => onCategoryChange(card.category)}
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                isActive
                  ? card.activeRingClassName
                  : "border-gray-100 bg-gray-50/80 hover:border-gray-200 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20",
              )}
            >
              <div className="mb-3 flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    card.iconClassName,
                  )}
                >
                  {card.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white/90">
                    {t(`file.category.${card.category}`)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("file.overview.categorySummary", {
                      count: card.count,
                      size: formatBytes(card.sizeBytes),
                    })}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={cn("h-full rounded-full", card.barClassName)} style={{ width: `${card.share}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MediaCategoryCards;
