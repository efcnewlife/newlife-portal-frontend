import { usePermissions } from "@/context/AuthContext";
import { Button, Checkbox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface UserFormValues {
  id?: string;
  phone_number: string;
  email: string;
  password?: string;
  password_confirm?: string;
  verified: boolean;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  display_name?: string;
  gender?: number; // 0 unknown, 1 male, 2 female
  is_ministry: boolean;
  remark?: string;
}

interface UserDataFormProps {
  mode: "create" | "edit";
  defaultValues?: UserFormValues | null;
  onSubmit: (values: UserFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const UserDataForm: React.FC<UserDataFormProps> = ({ mode, defaultValues, onSubmit, onCancel, submitting }) => {
  const { t } = useTranslation();
  const { isSuperAdmin } = usePermissions();

  // Whether current session user is super admin (gates some fields)
  const [values, setValues] = useState<UserFormValues>({
    phone_number: "",
    email: "",
    password: "",
    password_confirm: "",
    verified: false,
    is_active: true,
    is_superuser: false,
    is_admin: false,
    display_name: "",
    gender: 0,
    is_ministry: false,
    remark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultValues) {
      setValues({
        id: defaultValues.id,
        phone_number: defaultValues.phone_number || "",
        email: defaultValues.email || "",
        password: "",
        password_confirm: "",
        verified: defaultValues.verified ?? false,
        is_active: defaultValues.is_active ?? true,
        is_superuser: defaultValues.is_superuser ?? false,
        is_admin: defaultValues.is_admin ?? false,
        display_name: defaultValues.display_name || "",
        gender: defaultValues.gender ?? 0,
        is_ministry: defaultValues.is_ministry ?? false,
        remark: defaultValues.remark || "",
      });
    } else {
      setValues({
        phone_number: "",
        email: "",
        password: "",
        password_confirm: "",
        verified: false,
        is_active: true,
        is_superuser: false,
        is_admin: false,
        display_name: "",
        gender: 0,
        is_ministry: false,
        remark: "",
      });
    }
  }, [defaultValues]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    const phone_trimmed = values.phone_number?.trim() ?? "";
    if (phone_trimmed.length > 0) {
      if ((phone_trimmed.length > 1 && !/^[1-9]\d*$/.test(phone_trimmed.slice(1))) || !phone_trimmed.startsWith("+")) {
        next.phone_number = t("system:user.form.validation.phoneInvalid");
      }
    }

    if (!values.email || values.email.trim().length === 0) {
      next.email = t("system:user.form.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = t("system:user.form.validation.emailInvalid");
    }

    // Create-mode password checks run in the parent (UserDataPage) before submit

    if (values.display_name && values.display_name.length > 64) {
      next.display_name = t("system:user.form.validation.displayNameTooLong");
    }

    if (values.remark && values.remark.length > 500) {
      next.remark = t("system:user.form.validation.remarkTooLong");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Omit password fields on edit submit
    const submitValues = mode === "edit" ? { ...values, password: undefined, password_confirm: undefined } : values;

    await onSubmit(submitValues);
  };

  const gender_options = useMemo(
    () => [
      { value: 0, label: t("system:shared.genderUnknown") },
      { value: 1, label: t("system:shared.genderMale") },
      { value: 2, label: t("system:shared.genderFemale") },
    ],
    [t]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="email"
            label={t("system:user.form.email.label")}
            placeholder={t("system:user.form.email.placeholder")}
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            error={errors.email || undefined}
            hint={t("system:user.form.email.hint")}
            required
            clearable
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="display_name"
            label={t("system:user.form.displayName.label")}
            type="text"
            placeholder={t("system:user.form.displayName.placeholder")}
            value={values.display_name || ""}
            onChange={(e) => setValues((v) => ({ ...v, display_name: e.target.value }))}
            error={errors.display_name || undefined}
          />
          {errors.display_name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.display_name}</p>}
        </div>

        <div>
          <Select
            id="gender"
            label={t("system:user.form.gender.label")}
            placeholder={t("system:user.form.gender.placeholder")}
            options={gender_options}
            value={values.gender ?? 0}
            onChange={(value) => setValues((v) => ({ ...v, gender: Number(value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("system:user.form.sectionStatus")}</label>
          <div className="space-y-2">
            <Checkbox checked={values.verified} onChange={(checked) => setValues((v) => ({ ...v, verified: checked }))} label={t("system:user.form.checkboxVerified")} />
            <Checkbox checked={values.is_active} onChange={(checked) => setValues((v) => ({ ...v, is_active: checked }))} label={t("system:user.form.checkboxActive")} />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("system:user.form.sectionPermissions")}</label>
          <div className="space-y-2">
            <Checkbox
              checked={values.is_superuser}
              onChange={(checked) => setValues((v) => ({ ...v, is_superuser: checked }))}
              label={t("system:user.form.checkboxSuperUser")}
              disabled={!isSuperAdmin}
            />
            <Checkbox checked={values.is_admin} onChange={(checked) => setValues((v) => ({ ...v, is_admin: checked }))} label={t("system:user.form.checkboxAdmin")} />
          </div>
        </div>
      </div>

      <div>
        <TextArea
          id="remark"
          label={t("system:user.form.remark.label")}
          rows={3}
          placeholder={t("system:user.form.remark.placeholder")}
          value={values.remark || ""}
          onChange={(value) => setValues((v) => ({ ...v, remark: value }))}
          error={errors.remark || undefined}
        />
        {errors.remark && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.remark}</p>}
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

export default UserDataForm;
