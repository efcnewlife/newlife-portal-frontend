import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import enLanguage from "./locales/en/language.json";
import zhTwCommon from "./locales/zh-tw/common.json";
import zhTwLanguage from "./locales/zh-tw/language.json";

export const LOCALE_STORAGE_KEY = "app_locale";

const normalize_stored_locale = (value: string | null): "en" | "zh-tw" | null => {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === "en") return "en";
  if (lower === "zh-tw") return "zh-tw";
  return null;
};

const getInitialLanguage = (): "en" | "zh-tw" => {
  const stored = normalize_stored_locale(localStorage.getItem(LOCALE_STORAGE_KEY));
  if (stored) {
    return stored;
  }
  const browser = navigator.language.toLowerCase();
  return browser.startsWith("zh") ? "zh-tw" : "en";
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enCommon, language: enLanguage },
    "zh-tw": { translation: zhTwCommon, language: zhTwLanguage }
  },
  defaultNS: "translation",
  ns: ["translation", "language"],
  lowerCaseLng: true,
  lng: getInitialLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(LOCALE_STORAGE_KEY, lng);
});

export default i18n;
