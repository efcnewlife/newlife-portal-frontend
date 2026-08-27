import type { LegalDocumentDetail } from "@/api/services/legalDocumentService";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import { isLegalDocumentBodyEmpty } from "@/pages/Content/LegalDocument/legalDocumentForm";
import { DateUtil } from "@/utils/dateUtil";
import { localeTabLabel } from "@/utils/translationForm";
import { MarkdownPreview, Tabs } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface LegalDocumentDetailViewProps {
  document: LegalDocumentDetail;
}

const LegalDocumentDetailView = ({ document }: LegalDocumentDetailViewProps) => {
  const { t } = useTranslation("content");
  const { t: tCommon } = useTranslation("common");
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (locales.length === 0) return;
    setActiveTab(defaultLocaleId || locales[0]?.id || "");
  }, [defaultLocaleId, locales]);

  const tabs = useMemo(
    () =>
      locales.map((locale) => ({
        value: locale.id,
        label: localeTabLabel(locale, locale.id === defaultLocaleId),
      })),
    [locales, defaultLocaleId]
  );

  const bodyByLocaleId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const item of document.translations || []) {
      map[item.localeId] = item.body ?? "";
    }
    return map;
  }, [document.translations]);

  const activeBody = bodyByLocaleId[activeTab] ?? "";

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">{t("legalDocument.form.product")}</dt>
          <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
            {t(`legalDocument.product.${document.product}`, { defaultValue: document.product })}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">{t("legalDocument.form.kind")}</dt>
          <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
            {t(`legalDocument.kind.${document.kind}`, { defaultValue: document.kind })}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">{t("legalDocument.form.effectiveDate")}</dt>
          <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
            {document.effectiveDate ? DateUtil.format(document.effectiveDate, "YYYY-MM-DD") : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">{t("legalDocument.table.updatedAt")}</dt>
          <dd className="mt-1 font-medium text-gray-800 dark:text-white/90">
            {document.updateAt ? DateUtil.format(document.updateAt) : "—"}
          </dd>
        </div>
      </dl>

      {loading ? <p className="text-sm text-gray-500">{tCommon("loading")}</p> : null}
      {error ? <p className="text-sm text-error-500">{error}</p> : null}

      {!loading && !error && locales.length > 0 ? (
        <div className="space-y-3">
          <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} label={tCommon("translation.tabsLabel")} />
          {isLegalDocumentBodyEmpty(activeBody) ? (
            <p className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t("legalDocument.view.emptyBody")}
            </p>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700 max-h-[50vh] overflow-y-auto">
              <MarkdownPreview value={activeBody} profile="legal" />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default LegalDocumentDetailView;
