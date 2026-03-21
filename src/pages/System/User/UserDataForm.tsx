import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Input from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import TextArea from "@/components/ui/textarea";
import { CountryCodes } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

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
  gender?: number; // 0: Unknown, 1: Male, 2: Female
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
  const [showPassword, setShowPassword] = useState(false);
  const { isSuperAdmin } = usePermissions();

  // Check whether the current user is superadmin
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
        remark: "",
      });
    }
  }, [defaultValues]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!values.phone_number || values.phone_number.trim().length === 0) {
      next.phone_number = "Please enter a phone number";
    }

    if ((values.phone_number.length > 1 && !/^[1-9]\d*$/.test(values.phone_number.slice(1))) || !values.phone_number.startsWith("+")) {
      next.phone_number = "Please enter a valid phone number";
    }

    if (!values.email || values.email.trim().length === 0) {
      next.email = "Please enter an email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Please enter a valid email address";
    }

    // Validate password fields in create mode
    if (mode === "create") {
      if (!values.password || values.password.trim().length === 0) {
        next.password = "Please enter a password";
      } else if (values.password.length < 8) {
        next.password = "Password must be at least 8 characters";
      }

      if (!values.password_confirm || values.password_confirm.trim().length === 0) {
        next.password_confirm = "Please confirm your password";
      } else if (values.password !== values.password_confirm) {
        next.password_confirm = "Passwords do not match";
      }
    }

    if (values.display_name && values.display_name.length > 64) {
      next.display_name = "Display name cannot exceed 64 characters";
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

    // Do not submit password fields in edit mode
    const submitValues = mode === "edit" ? { ...values, password: undefined, password_confirm: undefined } : values;

    await onSubmit(submitValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <PhoneInput
            countries={CountryCodes}
            id="phone_number"
            label="Phone Number"
            placeholder="Enter phone number"
            value={values.phone_number}
            onChange={(phoneNumber) => setValues((v) => ({ ...v, phone_number: phoneNumber }))}
            error={errors.phone_number || undefined}
            hint="Example: +886912345678"
            selectPosition="start"
            required
          />
        </div>

        <div>
          <Input
            id="email"
            label="Email"
            placeholder="Enter email address"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            error={errors.email || undefined}
            hint="Example: user@example.com"
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
              type={showPassword ? "text" : "password"}
              label="Password"
              icon={
                showPassword ? (
                  <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                )
              }
              iconPosition="right"
              iconClick={() => setShowPassword(!showPassword)}
              placeholder="Enter password"
              value={values.password || ""}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              error={errors.password || undefined}
              hint="At least 8 characters"
              required
            />
          </div>

          <div>
            <Input
              id="password_confirm"
              type={showPassword ? "text" : "password"}
              label="Confirm Password"
              icon={
                showPassword ? (
                  <MdVisibility className="fill-gray-500 dark:fill-gray-400 size-5" />
                ) : (
                  <MdVisibilityOff className="fill-gray-500 dark:fill-gray-400 size-5" />
                )
              }
              iconPosition="right"
              iconClick={() => setShowPassword(!showPassword)}
              placeholder="Re-enter password"
              value={values.password_confirm || ""}
              onChange={(e) => setValues((v) => ({ ...v, password_confirm: e.target.value }))}
              error={errors.password_confirm || undefined}
              hint="Must match the password"
              required
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="display_name"
            label="Display Name"
            type="text"
            placeholder="User display name"
            value={values.display_name || ""}
            onChange={(e) => setValues((v) => ({ ...v, display_name: e.target.value }))}
            error={errors.display_name || undefined}
          />
          {errors.display_name && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.display_name}</p>}
        </div>

        <div>
          <Select
            id="gender"
            label="Gender"
            placeholder="Select gender"
            options={[
              { value: 0, label: "Unknown" },
              { value: 1, label: "Male" },
              { value: 2, label: "Female" },
            ]}
            value={values.gender ?? 0}
            onChange={(value) => setValues((v) => ({ ...v, gender: Number(value) }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Settings</label>
          <div className="space-y-2">
            <Checkbox checked={values.verified} onChange={(checked) => setValues((v) => ({ ...v, verified: checked }))} label="Verified" />
            <Checkbox checked={values.is_active} onChange={(checked) => setValues((v) => ({ ...v, is_active: checked }))} label="Active" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permission Settings</label>
          <div className="space-y-2">
            <Checkbox
              checked={values.is_superuser}
              onChange={(checked) => setValues((v) => ({ ...v, is_superuser: checked }))}
              label="Superuser"
              disabled={!isSuperAdmin}
            />
            <Checkbox checked={values.is_admin} onChange={(checked) => setValues((v) => ({ ...v, is_admin: checked }))} label="Admin" />
          </div>
        </div>
      </div>

      <div>
        <TextArea
          id="remark"
          label="Remark"
          rows={3}
          placeholder="Additional notes"
          value={values.remark || ""}
          onChange={(value) => setValues((v) => ({ ...v, remark: value }))}
          error={errors.remark || undefined}
        />
        {errors.remark && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.remark}</p>}
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

export default UserDataForm;
