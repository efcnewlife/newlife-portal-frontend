import { resourceService, type ResourceMenuItem } from "@/api/services/resourceService";
import { verbService, type VerbItem } from "@/api/services/verbService";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import type { AdminTranslationItem } from "@/types/translation";
import { resolveIcon } from "@/utils/icon-resolver";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, ComboBox, Input, Select } from "@efcnewlife/newlife-ui";

export interface PermissionFormValues {
  id?: string;
  name?: string;
  code: string;
  resourceId: string;
  verbId: string;
  isActive: boolean;
  description?: string;
  remark?: string;
  translations?: AdminTranslationItem[];
}

interface PermissionDataFormProps {
  mode: "create" | "edit";
  defaultValues?: PermissionFormValues | null;
  onSubmit: (values: PermissionFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const PermissionDataForm: React.FC<PermissionDataFormProps> = ({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const { t } = useTranslation();
  const { locales, defaultLocaleId, loading: localesLoading, error: localesError } = useActiveLocales();

  const [code, setCode] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [verbId, setVerbId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resources, setResources] = useState<ResourceMenuItem[]>([]);
  const [verbs, setVerbs] = useState<VerbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [rr, vr] = await Promise.all([resourceService.getResources(false), verbService.list()]);
        if (rr.success) {
          setResources(rr.data.items || []);
        }
        if (vr.success) {
          setVerbs(vr.data.items || []);
        }
      } catch (e) {
        console.error("Error loading resources/verbs:", e);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    if (locales.length === 0) return;
    if (defaultValues) {
      setCode(defaultValues.code || "");
      setResourceId(defaultValues.resourceId || "");
      setVerbId(defaultValues.verbId || "");
      setIsActive(defaultValues.isActive ?? true);
      setTranslationMap(
        hydrateTranslationMap(locales, defaultValues.translations, {
          name: defaultValues.name,
          description: defaultValues.description,
          remark: defaultValues.remark,
        })
      );
    } else {
      setCode("");
      setResourceId("");
      setVerbId("");
      setIsActive(true);
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [defaultValues, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
    if (name_error_key) next.name = t(name_error_key);

    if (!code || code.trim().length === 0) {
      next.code = t("system:permission.form.validation.codeRequired");
    }

    if (!resourceId) {
      next.resourceId = t("system:permission.form.validation.resourceRequired");
    }

    if (!verbId) {
      next.verbId = t("system:permission.form.validation.verbRequired");
    }

    const default_description = defaultLocaleId ? translationMap[defaultLocaleId]?.description : undefined;
    if (default_description && default_description.length > 500) {
      next.description = t("system:permission.form.validation.descriptionTooLong");
    }

    const default_remark = defaultLocaleId ? translationMap[defaultLocaleId]?.remark : undefined;
    if (default_remark && default_remark.length > 500) {
      next.remark = t("system:permission.form.validation.remarkTooLong");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const translations = buildTranslationPayload(translationMap);

    await onSubmit({
      id: defaultValues?.id,
      code: code.trim(),
      resourceId,
      verbId,
      isActive,
      translations,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="code"
            label={t("system:permission.form.code.label")}
            type="text"
            placeholder={t("system:permission.form.code.placeholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={errors.code}
            hint={t("system:permission.form.code.hint")}
            required
            clearable
          />
        </div>
      </div>

      <TranslationTabsForm
        locales={locales}
        defaultLocaleId={defaultLocaleId}
        value={translationMap}
        onChange={setTranslationMap}
        fields={["name", "description", "remark"]}
        loading={localesLoading}
        error={localesError}
        nameError={errors.name}
        labels={{
          name: t("system:permission.form.displayName.label"),
          description: t("system:permission.form.description.label"),
          remark: t("system:permission.form.remark.label"),
        }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <ComboBox<string>
            id="resourceId"
            label={t("system:permission.table.resource")}
            options={
              loading
                ? []
                : resources
                    .filter((r) => r.pid != null)
                    .map((r) => ({
                      value: r.id,
                      label: r.name,
                      icon: r.icon ? resolveIcon(r.icon, { className: "size-4" }).icon : undefined,
                    }))
            }
            value={resourceId || null}
            onChange={(value) => setResourceId(value || "")}
            placeholder={
              loading
                ? t("system:permission.form.comboResourcePlaceholder.loading")
                : t("system:permission.form.comboResourcePlaceholder.idle")
            }
            disabled={loading}
            error={errors.resourceId}
            required
            clearable
          />
        </div>

        <div>
          <Select
            id="verbId"
            label={t("system:permission.form.verb.label")}
            options={
              loading
                ? [{ value: "", label: t("system:permission.form.verb.placeholderLoading") }]
                : [
                    { value: null, label: t("system:permission.form.verbPlaceholderDisabled"), disabled: true },
                    ...verbs.map((v) => ({
                      value: v.id,
                      label: v.name || v.action,
                    })),
                  ]
            }
            value={verbId}
            onChange={(value) => setVerbId(value as string)}
            error={errors.verbId}
            placeholder={t("system:permission.form.verb.placeholder")}
            disabled={loading}
            required
            clearable
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("system:permission.form.sectionStatus")}
          </label>
          <div className="space-y-2">
            <Checkbox
              checked={isActive}
              onChange={(checked) => setIsActive(checked)}
              label={t("system:permission.form.checkboxActive")}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} size="sm" variant="outline" disabled={!!submitting}>
          {t("common:cancel")}
        </Button>
        <Button btnType="submit" size="sm" variant="primary" disabled={!!submitting}>
          {mode === "create" ? t("common:create") : t("common:save")}
        </Button>
      </div>
    </form>
  );
};

export default PermissionDataForm;
