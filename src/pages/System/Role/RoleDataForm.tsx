import type { AdminTranslationItem } from "@/types/translation";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
import { Checkbox, Input, Label } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import RolePermissionMatrix from "./RolePermissionMatrix";

export interface RoleFormValues {
  code: string;
  name?: string;
  isActive?: boolean;
  description?: string;
  remark?: string;
  permissions?: string[];
  translations?: AdminTranslationItem[];
}

export interface RoleDataFormHandle {
  validate: () => boolean;
  getValues: () => RoleFormValues;
}

const RoleDataForm = forwardRef<
  RoleDataFormHandle,
  {
    mode: "create" | "edit";
    defaultValues?: Partial<RoleFormValues> | null;
  }
>(function RoleDataForm({ mode, defaultValues }, ref) {
  const { t } = useTranslation();
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();

  const [code, setCode] = useState<string>(defaultValues?.code || "");
  const [isActive, setIsActive] = useState<boolean>(defaultValues?.isActive ?? true);
  const [permissions, setPermissions] = useState<string[]>(defaultValues?.permissions ? defaultValues.permissions : []);
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [errors, setErrors] = useState<{ code?: string; name?: string; permissions?: string }>({});

  useEffect(() => {
    if (locales.length === 0) return;
    setCode(defaultValues?.code || "");
    setIsActive(defaultValues?.isActive ?? true);
    setPermissions(defaultValues?.permissions || []);
    setTranslationMap(
      hydrateTranslationMap(locales, defaultValues?.translations, {
        name: defaultValues?.name,
        description: defaultValues?.description,
        remark: defaultValues?.remark,
      }),
    );
  }, [defaultValues, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const validate = (): boolean => {
    const nextErrors: { code?: string; name?: string; permissions?: string } = {};
    if (!code || code.trim() === "") nextErrors.code = t("system:role.form.validation.codeRequired");
    const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
    if (name_error_key) nextErrors.name = t(name_error_key);
    if (!permissions || permissions.length === 0) nextErrors.permissions = t("system:role.form.validation.permissionsRequired");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getValues = (): RoleFormValues => {
    const translations = buildTranslationPayload(translationMap);
    return {
      code: code.trim(),
      isActive,
      permissions,
      translations,
    };
  };

  useImperativeHandle(ref, () => ({
    validate,
    getValues,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            id="code"
            label={t("system:role.form.code.label")}
            type="text"
            placeholder={t("system:role.form.code.placeholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={mode === "edit"}
            error={errors.code ?? undefined}
            hint={t("system:role.form.code.hint")}
            required
            clearable
          />
        </div>
      </div>

      <Checkbox id="isActive" label={t("system:role.form.checkboxActive")} checked={isActive} onChange={setIsActive} />

      <TranslationTabsForm
        locales={locales}
        defaultLocaleId={defaultLocaleId}
        value={translationMap}
        onChange={setTranslationMap}
        fields={["name", "description", "remark"]}
        loading={loading}
        error={error}
        nameError={errors.name ? t(errors.name) : undefined}
        labels={{
          name: t("system:role.form.name.label"),
          description: t("system:role.form.description.label"),
          remark: t("system:role.form.remark.label"),
        }}
      />

      <div>
        <Label>{t("system:role.form.permissionsLabelRequired")}</Label>
        {errors.permissions && <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">{errors.permissions}</p>}
        <RolePermissionMatrix
          value={permissions}
          onChange={setPermissions}
          className={
            errors.permissions
              ? "border rounded-lg border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800"
              : ""
          }
        />
      </div>
    </div>
  );
});

export default RoleDataForm;
