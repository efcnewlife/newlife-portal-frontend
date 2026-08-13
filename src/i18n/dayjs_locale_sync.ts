import dayjs from "@/utils/dayjsSetup";

/**
 * Keeps Day.js locale aligned with i18next AppLocale codes.
 */
export const sync_dayjs_locale = (lng: string): void => {
  const normalized = lng.replace(/_/g, "-").toLowerCase();
  if (normalized === "zh-cn" || normalized.startsWith("zh-cn")) {
    dayjs.locale("zh-cn");
    return;
  }
  if (normalized === "zh-tw" || normalized.startsWith("zh-tw")) {
    dayjs.locale("zh-tw");
    return;
  }
  dayjs.locale("en");
};
