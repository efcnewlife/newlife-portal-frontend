import type { SettingCreate, SettingItem, SettingUpdate, SettingValueType } from "@/api/services/settingService";
import { Button, Checkbox, Input, Label, Select, TextArea } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd, MdDelete } from "react-icons/md";

export interface SettingFormValues {
  namespace: string;
  settingKey: string;
  valueType: SettingValueType;
  value: unknown;
  remark?: string | null;
  isActive: boolean;
}

export interface SettingDataFormHandle {
  validate: () => boolean;
  getValues: () => SettingFormValues;
}

interface SettingDataFormProps {
  mode: "create" | "edit";
  setting?: SettingItem | null;
}

interface ObjectRow {
  id: string;
  key: string;
  value: string;
}

interface ArrayRow {
  id: string;
  value: string;
}

const VALUE_TYPE_OPTIONS: SettingValueType[] = ["string", "number", "boolean", "object", "array"];

const newRowId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const toDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const parseCellValue = (raw: string): unknown => {
  const trimmed = raw.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return raw;
    }
  }
  return raw;
};

const objectToRows = (value: unknown): ObjectRow[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{ id: newRowId(), key: "", value: "" }];
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return [{ id: newRowId(), key: "", value: "" }];
  }
  return entries.map(([key, cell]) => ({
    id: newRowId(),
    key,
    value: toDisplayValue(cell),
  }));
};

const arrayToRows = (value: unknown): ArrayRow[] => {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ id: newRowId(), value: "" }];
  }
  return value.map((cell) => ({
    id: newRowId(),
    value: toDisplayValue(cell),
  }));
};

