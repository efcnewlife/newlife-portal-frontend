import { userService } from "@/api/services/userService";
import { Input, Select } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface PersonFormValues {
  legalName: string;
  userId?: string;
}

export interface PersonDataFormHandle {
  validate: () => boolean;
  getValues: () => PersonFormValues;
}

const PersonDataForm = forwardRef<
  PersonDataFormHandle,
  { mode: "create" | "edit"; defaultValues?: Partial<PersonFormValues> | null }
>(function PersonDataForm({ mode, defaultValues }, ref) {
  const { t } = useTranslation("member");
  const [legalName, setLegalName] = useState(defaultValues?.legalName || "");
  const [userId, setUserId] = useState(defaultValues?.userId || "");
  const [users, setUsers] = useState<Array<{ id: string; label: string }>>([]);
  const [errors, setErrors] = useState<{ legalName?: string }>({});

  useEffect(() => {
    setLegalName(defaultValues?.legalName || "");
    setUserId(defaultValues?.userId || "");
  }, [defaultValues]);

  useEffect(() => {
    void userService.getList({}).then((res) => {
      if (res.success) {
        const items = res.data?.items || [];
        setUsers(
          items.map((u) => ({
            id: u.id,
            label: u.displayName ? `${u.displayName} (${u.email || u.id})` : u.email || u.id,
          }))
        );
      }
    });
  }, []);

  const userOptions = useMemo(
    () => [{ value: "", label: t("person.form.noUser") }, ...users.map((u) => ({ value: u.id, label: u.label }))],
    [users, t]
  );

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: { legalName?: string } = {};
      if (!legalName.trim()) next.legalName = t("person.form.legalNameRequired");
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      legalName: legalName.trim(),
      userId: userId || undefined,
    }),
  }));

  return (
    <div className="space-y-4">
      <Input
        id="person-legal-name"
        label={t("person.form.legalName")}
        value={legalName}
        onChange={(e) => setLegalName(e.target.value)}
        error={errors.legalName}
      />
      <Select
        id="person-user"
        label={mode === "create" ? t("person.form.linkUser") : t("person.form.selectUser")}
        options={userOptions}
        value={userId}
        onChange={(v) => setUserId(String(v))}
      />
    </div>
  );
});

export default PersonDataForm;
