import type { RateApplicabilityRule, RentalRateTemplateWrite } from "@/api/services/facilityService";
import { Checkbox, Input, Select } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_APPLICABILITY_DRAFT,
  hydrateApplicabilityDraft,
  prefillDraftForBillingUnit,
  serializeApplicabilityDraft,
  validateApplicabilityDraft,
  type ApplicabilityDraft,
} from "./applicabilityFormat";
import RateApplicabilityEditor from "./RateApplicabilityEditor";

export interface RentalRateTemplateFormValues {
  name: string;
  billingUnit: string;
  applicability?: RateApplicabilityRule | null;
  unitAmount?: string;
  currency?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface RentalRateTemplateDataFormHandle {
  validate: () => boolean;
  getValues: () => RentalRateTemplateWrite;
}

const BILLING_UNITS = ["hourly", "daily_flat", "per_slot", "flat_per_booking"];

const RentalRateTemplateDataForm = forwardRef<
  RentalRateTemplateDataFormHandle,
  {
    defaultValues?: Partial<RentalRateTemplateFormValues> | null;
    isCreate?: boolean;
  }
>(function RentalRateTemplateDataForm({ defaultValues, isCreate = true }, ref) {
  const { t } = useTranslation("facility");

  const [name, setName] = useState(defaultValues?.name || "");
  const [billingUnit, setBillingUnit] = useState(defaultValues?.billingUnit || "hourly");
  const [unitAmount, setUnitAmount] = useState(defaultValues?.unitAmount?.toString() || "30");
  const [currency, setCurrency] = useState(defaultValues?.currency || "CAD");
  const [isDefault, setIsDefault] = useState(defaultValues?.isDefault ?? false);
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [applicabilityDraft, setApplicabilityDraft] = useState<ApplicabilityDraft>(() =>
    defaultValues?.applicability !== undefined
      ? hydrateApplicabilityDraft(defaultValues.applicability)
      : isCreate
        ? prefillDraftForBillingUnit(defaultValues?.billingUnit || "hourly")
        : { ...DEFAULT_APPLICABILITY_DRAFT }
  );
  const [applicabilityTouched, setApplicabilityTouched] = useState(
    defaultValues?.applicability !== undefined && defaultValues.applicability !== null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const skipBillingPrefill = useRef(false);

  useEffect(() => {
    setName(defaultValues?.name || "");
    setBillingUnit(defaultValues?.billingUnit || "hourly");
    setUnitAmount(defaultValues?.unitAmount?.toString() || (isCreate ? "30" : ""));
    setCurrency(defaultValues?.currency || "CAD");
    setIsDefault(defaultValues?.isDefault ?? false);
    setIsActive(defaultValues?.isActive ?? true);
    skipBillingPrefill.current = true;
    if (defaultValues?.applicability !== undefined) {
      setApplicabilityDraft(hydrateApplicabilityDraft(defaultValues.applicability));
      setApplicabilityTouched(true);
    } else if (isCreate) {
      setApplicabilityDraft(prefillDraftForBillingUnit(defaultValues?.billingUnit || "hourly"));
      setApplicabilityTouched(false);
    } else {
      setApplicabilityDraft({ ...DEFAULT_APPLICABILITY_DRAFT });
      setApplicabilityTouched(false);
    }
  }, [defaultValues, isCreate]);

  useEffect(() => {
    if (!isCreate || applicabilityTouched) return;
    if (skipBillingPrefill.current) {
      skipBillingPrefill.current = false;
      return;
    }
    setApplicabilityDraft(prefillDraftForBillingUnit(billingUnit));
  }, [billingUnit, isCreate, applicabilityTouched]);

  const handleApplicabilityChange = (next: ApplicabilityDraft) => {
    setApplicabilityTouched(true);
    setApplicabilityDraft(next);
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: Record<string, string> = {};
      if (!name.trim()) next.name = t("rentalRateTemplate.form.nameRequired");
      if (!unitAmount.trim()) next.unitAmount = t("rentalRateTemplate.form.unitAmountRequired");
      const applicabilityError = validateApplicabilityDraft(applicabilityDraft, t);
      if (applicabilityError) next.applicability = applicabilityError;
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      name: name.trim(),
      billingUnit,
      unitAmount: Number(unitAmount),
      currency,
      isDefault,
      isActive,
      applicability: serializeApplicabilityDraft(applicabilityDraft),
    }),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div>
          <Input
            id="rate-template-name"
            label={t("rentalRateTemplate.form.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
        </div>
        <div>
          <Select
            id="rate-template-billing"
            label={t("rentalRateTemplate.form.billingUnit")}
            options={BILLING_UNITS.map((u) => ({
              value: u,
              label: t(`rentalRateTemplate.billingUnits.${u}`),
            }))}
            value={billingUnit}
            onChange={(v) => setBillingUnit(String(v))}
          />
        </div>
        <div>
          <Input
            id="rate-template-amount"
            label={t("rentalRateTemplate.form.unitAmount")}
            type="number"
            min={0}
            step={0.01}
            value={unitAmount}
            onChange={(e) => setUnitAmount(e.target.value)}
            error={errors.unitAmount}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("rentalRateTemplate.form.unitAmountHint")}</p>
        </div>
        <div>
          <Input
            id="rate-template-currency"
            label={t("rentalRateTemplate.form.currency")}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <RateApplicabilityEditor
            value={applicabilityDraft}
            onChange={handleApplicabilityChange}
            error={errors.applicability}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Checkbox
            id="rate-template-default"
            label={t("rentalRateTemplate.form.isDefault")}
            checked={isDefault}
            onChange={setIsDefault}
          />
          <Checkbox id="rate-template-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
        </div>
      </div>
    </div>
  );
});

export default RentalRateTemplateDataForm;
