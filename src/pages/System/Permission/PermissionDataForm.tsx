import { resourceService } from "@/api/services/resourceService";
import { verbService, type VerbItem } from "@/api/services/verbService";
import { Button, Checkbox, ComboBox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";
import type { ResourceMenuItem } from "@/types/resource-admin";
import { resolveIcon } from "@/utils/icon-resolver";
import { useEffect, useState } from "react";

export interface PermissionFormValues {
  id?: string;
  displayName: string;
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
  const [values, setValues] = useState<PermissionFormValues>({
    displayName: "",
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

  // Load resources and verbs
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

  // Update form values
  useEffect(() => {
    if (defaultValues) {
      setValues({
        id: defaultValues.id,
        displayName: defaultValues.displayName || "",
        code: defaultValues.code || "",
        resourceId: defaultValues.resourceId || "",
        verbId: defaultValues.verbId || "",
        isActive: defaultValues.isActive ?? true,
        description: defaultValues.description || "",
        remark: defaultValues.remark || "",
      });
    } else {
      setValues({
        displayName: "",
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

    if (!values.displayName || values.displayName.trim().length === 0) {
      next.displayName = "Please enter a display name";
    }

    if (!values.code || values.code.trim().length === 0) {
      next.code = "Please enter a code";
    }

    if (!values.resourceId) {
      next.resourceId = "Please select a resource";
    }

    if (!values.verbId) {
      next.verbId = "Please select an action";
    }

    if (values.description && values.description.length > 500) {
      next.description = "Description cannot exceed 500 characters";
    }

    if (values.remark && values.remark.length > 500) {
      next.remark = "Remark cannot exceed 500 characters";
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
            id="displayName"
            label="Display Name"
            type="text"
            placeholder="Enter display name"
            value={values.displayName}
            onChange={(e) => setValues((v) => ({ ...v, displayName: e.target.value }))}
            error={errors.displayName}
            hint="Example: Create User"
            required
            clearable
          />
        </div>

        <div>
          <Input
            id="code"
            label="Code"
            type="text"
            placeholder="Enter code"
            value={values.code}
            onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
            error={errors.code}
            hint="Example: user:create"
            required
            clearable
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <ComboBox<string>
            id="resourceId"
            label="Resource"
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
            placeholder={loading ? "Loading..." : "Select or search a resource"}
            disabled={loading}
            error={errors.resourceId}
            required
            clearable
          />
        </div>

        <div>
          <Select
            id="verbId"
            label="Action"
            options={
              loading
                ? [{ value: "", label: "Loading..." }]
                : [
                    { value: null, label: "Select an action", disabled: true },
                    ...verbs.map((v) => ({
                      value: v.id,
                      label: v.displayName || v.action,
                    })),
                  ]
            }
            value={values.verbId}
            onChange={(value) => setValues((v) => ({ ...v, verbId: value as string }))}
            error={errors.verbId}
            placeholder="Select an action"
            disabled={loading}
            required
            clearable
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <div className="space-y-2">
            <Checkbox checked={values.isActive} onChange={(checked) => setValues((v) => ({ ...v, isActive: checked }))} label="Active" />
          </div>
        </div>
      </div>

      <div>
        <TextArea
          id="description"
          label="Description"
          rows={3}
          placeholder="Permission description"
          value={values.description || ""}
          onChange={(value) => setValues((v) => ({ ...v, description: value }))}
          error={errors.description}
          hint={errors.description || ""}
        />
      </div>

      <div>
        <TextArea
          id="remark"
          label="Remark"
          rows={3}
          placeholder="Additional notes"
          value={values.remark || ""}
          onChange={(value) => setValues((v) => ({ ...v, remark: value }))}
          error={errors.remark}
          hint={errors.remark || ""}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={onCancel} size="sm" variant="outline" disabled={!!submitting}>
          Cancel
        </Button>
        <Button btnType="submit" size="sm" variant="primary" disabled={!!submitting}>
          {mode === "create" ? "Create" : "Save"}
        </Button>
      </div>
    </form>
  );
};

export default PermissionDataForm;
