import { AdminResourceType } from "@/api/services/resourceService";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import type { AdminTranslationItem } from "@/types/translation";
import { getCommonIconNames, useIconResolver } from "@/utils/icon-resolver";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Input, Select } from "@efcnewlife/newlife-ui";

export interface ResourceFormValues {
  id?: string;
  name?: string;
  key: string;
  code: string;
  icon: string;
  path: string;
  type: AdminResourceType;
  is_visible?: boolean;
  description?: string;
  remark?: string;
  pid?: string;
  translations?: AdminTranslationItem[];
}

interface ResourceDataFormProps {
  mode: "create" | "edit";
  defaultValues?: ResourceFormValues | null;
  parentResource?: { id: string; name: string } | null;
  onSubmit: (values: ResourceFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const ResourceDataForm: React.FC<ResourceDataFormProps> = ({
  mode,
  defaultValues,
  parentResource,
  onSubmit,
  onCancel,
  submitting,
}) => {
  const { t } = useTranslation();
  const { locales, defaultLocaleId, loading: localesLoading, error: localesError } = useActiveLocales();

  const [key, setKey] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("");
  const [path, setPath] = useState("");
  const [type, setType] = useState<AdminResourceType>(AdminResourceType.GENERAL);
  const [is_visible, setIsVisible] = useState(true);
  const [pid, setPid] = useState<string | undefined>();
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (locales.length === 0) return;
    if (defaultValues) {
      setKey(defaultValues.key || "");
      setCode(defaultValues.code || "");
      setIcon(defaultValues.icon || "");
      setPath(defaultValues.path || "");
      setType(defaultValues.type ?? AdminResourceType.GENERAL);
      setIsVisible(defaultValues.is_visible ?? true);
      setPid(defaultValues.pid ?? undefined);
      setTranslationMap(
        hydrateTranslationMap(locales, defaultValues.translations, {
          name: defaultValues.name,
          description: defaultValues.description,
          remark: defaultValues.remark,
        })
      );
    } else if (parentResource) {
      setPid(parentResource.id);
      setTranslationMap(createEmptyTranslationMap(locales));
    } else {
      setKey("");
      setCode("");
      setIcon("");
      setPath("");
      setType(AdminResourceType.GENERAL);
      setIsVisible(true);
      setPid(undefined);
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [defaultValues, parentResource, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const iconResult = useIconResolver(icon, {
    library: "md",
    className: "size-5",
  });

  const { icon: dynamicIcon, error: iconError, isValid: isIconValid } = iconResult;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
    if (name_error_key) newErrors.name = t(name_error_key);

    if (!key.trim()) {
      newErrors.key = t("system:resource.form.validation.keyRequired");
    } else if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      newErrors.key = t("system:resource.form.validation.keyCharset");
    }

    if (!code.trim()) {
      newErrors.code = t("system:resource.form.validation.codeRequired");
    } else {
      const rootPattern = /^[a-zA-Z0-9_]+$/;
      const childPattern = /^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+$/;

      if (pid) {
        if (!childPattern.test(code)) {
          newErrors.code = t("system:resource.form.validation.codeChildFormat");
        }
      } else {
        if (!rootPattern.test(code)) {
          newErrors.code = t("system:resource.form.validation.codeRootFormat");
        }
      }
    }

    if (!path?.trim()) {
      newErrors.path = t("system:resource.form.validation.pathRequired");
    }

    if (!icon?.trim()) {
      newErrors.icon = t("system:resource.form.validation.iconRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isIconValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const translations = buildTranslationPayload(translationMap);

    const submitValues: ResourceFormValues = {
      id: defaultValues?.id,
      key: key.trim(),
      code: code.trim(),
      path: path.trim(),
      icon: icon.trim(),
      type,
      is_visible,
      pid: pid ? pid : undefined,
      translations,
    };
    await onSubmit(submitValues);
  };

  const iconHintTail = getCommonIconNames("md").slice(0, 5).join(", ");

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {parentResource && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t("system:resource.form.parentBanner", { name: parentResource.name })}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t("system:resource.form.sectionInfo")}
        </h3>

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
            name: t("system:resource.form.name.label"),
            description: t("system:resource.form.description.label"),
            remark: t("system:resource.form.remark.label"),
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("system:resource.form.key.label")}
            </label>
            <Input
              id="key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t("system:resource.form.key.placeholder")}
              className={errors.key ? "border-red-500" : ""}
            />
            {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("system:resource.form.code.label")}
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("system:resource.form.code.placeholder")}
              className={errors.code ? "border-red-500" : ""}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("system:resource.form.path.label")}
            </label>
            <Input
              id="path"
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder={t("system:resource.form.path.placeholder")}
              className={errors.path ? "border-red-500" : ""}
            />
            {errors.path && <p className="text-red-500 text-sm mt-1">{errors.path}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("system:resource.form.type.label")}
            </label>
            <Select
              id="type"
              options={[
                { value: AdminResourceType.GENERAL, label: t("system:resource.form.type.optionGeneral") },
                { value: AdminResourceType.SYSTEM, label: t("system:resource.form.type.optionSystem") },
              ]}
              value={type}
              onChange={(value) => setType(Number(value))}
              placeholder={t("system:resource.form.type.placeholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("system:resource.form.icon.label")}
            </label>
            <Input
              id="icon"
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder={t("system:resource.form.icon.placeholder")}
              icon={dynamicIcon}
              iconPosition="left"
              error={errors.icon || !isIconValid ? iconError || undefined : undefined}
              hint={`${t("system:resource.form.iconHint")} ${iconHintTail}`}
              clearable
            />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            {t("system:resource.form.sectionVisibility")}
          </div>
          <div className="flex items-center">
            <Checkbox
              id="is_visible"
              checked={!!is_visible}
              onChange={(checked) => setIsVisible(checked)}
              label={t("system:resource.form.checkboxVisible")}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button btnType="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("common:cancel")}
        </Button>
        <Button btnType="submit" variant="primary" disabled={submitting}>
          {submitting
            ? t("system:resource.form.submittingSaving")
            : mode === "create"
              ? t("common:create")
              : t("common:save")}
        </Button>
      </div>
    </form>
  );
};

export default ResourceDataForm;
