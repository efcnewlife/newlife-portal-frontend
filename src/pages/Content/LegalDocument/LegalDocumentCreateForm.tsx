import { usePickerLabels } from "@/hooks/usePickerLabels";
import {
  buildLegalDocumentCreatePayload,
  isLegalDocumentKind,
  isLegalDocumentProduct,
  LEGAL_DOCUMENT_KINDS,
  LEGAL_DOCUMENT_PRODUCTS,
  type LegalDocumentCreatePayload,
  type LegalDocumentKind,
  type LegalDocumentProduct,
} from "@/pages/Content/LegalDocument/legalDocumentForm";
import { dayjsToApiDate } from "@/utils/dayjsApi";
import { DatePicker, Select } from "@efcnewlife/newlife-ui";
import type { Dayjs } from "dayjs";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface LegalDocumentCreateFormHandle {
  validate: () => boolean;
  getValues: () => LegalDocumentCreatePayload | null;
}

const LegalDocumentCreateForm = forwardRef<LegalDocumentCreateFormHandle>(
  function LegalDocumentCreateForm(_props, ref) {
    const { t } = useTranslation("content");
    const pickerLabels = usePickerLabels();
    const [product, setProduct] = useState<LegalDocumentProduct | "">("");
    const [kind, setKind] = useState<LegalDocumentKind | "">("");
    const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(null);
    const [errors, setErrors] = useState<{ product?: string; kind?: string; effectiveDate?: string }>({});

    const productOptions = LEGAL_DOCUMENT_PRODUCTS.map((value) => ({
      value,
      label: t(`legalDocument.product.${value}`),
    }));

    const kindOptions = LEGAL_DOCUMENT_KINDS.map((value) => ({
      value,
      label: t(`legalDocument.kind.${value}`),
    }));

    useImperativeHandle(ref, () => ({
      validate: () => {
        const nextErrors: { product?: string; kind?: string; effectiveDate?: string } = {};
        if (!product) {
          nextErrors.product = t("legalDocument.form.productRequired");
        }
        if (!kind) {
          nextErrors.kind = t("legalDocument.form.kindRequired");
        }
        if (!effectiveDate) {
          nextErrors.effectiveDate = t("legalDocument.form.effectiveDateRequired");
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
      },
      getValues: () => {
        if (!product || !kind || !effectiveDate) return null;
        const dateValue = dayjsToApiDate(effectiveDate);
        if (!dateValue) return null;
        return buildLegalDocumentCreatePayload(product, kind, dateValue);
      },
    }));

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t("legalDocument.form.createHint")}</p>
        <Select
          id="legal-document-create-product"
          label={t("legalDocument.form.product")}
          value={product}
          onChange={(value) => {
            const next = value ? String(value) : "";
            setProduct(isLegalDocumentProduct(next) ? next : "");
            setErrors((prev) => ({ ...prev, product: undefined }));
          }}
          options={productOptions}
          placeholder={t("legalDocument.form.productPlaceholder")}
          error={errors.product}
        />
        <Select
          id="legal-document-create-kind"
          label={t("legalDocument.form.kind")}
          value={kind}
          onChange={(value) => {
            const next = value ? String(value) : "";
            setKind(isLegalDocumentKind(next) ? next : "");
            setErrors((prev) => ({ ...prev, kind: undefined }));
          }}
          options={kindOptions}
          placeholder={t("legalDocument.form.kindPlaceholder")}
          error={errors.kind}
        />
        <DatePicker
          id="legal-document-create-effective-date"
          label={t("legalDocument.form.effectiveDate")}
          value={effectiveDate}
          onChange={(value) => {
            setEffectiveDate(value);
            setErrors((prev) => ({ ...prev, effectiveDate: undefined }));
          }}
          required
          showTodayButton
          labels={pickerLabels}
          error={errors.effectiveDate}
        />
      </div>
    );
  }
);

export default LegalDocumentCreateForm;
