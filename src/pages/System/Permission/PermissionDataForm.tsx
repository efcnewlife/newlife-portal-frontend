import { resourceService, type ResourceMenuItem } from "@/api/services/resourceService";
import { verbService, type VerbItem } from "@/api/services/verbService";
import { resolveIcon } from "@/utils/icon-resolver";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, ComboBox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";

export interface PermissionFormValues {
  id?: string;
  name: string;
  code: string;
  resourceId: string;
  verbId: string;
  isActive: boolean;
  description?: string;
  remark?: string;
}

interface PermissionDataFormProps {
  mode: "create" | "edit";
  defaultValues?: PermissionFormValues | null;
  onSubmit: (values: PermissionFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const PermissionDataForm: React.FC<PermissionDataFormProps> = ({ mode, defaultValues, onSubmit, onCancel, submitting }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<PermissionFormValues>({
    name: "",
    code: "",
    resourceId: "",
    verbId: "",
    isActive: true,
    description: "",
    remark: "",
  });
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
    if (defaultValues) {
      setValues({
        id: defaultValues.id,
        name: defaultValues.name || "",
        code: defaultValues.code || "",
        resourceId: defaultValues.resourceId || "",
        verbId: defaultValues.verbId || "",
        isActive: defaultValues.isActive ?? true,
        description: defaultValues.description || "",
        remark: defaultValues.remark || "",
      });
    } else {
      setValues({
        name: "",
        code: "",
        resourceId: "",
        verbId: "",
        isActive: true,
        description: "",
        remark: "",
      });
    }
  }, [defaultValues]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!values.name || values.name.trim().length === 0) {
      next.name = t("system:permission.form.validation.nameRequired");
    }

    if (!values.code || values.code.trim().length === 0) {
      next.code = t("system:permission.form.validation.codeRequired");
    }

    if (!values.resourceId) {
      next.resourceId = t("system:permission.form.validation.resourceRequired");
    }

    if (!values.verbId) {
      next.verbId = t("system:permission.form.validation.verbRequired");
    }

    if (values.description && values.description.length > 500) {
      next.description = t("system:permission.form.validation.descriptionTooLong");
    }

    if (values.remark && values.remark.length > 500) {
      next.remark = t("system:permission.form.validation.remarkTooLong");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="name"
            label={t("system:permission.form.displayName.label")}
            type="text"
            placeholder={t("system:permission.form.displayName.placeholder")}
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            error={errors.name}
            hint={t("system:permission.form.displayName.hint")}
            required
            clearable
          />
        </div>

        <div>
          <Input
            id="code"
            label={t("system:permission.form.code.label")}
            type="text"
            placeholder={t("system:permission.form.code.placeholder")}
            value={values.code}
            onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
            error={errors.code}
            hint={t("system:permission.form.code.hint")}
            required
            clearable
          />
        </div>
      </div>

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
            value={values.resourceId || null}
            onChange={(value) => setValues((v) => ({ ...v, resourceId: value || "" }))}
            placeholder={loading ? t("system:permission.form.comboResourcePlaceholder.loading") : t("system:permission.form.comboResourcePlaceholder.idle")}
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
            value={values.verbId}
            onChange={(value) => setValues((v) => ({ ...v, verbId: value as string }))}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("system:permission.form.sectionStatus")}</label>
          <div className="space-y-2">
            <Checkbox checked={values.isActive} onChange={(checked) => setValues((v) => ({ ...v, isActive: checked }))} label={t("system:permission.form.checkboxActive")} />
          </div>
        </div>
      </div>

      <div>
        <TextArea
          id="description"
          label={t("system:permission.form.description.label")}
          rows={3}
          placeholder={t("system:permission.form.description.placeholder")}
          value={values.description || ""}
          onChange={(value) => setValues((v) => ({ ...v, description: value }))}
          error={errors.description}
          hint={errors.description || ""}
        />
      </div>

      <div>
        <TextArea
          id="remark"
          label={t("system:permission.form.remark.label")}
          rows={3}
          placeholder={t("system:permission.form.remark.placeholder")}
          value={values.remark || ""}
          onChange={(value) => setValues((v) => ({ ...v, remark: value }))}
          error={errors.remark}
          hint={errors.remark || ""}
        />
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
