import moment from "moment";

/**
 * Keeps Moment.js locale aligned with i18next BCP 47 codes.
 */
export const sync_moment_locale = (lng: string): void => {
  const n = lng.replace(/_/g, "-").toLowerCase();
  if (n.startsWith("zh-cn") || (n.startsWith("zh-hans") && n.endsWith("cn"))) {
    moment.locale("zh-cn");
    return;
  }
  if (n.startsWith("zh")) {
    moment.locale("zh-tw");
    return;
  }
  moment.locale("en");
};
