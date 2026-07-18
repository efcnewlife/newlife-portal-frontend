import type { LocaleItem } from "@/api/services/localeService";
import type { TranslationFields, TranslationMap } from "@/utils/translationForm";
import { localeTabLabel } from "@/utils/translationForm";
import { Input, Tabs, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export type TranslationFieldKey = "name" | "description" | "remark" | "scheduleNote";

export interface TranslationTabsFormProps {
  locales: LocaleItem[];
  defaultLocaleId?: string;
  value: TranslationMap;
  onChange: (value: TranslationMap) => void;
  fields: TranslationFieldKey[];
  loading?: boolean;
  error?: string;
  nameError?: string;
  labels?: Partial<Record<TranslationFieldKey, string>>;
}

const TranslationTabsForm = ({
  locales,
  defaultLocaleId,
  value,
  onChange,
  fields,
  loading,
  error,
  nameError,
  labels,
}: TranslationTabsFormProps) => {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState(defaultLocaleId || locales[0]?.id || "");

  useEffect(() => {
    if (defaultLocaleId) {
      setActiveTab(defaultLocaleId);
    } else if (locales[0]?.id) {
      setActiveTab(locales[0].id);
    }
  }, [defaultLocaleId, locales]);

  const tabs = useMemo(
    () =>
      locales.map((locale) => ({
        value: locale.id,
        label: localeTabLabel(locale, locale.id === defaultLocaleId),
      })),
    [locales, defaultLocaleId],
  );

  const updateField = (localeId: string, field: TranslationFieldKey, fieldValue: string) => {
    onChange({
      ...value,
      [localeId]: {
        ...value[localeId],
        [field]: fieldValue,
      },
    });
  };

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("loading")}</p>;
  }

  if (error || locales.length === 0) {
    return <p className="text-sm text-error-500 dark:text-error-400">{t(error || "translation.loadLocalesFailed")}</p>;
  }

  const active_fields: TranslationFields = value[activeTab] || {
    name: "",
    description: "",
    remark: "",
    scheduleNote: "",
  };

  return (
    <div className="space-y-3">
      <Tabs
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
        label={t("translation.tabsLabel")}
        required
        aria-label={t("translation.tabsLabel")}
      />
      <div className="space-y-3 pt-1">
        {fields.includes("name") && (
          <Input
            id={`translation-name-${activeTab}`}
            label={labels?.name || t("translation.name")}
            value={active_fields.name || ""}
            onChange={(e) => updateField(activeTab, "name", e.target.value)}
            error={activeTab === defaultLocaleId ? nameError : undefined}
            required={activeTab === defaultLocaleId}
            clearable
          />
        )}
        {fields.includes("description") && (
          <TextArea
            id={`translation-description-${activeTab}`}
            label={labels?.description || t("translation.description")}
            value={active_fields.description || ""}
            onChange={(fieldValue) => updateField(activeTab, "description", fieldValue)}
            rows={3}
          />
        )}
        {fields.includes("remark") && (
          <TextArea
            id={`translation-remark-${activeTab}`}
            label={labels?.remark || t("translation.remark")}
            value={active_fields.remark || ""}
            onChange={(fieldValue) => updateField(activeTab, "remark", fieldValue)}
            rows={2}
          />
        )}
        {fields.includes("scheduleNote") && (
          <TextArea
            id={`translation-schedule-note-${activeTab}`}
            label={labels?.scheduleNote || t("translation.scheduleNote", { defaultValue: "Schedule note" })}
            value={active_fields.scheduleNote || ""}
            onChange={(fieldValue) => updateField(activeTab, "scheduleNote", fieldValue)}
            rows={2}
          />
        )}
      </div>
    </div>
  );
};

export default TranslationTabsForm;
