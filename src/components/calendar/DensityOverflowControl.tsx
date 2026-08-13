import { cn } from "@/utils";
import { useTranslation } from "react-i18next";

interface DensityOverflowControlProps {
  count: number;
  date: Date;
  top: number;
  onActivate: (date: Date) => void;
}

const DensityOverflowControl = ({ count, date, top, onActivate }: DensityOverflowControlProps) => {
  const { t } = useTranslation("calendar");

  return (
    <button
      type="button"
      className={cn(
        "absolute z-30 max-w-[calc(100%-0.5rem)] truncate rounded border px-1.5 py-0.5 text-[10px] font-medium shadow-sm",
        "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
      )}
      style={{ top: `${top}px`, left: "4px" }}
      onClick={(event) => {
        event.stopPropagation();
        onActivate(date);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      aria-label={t("densityOverflowAria", { count })}
    >
      {t("densityOverflow", { count })}
    </button>
  );
};

export default DensityOverflowControl;
