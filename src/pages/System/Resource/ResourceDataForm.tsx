import { Button, Checkbox, Input, Select, TextArea } from "newlife-ui";
import { AdminResourceType } from "@/const/resource";
import { getCommonIconNames, useIconResolver } from "@/utils/icon-resolver";
import { useEffect, useState } from "react";

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
  parentResource?: { id: string; name: string } | null; // Parent resource info for creating child resources
  onSubmit: (values: ResourceFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const ResourceDataForm: React.FC<ResourceDataFormProps> = ({ mode, defaultValues, parentResource, onSubmit, onCancel, submitting }) => {
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
      // Automatically set parent resource ID when creating child resources
      setValues((prev) => ({
        ...prev,
        pid: parentResource.id,
      }));
    }
  }, [defaultValues, parentResource]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.name.trim()) {
      newErrors.name = "Resource name cannot be empty";
    }

    if (!values.key.trim()) {
      newErrors.key = "Resource key cannot be empty";
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.key)) {
      newErrors.key = "Resource key can only contain letters, numbers, and underscores";
    }

    if (!values.code.trim()) {
      newErrors.code = "Resource code cannot be empty";
    } else {
      const rootPattern = /^[a-zA-Z0-9_]+$/; // Root resource: resource only (no colon)
      const childPattern = /^[a-zA-Z0-9_]+:[a-zA-Z0-9_]+$/; // Child resource: {resource}:{subResource}

      if (values.pid) {
        // Child resource must include a colon
        if (!childPattern.test(values.code)) {
          newErrors.code = "Child resource code must follow {resource}:{subResource}, e.g. user:create";
        }
      } else {
        // Root resource must not include colon
        if (!rootPattern.test(values.code)) {
          newErrors.code = "Root resource code must follow {resource}, e.g. user";
        }
      }
    }

    if (!values.path?.trim()) {
      newErrors.path = "Resource path cannot be empty";
    }

    if (!values.icon?.trim()) {
      newErrors.icon = "Resource icon cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && isIconValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitValues: ResourceFormValues = {
        ...values,
        // Avoid sending empty string when no parent resource
        pid: values.pid ? values.pid : undefined,
      };
      await onSubmit(submitValues);
    }
  };

  // Use icon resolver
  const iconResult = useIconResolver(values.icon, {
    library: "md",
    className: "size-5",
  });

  const { icon: dynamicIcon, error: iconError, isValid: isIconValid } = iconResult;

  const handleChange = (field: keyof ResourceFormValues, value: string | number | boolean | undefined) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific errors
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Parent resource prompt (top) */}
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
                Creating a child resource under <strong className="font-medium">{parentResource.name}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Resource Information</h3>

      {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              value={values.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter resource name"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key <span className="text-red-500">*</span>
            </label>
            <Input
              id="key"
              type="text"
              value={values.key}
              onChange={(e) => handleChange("key", e.target.value)}
              placeholder="Enter resource key"
              className={errors.key ? "border-red-500" : ""}
            />
            {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              id="code"
              type="text"
              value={values.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="Enter resource code"
              className={errors.code ? "border-red-500" : ""}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Path <span className="text-red-500">*</span>
            </label>
            <Input
              id="path"
              type="text"
              value={values.path}
              onChange={(e) => handleChange("path", e.target.value)}
              placeholder="Enter resource path"
              className={errors.path ? "border-red-500" : ""}
            />
            {errors.path && <p className="text-red-500 text-sm mt-1">{errors.path}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              id="type"
              options={[
                { value: AdminResourceType.GENERAL, label: "General Feature (GENERAL)" },
                { value: AdminResourceType.SYSTEM, label: "System Feature (SYSTEM)" },
              ]}
              value={values.type}
              onChange={(value) => handleChange("type", Number(value))}
              placeholder="Select type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon <span className="text-red-500">*</span>
            </label>
            <Input
              id="icon"
              type="text"
              value={values.icon}
              onChange={(e) => handleChange("icon", e.target.value)}
              placeholder={`Enter icon name (e.g. ${getCommonIconNames("md").slice(0, 3).join(", ")})`}
              icon={dynamicIcon}
              iconPosition="left"
              error={errors.icon || !isIconValid ? iconError || undefined : undefined}
              hint={`Use Material Design icon names, e.g. ${getCommonIconNames("md").slice(0, 5).join(", ")}`}
              clearable
            />
          </div>
        </div>

        {/* Status */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Status</div>
          <div className="flex items-center">
            <Checkbox
              id="is_visible"
              checked={!!values.is_visible}
              onChange={(checked) => handleChange("is_visible", checked)}
              label="Visible"
            />
          </div>
        </div>
      </div>

      {/* Remark */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Remark</label>
        <Input
          id="remark"
          type="text"
          value={values.remark}
          onChange={(e) => handleChange("remark", e.target.value)}
          placeholder="Enter remark"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
        <TextArea
          id="description"
          value={values.description}
          onChange={(value) => handleChange("description", value)}
          placeholder="Enter resource description"
          rows={3}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button btnType="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button btnType="submit" variant="primary" disabled={submitting}>
          {submitting ? "Saving..." : mode === "create" ? "Create" : "Update"}
        </Button>
      </div>
    </form>
  );
};

export default ResourceDataForm;
