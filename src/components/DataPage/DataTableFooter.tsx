interface DataTableFooterProps {
  /** Current page number */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Display quantity per page */
  rowsPerPage: number;
  /** Total number of data */
  totalEntries: number;
  /** Quantity per page options */
  pageSizeOptions?: number[];
  /** Page change event */
  onPageChange: (page: number) => void;
  /** Quantity per page change event */
  onRowsPerPageChange: (rowsPerPage: number) => void;
}
import { useTranslation } from "react-i18next";

const getPages = (current: number, total: number): (number | "ellipsis")[] => {
  const pages: (number | "ellipsis")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  const nearStart = current <= 3;
  const nearEnd = current >= total - 2;

  if (nearStart || nearEnd) {
    pages.push(1, 2, 3, "ellipsis", total - 2, total - 1, total);
    return pages;
  }

  pages.push(1, "ellipsis", current - 1, current, current + 1, "ellipsis", total);
  return pages;
};

export default function DataTableFooter({
  currentPage,
  totalPages,
  rowsPerPage,
  totalEntries,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onRowsPerPageChange,
}: DataTableFooterProps) {
  const { t } = useTranslation();
  const pages = getPages(currentPage, totalPages);

  return (
    <div className="border border-t-0 border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05] rounded-b-xl">
      <div className="flex flex-col items-center justify-between gap-4 xl:flex-row">
        {/* Left: Pagination */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.583 9.999c-.0003.1922.0729.3846.2195.5313l4.9966 5.0001c.2928.2929.7677.2931 1.0607.0003.293-.2928.2931-.7677.0003-1.0607L5.1401 10.7472H16.6675c.4142 0 .75-.3358.75-.75s-.3358-.75-.75-.75H5.1455l3.7146-3.71704c.2928-.29299.2927-.76786-.0003-1.06066-.293-.2928-.7679-.29265-1.0607.00034L2.8417 9.4305c-.1585.13751-.2587.34038-.2587.56666 0 .00051 0 .00102.0001.00153Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) =>
              p === "ellipsis" ? (
                <span key={`e-${idx}`} className="px-2 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                    currentPage === p
                      ? "bg-brand-500 text-white"
                      : "text-gray-700 hover:bg-brand-500/[0.08] hover:text-brand-500 dark:hover:bg-brand-500 dark:hover:text-white dark:text-gray-400"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.4175 9.9986c.0003.1923-.0729.3846-.2195.5314l-4.9967 5.0001c-.2928.2929-.7676.2931-1.0606.0003-.293-.2928-.2931-.7677-.0003-1.0607l3.7201-3.7229H3.333c-.4142 0-.75-.3358-.75-.75s.3358-.75.75-.75h11.5219L11.1403 5.53016c-.2928-.29299-.2927-.76786.0003-1.06066.293-.2928.7678-.29265 1.0606.00034l4.9585 4.96017c.1585.13749.2587.34036.2587.56664 0 .00051 0 .00102-.0001.00153Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Right: Page size + summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{t("common.rowsPerPage")}</span>
            <div className="relative z-20 bg-transparent">
              <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={rowsPerPage}
                onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((v) => (
                  <option key={v} value={v} className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    {v}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.pageSummary", { current: currentPage, total: totalPages, count: totalEntries })}
          </div>
        </div>
      </div>
    </div>
  );
}
