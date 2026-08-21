import { usePermissions } from "@/context/AuthContext";
import { Button, Checkbox, Input, Select, TextArea } from "@efcnewlife/newlife-ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface UserFormValues {
  id?: string;
  email: string;
  password?: string;
  password_confirm?: string;
  verified: boolean;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  gender?: number; // 0 unknown, 1 male, 2 female
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

  const [values, setValues] = useState<UserFormValues>({
    email: "",
    password: "",
    password_confirm: "",
    verified: false,
    is_active: true,
    is_superuser: false,
    is_admin: false,
    first_name: "",
    last_name: "",
    preferred_name: "",
    gender: 0,
    remark: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultValues) {
      setValues({
        id: defaultValues.id,
        email: defaultValues.email || "",
        password: "",
        password_confirm: "",
        verified: defaultValues.verified ?? false,
        is_active: defaultValues.is_active ?? true,
        is_superuser: defaultValues.is_superuser ?? false,
        is_admin: defaultValues.is_admin ?? false,
        first_name: defaultValues.first_name || "",
        last_name: defaultValues.last_name || "",
        preferred_name: defaultValues.preferred_name || "",
        gender: defaultValues.gender ?? 0,
        remark: defaultValues.remark || "",
      });
    } else {
      setValues({
        email: "",
        password: "",
        password_confirm: "",
        verified: false,
        is_active: true,
        is_superuser: false,
        is_admin: false,
        first_name: "",
        last_name: "",
        preferred_name: "",
        gender: 0,
        remark: "",
      });
    }
  }, [defaultValues]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!values.email || values.email.trim().length === 0) {
      next.email = t("system:user.form.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = t("system:user.form.validation.emailInvalid");
    }

    if (mode === "create") {
      if (!values.password || values.password.trim().length === 0) {
        next.password = t("system:user.form.validation.passwordRequired");
      }
      if (!values.password_confirm || values.password_confirm.trim().length === 0) {
        next.password_confirm = t("system:user.form.validation.passwordConfirmRequired");
      } else if (values.password && values.password_confirm !== values.password) {
        next.password_confirm = t("system:user.form.validation.passwordMismatch");
      }
    }

    if (values.first_name && values.first_name.length > 64) {
      next.first_name = t("system:user.form.validation.firstNameTooLong");
    }

    if (values.last_name && values.last_name.length > 64) {
      next.last_name = t("system:user.form.validation.lastNameTooLong");
    }

    if (values.preferred_name && values.preferred_name.length > 64) {
      next.preferred_name = t("system:user.form.validation.preferredNameTooLong");
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
      {mode === "create" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              id="password"
              type="password"
              label={t("system:user.form.password.label")}
              placeholder={t("system:user.form.password.placeholder")}
              value={values.password || ""}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              error={errors.password || undefined}
              required
            />
          </div>
          <div>
            <Input
              id="password_confirm"
              type="password"
              label={t("system:user.form.passwordConfirm.label")}
              placeholder={t("system:user.form.passwordConfirm.placeholder")}
              value={values.password_confirm || ""}
              onChange={(e) => setValues((v) => ({ ...v, password_confirm: e.target.value }))}
              error={errors.password_confirm || undefined}
              required
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="first_name"
            label={t("system:user.form.firstName.label")}
            type="text"
            placeholder={t("system:user.form.firstName.placeholder")}
            value={values.first_name || ""}
            onChange={(e) => setValues((v) => ({ ...v, first_name: e.target.value }))}
            error={errors.first_name || undefined}
          />
        </div>

        <div>
          <Input
            id="last_name"
            label={t("system:user.form.lastName.label")}
            type="text"
            placeholder={t("system:user.form.lastName.placeholder")}
            value={values.last_name || ""}
            onChange={(e) => setValues((v) => ({ ...v, last_name: e.target.value }))}
            error={errors.last_name || undefined}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="preferred_name"
            label={t("system:user.form.preferredName.label")}
            type="text"
            placeholder={t("system:user.form.preferredName.placeholder")}
            value={values.preferred_name || ""}
            onChange={(e) => setValues((v) => ({ ...v, preferred_name: e.target.value }))}
            error={errors.preferred_name || undefined}
          />
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("system:user.form.sectionStatus")}
          </label>
          <div className="space-y-2">
            <Checkbox
              checked={values.verified}
              onChange={(checked) => setValues((v) => ({ ...v, verified: checked }))}
              label={t("system:user.form.checkboxVerified")}
            />
            <Checkbox
              checked={values.is_active}
              onChange={(checked) => setValues((v) => ({ ...v, is_active: checked }))}
              label={t("system:user.form.checkboxActive")}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("system:user.form.sectionPermissions")}
          </label>
          <div className="space-y-2">
            <Checkbox
              checked={values.is_superuser}
              onChange={(checked) => setValues((v) => ({ ...v, is_superuser: checked }))}
              label={t("system:user.form.checkboxSuperUser")}
              disabled={!isSuperAdmin}
            />
            <Checkbox
              checked={values.is_admin}
              onChange={(checked) => setValues((v) => ({ ...v, is_admin: checked }))}
              label={t("system:user.form.checkboxAdmin")}
            />
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
