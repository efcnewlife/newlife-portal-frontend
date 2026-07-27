import { Checkbox, Input, Select } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";
import {
  formatApplicabilityPreview,
  type ApplicabilityDraft,
  type ApplicabilityMode,
} from "./applicabilityFormat";

interface RateApplicabilityEditorProps {
  value: ApplicabilityDraft;
  onChange: (next: ApplicabilityDraft) => void;
  error?: string;
}

const MODE_OPTIONS: ApplicabilityMode[] = ["always", "hours_lt", "hours_gte", "hours_range"];

const RateApplicabilityEditor = ({ value, onChange, error }: RateApplicabilityEditorProps) => {
  const { t } = useTranslation("facility");

  const setMode = (mode: string) => {
    onChange({ ...value, mode: mode as ApplicabilityMode });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-4 dark:border-gray-700 dark:bg-gray-900/40">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {t("rentalRateTemplate.form.applicability")}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("rentalRateTemplate.form.applicabilityHint")}
        </p>
      </div>

      <Select
        id="rate-applicability-mode"
        label={t("rentalRateTemplate.form.applicabilityMode")}
        options={MODE_OPTIONS.map((mode) => ({
          value: mode,
          label: t(`rentalRateTemplate.applicability.modes.${mode}`),
        }))}
        value={value.mode}
        onChange={(v) => setMode(String(v))}
      />

      {(value.mode === "hours_lt" || value.mode === "hours_gte") && (
        <Input
          id="rate-applicability-hours"
          label={t("rentalRateTemplate.form.applicabilityHours")}
          type="number"
          min="0"
          step={0.25}
          value={value.hours}
          onChange={(e) => onChange({ ...value, hours: e.target.value })}
          error={error}
        />
      )}

      {value.mode === "hours_range" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <Input
            id="rate-applicability-min"
            label={t("rentalRateTemplate.form.applicabilityMinHours")}
            type="number"
            min="0"
            step={0.25}
            value={value.minHours}
            onChange={(e) => onChange({ ...value, minHours: e.target.value })}
            error={error}
          />
          <Input
            id="rate-applicability-max"
            label={t("rentalRateTemplate.form.applicabilityMaxHours")}
            type="number"
            min="0"
            step={0.25}
            value={value.maxHours}
            onChange={(e) => onChange({ ...value, maxHours: e.target.value })}
            error={error}
          />
          <div className="md:col-span-2">
            <Checkbox
              id="rate-applicability-max-exclusive"
              label={t("rentalRateTemplate.form.applicabilityMaxExclusive")}
              checked={value.maxExclusive}
              onChange={(checked) => onChange({ ...value, maxExclusive: checked })}
            />
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("rentalRateTemplate.form.applicabilityPreview")}:{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {formatApplicabilityPreview(value, t)}
        </span>
      </p>
    </div>
  );
};

export default RateApplicabilityEditor;
