import { Gender } from "@/const/enums";
import { Button, Input, Select, TextArea } from "newlife-ui";
import { useEffect, useState } from "react";

export interface DemoFormValues {
  id?: string;
  name: string;
  remark?: string;
  age?: number;
  gender?: Gender;
}

interface DemoDataFormProps {
  mode: "create" | "edit";
  defaultValues?: DemoFormValues | null;
  onSubmit: (values: DemoFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitting?: boolean;
}

const DemoDataForm: React.FC<DemoDataFormProps> = ({ mode, defaultValues, onSubmit, onCancel, submitting }) => {
  const [values, setValues] = useState<DemoFormValues>({ name: "", remark: "", age: undefined, gender: Gender.Unknown });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (defaultValues) {
      setValues({
        id: defaultValues.id,
        name: defaultValues.name || "",
        remark: defaultValues.remark || "",
        age: defaultValues.age,
        gender: defaultValues.gender ?? Gender.Unknown,
      });
    } else {
      setValues({ name: "", remark: "", age: undefined, gender: Gender.Unknown });
    }
  }, [defaultValues]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!values.name || values.name.trim().length === 0) next.name = "Please enter a name";
    if (values.age !== undefined && (values.age < 0 || values.age > 150)) next.age = "Age must be between 0 and 150";
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
      <div>
        <Input
          id="demo-name"
          label="Name"
          type="text"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          error={errors.name}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            id="demo-age"
            type="number"
            value={values.age ?? ""}
            label="Age"
            onChange={(e) => setValues((v) => ({ ...v, age: e.target.value === "" ? undefined : Number(e.target.value) }))}
            error={errors.age}
          />
        </div>
        <div>
          <Select
            id="demo-gender"
            label="Gender"
            options={[
              { value: Gender.Unknown, label: "Unknown" },
              { value: Gender.Male, label: "Male" },
              { value: Gender.Female, label: "Female" },
            ]}
            value={values.gender ?? Gender.Unknown}
            onChange={(value) => setValues((v) => ({ ...v, gender: Number(value) as Gender }))}
            placeholder="Please select gender"
          />
        </div>
      </div>

      <div>
        <TextArea id="demo-remark" rows={3} label="Remark" value={values.remark || ""} onChange={(value) => setValues((v) => ({ ...v, remark: value }))} />
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

export default DemoDataForm;