const SettingDataForm = forwardRef<SettingDataFormHandle, SettingDataFormProps>(function SettingDataForm(
  { mode, setting },
  ref
) {
  const { t } = useTranslation();
  const isCreate = mode === "create";

  const [namespace, setNamespace] = useState("");
  const [settingKey, setSettingKey] = useState("");
  const [valueType, setValueType] = useState<SettingValueType>("string");
  const [stringValue, setStringValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [booleanValue, setBooleanValue] = useState(false);
  const [objectRows, setObjectRows] = useState<ObjectRow[]>([{ id: newRowId(), key: "", value: "" }]);
  const [arrayRows, setArrayRows] = useState<ArrayRow[]>([{ id: newRowId(), value: "" }]);
  const [remark, setRemark] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{
    namespace?: string;
    settingKey?: string;
    value?: string;
  }>({});

  useEffect(() => {
    setErrors({});
    if (isCreate) {
      setNamespace("");
      setSettingKey("");
      setValueType("string");
      setStringValue("");
      setNumberValue("");
      setBooleanValue(false);
      setObjectRows([{ id: newRowId(), key: "", value: "" }]);
      setArrayRows([{ id: newRowId(), value: "" }]);
      setRemark("");
      setIsActive(true);
      return;
    }
    if (!setting) return;
    setNamespace(setting.namespace);
    setSettingKey(setting.settingKey);
    setValueType(setting.valueType);
    setRemark(setting.remark ?? "");
    setIsActive(setting.isActive);
    if (setting.valueType === "string") {
      setStringValue(typeof setting.value === "string" ? setting.value : String(setting.value ?? ""));
    } else if (setting.valueType === "number") {
      setNumberValue(setting.value == null ? "" : String(setting.value));
    } else if (setting.valueType === "boolean") {
      setBooleanValue(Boolean(setting.value));
    } else if (setting.valueType === "object") {
      setObjectRows(objectToRows(setting.value));
    } else if (setting.valueType === "array") {
      setArrayRows(arrayToRows(setting.value));
    }
  }, [isCreate, setting]);

  const valueTypeOptions = useMemo(() => VALUE_TYPE_OPTIONS.map((item) => ({ value: item, label: item })), []);

  const isTimezoneSetting =
    (isCreate ? namespace : setting?.namespace) === "facility" &&
    (isCreate ? settingKey : setting?.settingKey) === "timezone";

  const buildObjectValue = (): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const row of objectRows) {
      const key = row.key.trim();
      if (!key) continue;
      result[key] = parseCellValue(row.value);
    }
    return result;
  };

  const buildArrayValue = (): unknown[] => {
    return arrayRows.filter((row) => row.value.trim() !== "").map((row) => parseCellValue(row.value));
  };

  const resolveValue = (): unknown => {
    if (valueType === "string") return stringValue;
    if (valueType === "number") return Number(numberValue);
    if (valueType === "boolean") return booleanValue;
    if (valueType === "object") return buildObjectValue();
    return buildArrayValue();
  };

  const validate = (): boolean => {
    const nextErrors: { namespace?: string; settingKey?: string; value?: string } = {};
    if (isCreate) {
      if (!namespace.trim()) {
        nextErrors.namespace = t("system:setting.form.validation.namespaceRequired");
      }
      if (!settingKey.trim()) {
        nextErrors.settingKey = t("system:setting.form.validation.settingKeyRequired");
      }
    }
    if (valueType === "string") {
      if (!stringValue.trim()) {
        nextErrors.value = t("system:setting.form.validation.valueRequired");
      }
    } else if (valueType === "number") {
      if (numberValue.trim() === "" || Number.isNaN(Number(numberValue))) {
        nextErrors.value = t("system:setting.form.validation.numberInvalid");
      }
    } else if (valueType === "object") {
      const keys = objectRows.map((row) => row.key.trim()).filter(Boolean);
      if (keys.length === 0) {
        nextErrors.value = t("system:setting.form.validation.objectEmpty");
      } else if (new Set(keys).size !== keys.length) {
        nextErrors.value = t("system:setting.form.validation.objectDuplicateKey");
      } else if (objectRows.some((row) => !row.key.trim() && row.value.trim())) {
        nextErrors.value = t("system:setting.form.validation.objectKeyRequired");
      }
    } else if (valueType === "array") {
      if (arrayRows.every((row) => row.value.trim() === "")) {
        nextErrors.value = t("system:setting.form.validation.arrayEmpty");
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getValues = (): SettingFormValues => ({
    namespace: namespace.trim(),
    settingKey: settingKey.trim(),
    valueType,
    value: resolveValue(),
    remark: remark.trim() ? remark.trim() : null,
    isActive,
  });

  useImperativeHandle(ref, () => ({
    validate,
    getValues,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="setting-namespace"
          label={t("system:setting.form.namespace.label")}
          type="text"
          value={namespace}
          onChange={(e) => setNamespace(e.target.value)}
          disabled={!isCreate}
          error={errors.namespace}
          required={isCreate}
          clearable={isCreate}
        />
        <Input
          id="setting-key"
          label={t("system:setting.form.settingKey.label")}
          type="text"
          value={settingKey}
          onChange={(e) => setSettingKey(e.target.value)}
          disabled={!isCreate}
          error={errors.settingKey}
          required={isCreate}
          clearable={isCreate}
        />
      </div>

      {isCreate ? (
        <Select
          id="setting-value-type"
          label={t("system:setting.form.valueType.label")}
          options={valueTypeOptions}
          value={valueType}
          onChange={(v) => {
            const next = String(v) as SettingValueType;
            setValueType(next);
            setStringValue("");
            setNumberValue("");
            setBooleanValue(false);
            setObjectRows([{ id: newRowId(), key: "", value: "" }]);
            setArrayRows([{ id: newRowId(), value: "" }]);
            setErrors((prev) => ({ ...prev, value: undefined }));
          }}
        />
      ) : (
        <Input
          id="setting-value-type"
          label={t("system:setting.form.valueType.label")}
          type="text"
          value={valueType}
          disabled
        />
      )}

      {valueType === "string" && (
        <Input
          id="setting-value-string"
          label={t("system:setting.form.value.label")}
          type="text"
          value={stringValue}
          onChange={(e) => setStringValue(e.target.value)}
          error={errors.value}
          hint={isTimezoneSetting ? t("system:setting.form.value.timezoneHint") : undefined}
          required
          clearable
        />
      )}

      {valueType === "number" && (
        <Input
          id="setting-value-number"
          label={t("system:setting.form.value.label")}
          type="number"
          value={numberValue}
          onChange={(e) => setNumberValue(e.target.value)}
          error={errors.value}
          required
        />
      )}

      {valueType === "boolean" && (
        <div className="space-y-2">
          <Label>{t("system:setting.form.value.label")}</Label>
          <Checkbox
            id="setting-value-boolean"
            label={t("system:setting.form.value.booleanLabel")}
            checked={booleanValue}
            onChange={setBooleanValue}
          />
        </div>
      )}

      {valueType === "object" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>{t("system:setting.form.value.label")}</Label>
            <Button
              btnType="button"
              variant="outline"
              size="sm"
              startIcon={<MdAdd className="size-4" />}
              onClick={() => setObjectRows((rows) => [...rows, { id: newRowId(), key: "", value: "" }])}
            >
              {t("system:setting.form.value.addRow")}
            </Button>
          </div>
          <div className="space-y-2">
            {objectRows.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    id={`setting-object-key-${row.id}`}
                    type="text"
                    value={row.key}
                    onChange={(e) =>
                      setObjectRows((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, key: e.target.value } : item))
                      )
                    }
                    placeholder={t("system:setting.form.value.keyPlaceholder")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    id={`setting-object-value-${row.id}`}
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      setObjectRows((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, value: e.target.value } : item))
                      )
                    }
                    placeholder={t("system:setting.form.value.valuePlaceholder")}
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  onClick={() =>
                    setObjectRows((rows) =>
                      rows.length <= 1
                        ? [{ id: newRowId(), key: "", value: "" }]
                        : rows.filter((item) => item.id !== row.id)
                    )
                  }
                  aria-label={t("system:setting.form.value.removeRow")}
                >
                  <MdDelete className="size-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.value ? <p className="text-sm text-error-500">{errors.value}</p> : null}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("system:setting.form.value.objectHint")}</p>
        </div>
      )}

      {valueType === "array" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>{t("system:setting.form.value.label")}</Label>
            <Button
              btnType="button"
              variant="outline"
              size="sm"
              startIcon={<MdAdd className="size-4" />}
              onClick={() => setArrayRows((rows) => [...rows, { id: newRowId(), value: "" }])}
            >
              {t("system:setting.form.value.addRow")}
            </Button>
          </div>
          <div className="space-y-2">
            {arrayRows.map((row, index) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-outline px-2 text-sm font-medium text-on-surface shadow-theme-xs">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Input
                    id={`setting-array-value-${row.id}`}
                    type="text"
                    value={row.value}
                    onChange={(e) =>
                      setArrayRows((rows) =>
                        rows.map((item) => (item.id === row.id ? { ...item, value: e.target.value } : item))
                      )
                    }
                    placeholder={t("system:setting.form.value.valuePlaceholder")}
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                  onClick={() =>
                    setArrayRows((rows) =>
                      rows.length <= 1 ? [{ id: newRowId(), value: "" }] : rows.filter((item) => item.id !== row.id)
                    )
                  }
                  aria-label={t("system:setting.form.value.removeRow")}
                >
                  <MdDelete className="size-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.value ? <p className="text-sm text-error-500">{errors.value}</p> : null}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("system:setting.form.value.arrayHint")}</p>
        </div>
      )}

      <TextArea
        id="setting-remark"
        label={t("system:setting.form.remark.label")}
        rows={2}
        value={remark}
        onChange={setRemark}
        placeholder={t("system:setting.form.remark.placeholder")}
      />

      {isCreate && (
        <Checkbox
          id="setting-is-active"
          label={t("system:setting.form.isActive.label")}
          checked={isActive}
          onChange={setIsActive}
        />
      )}
    </div>
  );
});

export const toSettingCreate = (values: SettingFormValues): SettingCreate => ({
  namespace: values.namespace,
  settingKey: values.settingKey,
  valueType: values.valueType,
  value: values.value,
  remark: values.remark,
  isActive: values.isActive,
});

export const toSettingUpdate = (values: SettingFormValues): SettingUpdate => ({
  value: values.value,
  remark: values.remark,
});

export default SettingDataForm;
