import type { LegalDocumentDetail, LegalDocumentUpdatePayload } from "@/api/services/legalDocumentService";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import {
  buildLegalDocumentUpdatePayload,
  hydrateLegalDocumentTranslationMap,
  type LegalDocumentTranslationMap,
} from "@/pages/Content/LegalDocument/legalDocumentForm";
import { buildLegalDocumentMarkdownEditorLabels } from "@/pages/Content/LegalDocument/legalDocumentMarkdownEditorLabels";
import { localeTabLabel } from "@/utils/translationForm";
import { MarkdownEditor, Tabs } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface LegalDocumentDataFormHandle {
  validate: () => boolean;
  getValues: () => LegalDocumentUpdatePayload;
}

interface LegalDocumentDataFormProps {
  document: LegalDocumentDetail;
}

const LegalDocumentDataForm = forwardRef<LegalDocumentDataFormHandle, LegalDocumentDataFormProps>(
  function LegalDocumentDataForm({ document }, ref) {
    const { t } = useTranslation("content");
    const { t: tCommon } = useTranslation("common");
    const { locales, defaultLocaleId, loading, error } = useActiveLocales();

    const [translationMap, setTranslationMap] = useState<LegalDocumentTranslationMap>({});
    const [activeTab, setActiveTab] = useState("");
    const [errors, setErrors] = useState<{ body?: string }>({});

    useEffect(() => {
      if (locales.length === 0) return;
      setTranslationMap(hydrateLegalDocumentTranslationMap(locales, document.translations));
      setActiveTab(defaultLocaleId || locales[0]?.id || "");
      setErrors({});
    }, [document, defaultLocaleId, locales]);

    const tabs = useMemo(
      () =>
        locales.map((locale) => ({
          value: locale.id,
          label: localeTabLabel(locale, locale.id === defaultLocaleId),
        })),
      [locales, defaultLocaleId]
    );

    const validate = (): boolean => {
      if (!defaultLocaleId) {
        setErrors({ body: tCommon("translation.defaultLocaleRequired") });
        return false;
      }
      setErrors({});
      return true;
    };

    useImperativeHandle(ref, () => ({
      validate,
      getValues: () => buildLegalDocumentUpdatePayload(translationMap),
    }));

    const activeBody = translationMap[activeTab]?.body ?? "";
    const markdownEditorLabels = useMemo(() => buildLegalDocumentMarkdownEditorLabels(t), [t]);

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
        </dl>

        {loading ? <p className="text-sm text-gray-500">{tCommon("loading")}</p> : null}
        {error ? <p className="text-sm text-error-500">{error}</p> : null}

        {!loading && !error && locales.length > 0 ? (
          <div className="space-y-3">
            <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} label={tCommon("translation.tabsLabel")} />
            <MarkdownEditor
              id={`legal-document-body-${activeTab}`}
              label={t("legalDocument.form.body")}
              hint={t("legalDocument.form.bodyHint")}
              profile="legal"
              value={activeBody}
              onChange={(fieldValue) =>
                setTranslationMap((prev) => ({
                  ...prev,
                  [activeTab]: { body: fieldValue },
                }))
              }
              labels={markdownEditorLabels}
              className="min-h-[50vh]"
              error={errors.body}
            />
          </div>
        ) : null}
      </div>
    );
  }
);

export default LegalDocumentDataForm;
