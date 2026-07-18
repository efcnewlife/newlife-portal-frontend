import type {
  FacilityTranslationItem,
  RateApplicabilityRule,
  RentalRateWrite,
  RoomListItem,
} from "@/api/services/facilityService";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
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

export interface RentalRateFormValues {
  facilityId: string;
  billingUnit: string;
  unitAmount: string;
  currency?: string;
  isDefault?: boolean;
  isActive?: boolean;
  applicability?: RateApplicabilityRule | null;
  effectiveFrom?: string;
  effectiveTo?: string;
  name?: string;
  remark?: string;
  translations?: FacilityTranslationItem[];
}

export interface RentalRateDataFormHandle {
  validate: () => boolean;
  getValues: () => RentalRateWrite;
}

const BILLING_UNITS = ["hourly", "daily_flat", "per_slot", "flat_per_booking"];

const RentalRateDataForm = forwardRef<
  RentalRateDataFormHandle,
  {
    defaultValues?: Partial<RentalRateFormValues> | null;
    rooms: RoomListItem[];
    facilityLocked?: boolean;
    isCreate?: boolean;
  }
>(function RentalRateDataForm({ defaultValues, rooms, facilityLocked, isCreate = true }, ref) {
  const { t } = useTranslation("facility");
  const { t: tCommon } = useTranslation("common");
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();

  const [facilityId, setFacilityId] = useState(defaultValues?.facilityId || "");
  const [billingUnit, setBillingUnit] = useState(defaultValues?.billingUnit || "hourly");
  const [unitAmount, setUnitAmount] = useState(defaultValues?.unitAmount?.toString() || "");
  const [currency, setCurrency] = useState(defaultValues?.currency || "CAD");
  const [effectiveFrom, setEffectiveFrom] = useState(defaultValues?.effectiveFrom || "");
  const [effectiveTo, setEffectiveTo] = useState(defaultValues?.effectiveTo || "");
  const [isDefault, setIsDefault] = useState(defaultValues?.isDefault ?? false);
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [remark, setRemark] = useState(defaultValues?.remark || "");
  const [applicabilityDraft, setApplicabilityDraft] = useState<ApplicabilityDraft>(() =>
    defaultValues?.applicability !== undefined
      ? hydrateApplicabilityDraft(defaultValues.applicability)
      : isCreate
        ? prefillDraftForBillingUnit(defaultValues?.billingUnit || "hourly")
        : { ...DEFAULT_APPLICABILITY_DRAFT },
  );
  const [applicabilityTouched, setApplicabilityTouched] = useState(
    defaultValues?.applicability !== undefined && defaultValues.applicability !== null,
  );
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const skipBillingPrefill = useRef(false);

  useEffect(() => {
    if (locales.length === 0) return;
    setFacilityId(defaultValues?.facilityId || "");
    setBillingUnit(defaultValues?.billingUnit || "hourly");
    setUnitAmount(defaultValues?.unitAmount?.toString() || "");
    setCurrency(defaultValues?.currency || "CAD");
    setEffectiveFrom(defaultValues?.effectiveFrom || "");
    setEffectiveTo(defaultValues?.effectiveTo || "");
    setIsDefault(defaultValues?.isDefault ?? false);
    setIsActive(defaultValues?.isActive ?? true);
    setRemark(defaultValues?.remark || "");
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
    setTranslationMap(
      hydrateTranslationMap(locales, defaultValues?.translations, {
        name: defaultValues?.name,
      }),
    );
  }, [defaultValues, locales, isCreate]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

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
      if (!facilityId) next.facilityId = t("rentalRate.form.facilityRequired");
      if (!unitAmount) next.unitAmount = t("rentalRate.form.unitAmountRequired");
      const applicabilityError = validateApplicabilityDraft(applicabilityDraft, t);
      if (applicabilityError) next.applicability = applicabilityError;
      const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
      if (name_error_key) next.name = tCommon(name_error_key);
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => {
      const translations = buildTranslationPayload(translationMap);
      return {
        facilityId,
        billingUnit,
        unitAmount: Number(unitAmount),
        currency,
        isDefault,
        isActive,
        applicability: serializeApplicabilityDraft(applicabilityDraft),
        effectiveFrom: effectiveFrom || undefined,
        effectiveTo: effectiveTo || undefined,
        remark: remark || undefined,
        translations,
      };
    },
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div>
          <Select
            id="rate-facility"
            label={t("shared.selectRoom")}
            options={rooms.map((r) => ({ value: r.id, label: r.name ? `${r.code} - ${r.name}` : r.code }))}
            value={facilityId}
            disabled={facilityLocked}
            onChange={(v) => setFacilityId(String(v))}
            error={errors.facilityId}
          />
        </div>
        <div>
          <Select
            id="rate-billing"
            label={t("rentalRate.form.billingUnit")}
            options={BILLING_UNITS.map((u) => ({ value: u, label: t(`rentalRate.billingUnits.${u}`) }))}
            value={billingUnit}
            onChange={(v) => setBillingUnit(String(v))}
          />
        </div>
        <div>
          <Input
            id="rate-amount"
            label={t("rentalRate.form.unitAmount")}
            type="number"
            min="0"
            step={0.01}
            value={unitAmount}
            onChange={(e) => setUnitAmount(e.target.value)}
            error={errors.unitAmount}
          />
        </div>
        <div>
          <Input
            id="rate-currency"
            label={t("rentalRate.form.currency")}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
        <div>
          <Input
            id="rate-effective-from"
            label={t("rentalRate.form.effectiveFrom")}
            type="date"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
        </div>
        <div>
          <Input
            id="rate-effective-to"
            label={t("rentalRate.form.effectiveTo")}
            type="date"
            value={effectiveTo}
            onChange={(e) => setEffectiveTo(e.target.value)}
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
          <Checkbox id="rate-default" label={t("rentalRate.form.isDefault")} checked={isDefault} onChange={setIsDefault} />
          <Checkbox id="rate-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
        </div>
        <div className="md:col-span-2">
          <Input
            id="rate-remark"
            label={t("rentalRate.form.remark")}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </div>
      <TranslationTabsForm
        locales={locales}
        defaultLocaleId={defaultLocaleId}
        value={translationMap}
        onChange={setTranslationMap}
        fields={["name"]}
        loading={loading}
        error={error}
        nameError={errors.name ? tCommon(errors.name) : undefined}
        labels={{ name: t("rentalRate.table.name") }}
      />
    </div>
  );
});

export default RentalRateDataForm;
