import type { MinistryScheduleItem } from "@/api/services/ministryService";
import { Button, Checkbox, Input } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

const WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const;

const emptySchedule = (): MinistryScheduleItem => ({
  daysOfWeek: [],
});

interface MinistrySchedulesEditorProps {
  value: MinistryScheduleItem[];
  onChange: (schedules: MinistryScheduleItem[]) => void;
  error?: string;
}

const MinistrySchedulesEditor = ({ value, onChange, error }: MinistrySchedulesEditorProps) => {
  const { t } = useTranslation("ministry");

  const toggleDay = (index: number, day: number, checked: boolean) => {
    const next = value.map((item, i) => {
      if (i !== index) return item;
      const days = item.daysOfWeek || [];
      const days_of_week = checked
        ? [...new Set([...days, day])].sort((a, b) => a - b)
        : days.filter((d) => d !== day);
      return { ...item, daysOfWeek: days_of_week };
    });
    onChange(next);
  };

  const updateSchedule = (index: number, patch: Partial<MinistryScheduleItem>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addSchedule = () => onChange([...value, emptySchedule()]);
  const removeSchedule = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("ministry.form.schedules")}</p>
        <Button variant="outline" size="sm" onClick={addSchedule}>
          {t("ministry.schedule.add")}
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {value.length === 0 ? (
        <p className="text-sm text-gray-500">{t("ministry.schedule.empty")}</p>
      ) : (
        value.map((schedule, index) => (
          <div key={`schedule-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">{t("ministry.schedule.row", { index: index + 1 })}</p>
              <Button variant="outline" size="sm" onClick={() => removeSchedule(index)}>
                {t("ministry.schedule.remove")}
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t("ministry.schedule.daysOfWeek")}</p>
              <div className="flex flex-wrap gap-3">
                {WEEKDAY_VALUES.map((day) => (
                  <Checkbox
                    key={day}
                    id={`ministry-schedule-dow-${index}-${day}`}
                    label={t(`ministry.schedule.days.${day}`)}
                    checked={(schedule.daysOfWeek || []).includes(day)}
                    onChange={(checked) => toggleDay(index, day, checked)}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500">{t("ministry.schedule.timeOptionalHint")}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id={`ministry-schedule-start-${index}`}
                label={t("ministry.schedule.startTime")}
                type="time"
                value={(schedule.startTime || "").slice(0, 5)}
                onChange={(e) =>
                  updateSchedule(index, {
                    startTime: e.target.value ? (e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value) : undefined,
                  })
                }
              />
              <Input
                id={`ministry-schedule-end-${index}`}
                label={t("ministry.schedule.endTime")}
                type="time"
                value={(schedule.endTime || "").slice(0, 5)}
                onChange={(e) =>
                  updateSchedule(index, {
                    endTime: e.target.value ? (e.target.value.length === 5 ? `${e.target.value}:00` : e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id={`ministry-schedule-from-${index}`}
                label={t("ministry.schedule.effectiveFrom")}
                type="date"
                value={schedule.effectiveFrom || ""}
                onChange={(e) => updateSchedule(index, { effectiveFrom: e.target.value || undefined })}
              />
              <Input
                id={`ministry-schedule-to-${index}`}
                label={t("ministry.schedule.effectiveTo")}
                type="date"
                value={schedule.effectiveTo || ""}
                onChange={(e) => updateSchedule(index, { effectiveTo: e.target.value || undefined })}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MinistrySchedulesEditor;
