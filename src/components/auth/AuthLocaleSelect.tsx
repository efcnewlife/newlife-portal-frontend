import { Select, type SelectOptionType } from "@efcnewlife/newlife-ui";
import { change_app_language, normalize_locale_code, type AppLocale } from "@/i18n";
import { APP_LOCALE_OPTIONS } from "@/utils/localeResolve";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const APP_LOCALE_LABEL_KEYS: Record<AppLocale, "english" | "traditionalChinese" | "simplifiedChinese"> = {
  en: "english",
  "zh-TW": "traditionalChinese",
  "zh-CN": "simplifiedChinese",
};

export default function AuthLocaleSelect() {
  const { i18n, t } = useTranslation();
  const { t: tLanguage } = useTranslation("language");

  const options: SelectOptionType[] = useMemo(
    () =>
      APP_LOCALE_OPTIONS.map((app_locale) => ({
        value: app_locale,
        label: tLanguage(APP_LOCALE_LABEL_KEYS[app_locale]),
      })),
    [tLanguage],
  );

  const selected_locale = normalize_locale_code(i18n.language) ?? "en";

  return (
    <div className="w-[180px]">
      <Select
        id="auth-locale-select"
        size="sm"
        aria-label={tLanguage("label")}
        labels={{
          selectPlaceholder: t("common:selectPlaceholder"),
          clearSelection: t("common:clearSelection"),
          toggleOptions: t("common:toggleOptions"),
          searchOptions: t("common:searchOptions"),
          noOptions: t("common:noOptions"),
        }}
        options={options}
        value={selected_locale}
        onChange={async (value) => {
          if (typeof value === "string") {
            await change_app_language(value);
          }
        }}
      />
    </div>
  );
}
