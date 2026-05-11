import { AdminResourceType } from "@/api/services/resourceService";
import { getCommonIconNames, useIconResolver } from "@/utils/icon-resolver";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";

export interface ResourceFormValues {
  id?: string;
  name: string;
  key: string;
  code: string;
  icon: string;
  path: string;
  type: AdminResourceType;
  is_visible?: boolean;
  description?: string;
  remark?: string;
  pid?: string;
}

interface ResourceDataFormProps {
  mode: "create" | "edit";
  defaultValues?: ResourceFormValues | null;
  parentResource?: { id: string; name: string } | null;
  onSubmit: (values: ResourceFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const ResourceDataForm: React.FC<ResourceDataFormProps> = ({ mode, defaultValues, parentResource, onSubmit, onCancel, submitting }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<ResourceFormValues>({
    name: "",
    key: "",
    code: "",
    icon: "",
    path: "",
    type: AdminResourceType.GENERAL,
    is_visible: true,
    description: "",
    remark: "",
    pid: undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultValues) {
      setValues({
        id: defaultValues.id,
        name: defaultValues.name || "",
        key: defaultValues.key || "",
        code: defaultValues.code || "",
        icon: defaultValues.icon || "",
        path: defaultValues.path || "",
        type: defaultValues.type ?? AdminResourceType.GENERAL,
        is_visible: defaultValues.is_visible ?? true,
        description: defaultValues.description || "",
        remark: defaultValues.remark || "",
        pid: defaultValues.pid ?? undefined,
      });
    } else if (parentResource) {
      setValues((prev) => ({
        ...prev,
        pid: parentResource.id,
      }));
    }
  }, [defaultValues, parentResource]);

  const iconResult = useIconResolver(values.icon, {
    library: "md",
    className: "size-5",
  });

  const { icon: dynamicIcon, error: iconError, isValid: isIconValid } = iconResult;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.name.trim()) {
      newErrors.name = t("system:resource.form.validation.nameRequired");
    }

    if (!values.key.trim()) {
      newErrors.key = t("system:resource.form.validation.keyRequired");
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.key)) {
      newErrors.key = t("system:resource.form.validation.keyCharset");
    }

    if (!values.code.trim()) {
      newErrors.code = t("system:resource.form.validation.codeRequired");
    } else {
      const rootPattern = /^[a-zA-Z0-9_]+$/;
      const childPattern = /^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+$/;

      if (values.pid) {
        if (!childPattern.test(values.code)) {
          newErrors.code = t("system:resource.form.validation.codeChildFormat");
        }
      } else {
        if (!rootPattern.test(values.code)) {
          newErrors.code = t("system:resource.form.validation.codeRootFormat");
        }
      }
    }

    if (!values.path?.trim()) {
      newErrors.path = t("system:resource.form.validation.pathRequired");
    }

    if (!values.icon?.trim()) {
      newErrors.icon = t("system:resource.form.validation.iconRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isIconValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitValues: ResourceFormValues = {
        ...values,
        pid: values.pid ? values.pid : undefined,
      };
      await onSubmit(submitValues);
    }
  };

  const handleChange = (field: keyof ResourceFormValues, value: string | number | boolean | undefined) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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
              <p className="text-sm text-blue-700 dark:text-blue-300">{t("system:resource.form.parentBanner", { name: parentResource.name })}</p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{t("system:resource.form.sectionInfo")}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.name.label")}</label>
            <Input
              id="name"
              type="text"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder={t("system:resource.form.name.placeholder")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.key.label")}</label>
            <Input
              id="key"
              type="text"
              value={values.key}
              onChange={(e) => handleChange("key", e.target.value)}
              placeholder={t("system:resource.form.key.placeholder")}
              className={errors.key ? "border-red-500" : ""}
            />
            {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.code.label")}</label>
            <Input
              id="code"
              type="text"
              value={values.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder={t("system:resource.form.code.placeholder")}
              className={errors.code ? "border-red-500" : ""}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.path.label")}</label>
            <Input
              id="path"
              type="text"
              value={values.path}
              onChange={(e) => handleChange("path", e.target.value)}
              placeholder={t("system:resource.form.path.placeholder")}
              className={errors.path ? "border-red-500" : ""}
            />
            {errors.path && <p className="text-red-500 text-sm mt-1">{errors.path}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.type.label")}</label>
            <Select
              id="type"
              options={[
                { value: AdminResourceType.GENERAL, label: t("system:resource.form.type.optionGeneral") },
                { value: AdminResourceType.SYSTEM, label: t("system:resource.form.type.optionSystem") },
              ]}
              value={values.type}
              onChange={(value) => handleChange("type", Number(value))}
              placeholder={t("system:resource.form.type.placeholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.icon.label")}</label>
            <Input
              id="icon"
              type="text"
              value={values.icon}
              onChange={(e) => handleChange("icon", e.target.value)}
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
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{t("system:resource.form.sectionVisibility")}</div>
          <div className="flex items-center">
            <Checkbox
              id="is_visible"
              checked={!!values.is_visible}
              onChange={(checked) => handleChange("is_visible", checked)}
              label={t("system:resource.form.checkboxVisible")}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.remark.label")}</label>
        <Input
          id="remark"
          type="text"
          value={values.remark}
          onChange={(e) => handleChange("remark", e.target.value)}
          placeholder={t("system:resource.form.remark.placeholder")}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("system:resource.form.description.label")}</label>
        <TextArea
          id="description"
          value={values.description}
          onChange={(value) => handleChange("description", value)}
          placeholder={t("system:resource.form.description.placeholder")}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button btnType="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("common:cancel")}
        </Button>
        <Button btnType="submit" variant="primary" disabled={submitting}>
          {submitting ? t("system:resource.form.submittingSaving") : mode === "create" ? t("common:create") : t("common:save")}
        </Button>
      </div>
    </form>
  );
};

export default ResourceDataForm;
