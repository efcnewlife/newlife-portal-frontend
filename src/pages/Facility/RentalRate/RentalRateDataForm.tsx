import type {
  RentalRateTemplateItem,
  RentalRateWrite,
  RoomListItem,
} from "@/api/services/facilityService";
import { Checkbox, Select } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface RentalRateFormValues {
  facilityId: string;
  templateId: string;
  isActive?: boolean;
}

export interface RentalRateDataFormHandle {
  validate: () => boolean;
  getValues: () => RentalRateWrite;
}

const RentalRateDataForm = forwardRef<
  RentalRateDataFormHandle,
  {
    defaultValues?: Partial<RentalRateFormValues> | null;
    rooms: RoomListItem[];
    templates: RentalRateTemplateItem[];
    facilityLocked?: boolean;
  }
>(function RentalRateDataForm({ defaultValues, rooms, templates, facilityLocked }, ref) {
  const { t } = useTranslation("facility");

  const [facilityId, setFacilityId] = useState(defaultValues?.facilityId || "");
  const [templateId, setTemplateId] = useState(defaultValues?.templateId || "");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFacilityId(defaultValues?.facilityId || "");
    setTemplateId(defaultValues?.templateId || "");
    setIsActive(defaultValues?.isActive ?? true);
  }, [defaultValues]);

  const roomOptions = rooms.map((r) => ({
    value: r.id,
    label: r.name || r.code,
  }));

  const templateOptions = templates.map((tpl) => ({
    value: tpl.id,
    label: `${tpl.name} (${t(`rentalRateTemplate.billingUnits.${tpl.billingUnit}`, {
      defaultValue: tpl.billingUnit,
    })}) — ${tpl.unitAmount} ${tpl.currency || "CAD"}`,
  }));

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === templateId) || null,
    [templateId, templates]
  );

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: Record<string, string> = {};
      if (!facilityId) next.facilityId = t("rentalRate.form.facilityRequired");
      if (!templateId) next.templateId = t("rentalRate.form.templateRequired");
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      facilityId,
      templateId,
      isActive,
    }),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div>
        <Select
          id="rate-facility"
          label={t("rentalRate.form.facility")}
          options={roomOptions}
          value={facilityId}
          disabled={facilityLocked}
          onChange={(v) => setFacilityId(String(v))}
          error={errors.facilityId}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("rentalRate.form.facilityBindingHint")}
        </p>
      </div>
      <div>
        <Select
          id="rate-template"
          label={t("rentalRate.form.template")}
          options={templateOptions}
          value={templateId}
          onChange={(v) => setTemplateId(String(v))}
          error={errors.templateId}
        />
        {selectedTemplate ? (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("rentalRate.form.followsTemplatePrice", {
              amount: selectedTemplate.unitAmount,
              currency: selectedTemplate.currency || "CAD",
            })}
          </p>
        ) : null}
      </div>
      <div className="md:col-span-2">
        <Checkbox id="rate-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
      </div>
    </div>
  );
});

export default RentalRateDataForm;
