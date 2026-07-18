import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enErrors from "./locales/en/errors.json";
import enSystem from "./locales/en/system.json";
import enLanguage from "./locales/en/language.json";
import enFacility from "./locales/en/facility.json";
import enOrg from "./locales/en/org.json";
import enMember from "./locales/en/member.json";
import enMinistry from "./locales/en/ministry.json";
import zhTwCommon from "./locales/zh-TW/common.json";
import zhTwAuth from "./locales/zh-TW/auth.json";
import zhTwErrors from "./locales/zh-TW/errors.json";
import zhTwSystem from "./locales/zh-TW/system.json";
import zhTwLanguage from "./locales/zh-TW/language.json";
import zhTwFacility from "./locales/zh-TW/facility.json";
import zhTwOrg from "./locales/zh-TW/org.json";
import zhTwMember from "./locales/zh-TW/member.json";
import zhTwMinistry from "./locales/zh-TW/ministry.json";
import zhCnCommon from "./locales/zh-CN/common.json";
import zhCnAuth from "./locales/zh-CN/auth.json";
import zhCnErrors from "./locales/zh-CN/errors.json";
import zhCnSystem from "./locales/zh-CN/system.json";
import zhCnLanguage from "./locales/zh-CN/language.json";
import zhCnFacility from "./locales/zh-CN/facility.json";
import zhCnOrg from "./locales/zh-CN/org.json";
import zhCnMember from "./locales/zh-CN/member.json";
import zhCnMinistry from "./locales/zh-CN/ministry.json";
import { sync_moment_locale } from "./moment_locale_sync";

/** BCP 47 language tags used as i18next resource keys and persisted locale. */
export type AppLocale = "en" | "zh-TW" | "zh-CN";

export const LOCALE_STORAGE_KEY = "app_locale";

export const normalize_locale_code = (value: string | null): AppLocale | null => {
  if (!value) return null;
  const normalized = value.trim().replace(/_/g, "-").toLowerCase();
  if (normalized === "en") return "en";
  if (normalized === "zh-tw") return "zh-TW";
  if (normalized === "zh-cn") return "zh-CN";
  if (normalized.startsWith("zh-tw") || normalized === "zh-hant-tw" || normalized === "zh-hk") {
    return "zh-TW";
  }
  if (
    normalized === "zh-sg" ||
    normalized.startsWith("zh-cn") ||
    normalized === "zh-hans-cn" ||
    (normalized.startsWith("zh-hans") && normalized.includes("cn"))
  ) {
    return "zh-CN";
  }
  if (normalized === "zh" || normalized.startsWith("zh-hans")) {
    return "zh-CN";
  }
  return null;
};

/** Build BCP 47 tag from backend locale fields (may include script subtag). */
export const build_locale_code = (
  language_code: string,
  script_code?: string | null,
  region_code?: string | null,
): string => {
  return [language_code, script_code, region_code].filter(Boolean).join("-");
};

/** Switch i18next to the AppLocale resource key for a backend locale code. */
export const change_app_language = async (locale_code: string): Promise<boolean> => {
  const app_locale = normalize_locale_code(locale_code);
  if (!app_locale) {
    return false;
  }
  if (i18n.language !== app_locale) {
    await i18n.changeLanguage(app_locale);
  }
  return true;
};

const browser_default_locale = (): AppLocale => {
  const lang = navigator.language.replace(/_/g, "-").toLowerCase();
  if (lang.startsWith("zh-cn")) return "zh-CN";
  if (lang.startsWith("zh-tw")) return "zh-TW";
  if (lang.startsWith("zh")) return "zh-TW";
  return "en";
};

const getInitialLanguage = (): AppLocale => {
  const stored = normalize_locale_code(localStorage.getItem(LOCALE_STORAGE_KEY));
  if (stored) {
    return stored;
  }
  return browser_default_locale();
};

const initial_lng = getInitialLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      errors: enErrors,
      system: enSystem,
      language: enLanguage,
      facility: enFacility,
      org: enOrg,
      member: enMember,
      ministry: enMinistry,
    },
    "zh-TW": {
      common: zhTwCommon,
      auth: zhTwAuth,
      errors: zhTwErrors,
      system: zhTwSystem,
      language: zhTwLanguage,
      facility: zhTwFacility,
      org: zhTwOrg,
      member: zhTwMember,
      ministry: zhTwMinistry,
    },
    "zh-CN": {
      common: zhCnCommon,
      auth: zhCnAuth,
      errors: zhCnErrors,
      system: zhCnSystem,
      language: zhCnLanguage,
      facility: zhCnFacility,
      org: zhCnOrg,
      member: zhCnMember,
      ministry: zhCnMinistry,
    },
  },
  defaultNS: "common",
  ns: ["common", "auth", "errors", "system", "language", "facility", "org", "member", "ministry"],
  lng: initial_lng,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

sync_moment_locale(i18n.language);

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, lng);
  sync_moment_locale(lng);
});

export default i18n;
