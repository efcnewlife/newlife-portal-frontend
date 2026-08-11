import { Button, Checkbox, DatePicker, Input, Select, TimePicker } from "@efcnewlife/newlife-ui";
import type { RoomListItem } from "@/api/services/facilityService";
import { usePickerLabels } from "@/hooks/usePickerLabels";
import { apiDateToDayjs, apiTimeToDayjs, dayjsToApiDate, dayjsToApiTime } from "@/utils/dayjsApi";
import type { Dayjs } from "dayjs";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface RoomSlotTemplateFormValues {
  facilityId: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface RoomSlotTemplateDataFormHandle {
  validate: () => boolean;
  getValues: () => RoomSlotTemplateFormValues;
}

interface Props {
  defaultValues?: Partial<RoomSlotTemplateFormValues> | null;
  rooms: RoomListItem[];
  facilityLocked?: boolean;
}

const WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEKDAYS_PRESET = [0, 1, 2, 3, 4];
const EVERY_DAY_PRESET = [0, 1, 2, 3, 4, 5, 6];

const RoomSlotTemplateDataForm = forwardRef<RoomSlotTemplateDataFormHandle, Props>(function RoomSlotTemplateDataForm(
  { defaultValues, rooms, facilityLocked },
  ref
) {
  const { t } = useTranslation("facility");
  const pickerLabels = usePickerLabels();

  const [facilityId, setFacilityId] = useState(defaultValues?.facilityId || "");
  const [name, setName] = useState(defaultValues?.name || "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(defaultValues?.daysOfWeek ?? WEEKDAYS_PRESET);
  const [startTime, setStartTime] = useState<Dayjs | null>(() =>
    apiTimeToDayjs(defaultValues?.startTime || "09:00")
  );
  const [endTime, setEndTime] = useState<Dayjs | null>(() => apiTimeToDayjs(defaultValues?.endTime || "17:00"));
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(
    String(defaultValues?.slotDurationMinutes ?? 60)
  );
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [effectiveFrom, setEffectiveFrom] = useState<Dayjs | null>(() =>
    apiDateToDayjs(defaultValues?.effectiveFrom)
  );
  const [effectiveTo, setEffectiveTo] = useState<Dayjs | null>(() => apiDateToDayjs(defaultValues?.effectiveTo));
  const [errors, setErrors] = useState<{ name?: string; facilityId?: string; daysOfWeek?: string }>({});

  useEffect(() => {
    setFacilityId(defaultValues?.facilityId || "");
    setName(defaultValues?.name || "");
    setDaysOfWeek(defaultValues?.daysOfWeek ?? WEEKDAYS_PRESET);
    setStartTime(apiTimeToDayjs(defaultValues?.startTime || "09:00"));
    setEndTime(apiTimeToDayjs(defaultValues?.endTime || "17:00"));
    setSlotDurationMinutes(String(defaultValues?.slotDurationMinutes ?? 60));
    setIsActive(defaultValues?.isActive ?? true);
    setEffectiveFrom(apiDateToDayjs(defaultValues?.effectiveFrom));
    setEffectiveTo(apiDateToDayjs(defaultValues?.effectiveTo));
  }, [defaultValues]);

  const roomOptions = rooms.map((r) => ({
    value: r.id,
    label: r.name ? `${r.code} - ${r.name}` : r.code,
  }));

  const toggleDay = (day: number, checked: boolean) => {
    setDaysOfWeek((prev) => {
      if (checked) {
        return prev.includes(day) ? prev : [...prev, day].sort((a, b) => a - b);
      }
      return prev.filter((d) => d !== day);
    });
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: { name?: string; facilityId?: string; daysOfWeek?: string } = {};
      if (!facilityId) next.facilityId = t("rentalRate.form.facilityRequired");
      if (!name.trim()) next.name = t("roomSlotTemplate.form.nameRequired");
      if (daysOfWeek.length === 0) next.daysOfWeek = t("roomSlotTemplate.form.daysOfWeekRequired");
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      facilityId,
      name: name.trim(),
      daysOfWeek,
      startTime: dayjsToApiTime(startTime) || "09:00:00",
      endTime: dayjsToApiTime(endTime) || "17:00:00",
      slotDurationMinutes: Number(slotDurationMinutes),
      isActive,
      effectiveFrom: dayjsToApiDate(effectiveFrom),
      effectiveTo: dayjsToApiDate(effectiveTo),
    }),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div>
        <Select
          id="slot-facility"
          label={t("shared.selectRoom")}
          options={roomOptions}
          value={facilityId}
          disabled={facilityLocked}
          onChange={(v) => setFacilityId(String(v))}
          error={errors.facilityId}
        />
      </div>
      <div>
        <Input id="slot-name" label={t("roomSlotTemplate.form.name")} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      </div>
      <div className="md:col-span-2">
        <p className="text-sm font-medium text-gray-700 mb-2">{t("roomSlotTemplate.form.daysOfWeek")}</p>
        <div className="flex flex-wrap gap-3 mb-2">
          {WEEKDAY_VALUES.map((day) => (
            <Checkbox
              key={day}
              id={`slot-dow-${day}`}
              label={t(`roomSlotTemplate.days.${day}`)}
              checked={daysOfWeek.includes(day)}
              onChange={(checked) => toggleDay(day, checked)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button btnType="button" variant="outline" size="sm" onClick={() => setDaysOfWeek([...WEEKDAYS_PRESET])}>
            {t("roomSlotTemplate.weekdayPresets.weekdays")}
          </Button>
          <Button btnType="button" variant="outline" size="sm" onClick={() => setDaysOfWeek([...EVERY_DAY_PRESET])}>
            {t("roomSlotTemplate.weekdayPresets.everyDay")}
          </Button>
          <Button btnType="button" variant="outline" size="sm" onClick={() => setDaysOfWeek([])}>
            {t("roomSlotTemplate.weekdayPresets.clear")}
          </Button>
        </div>
        {errors.daysOfWeek ? <p className="text-sm text-red-600 mt-1">{errors.daysOfWeek}</p> : null}
      </div>
      <div>
        <TimePicker
          id="slot-start"
          label={t("roomSlotTemplate.form.startTime")}
          value={startTime}
          onChange={(value) => setStartTime(value)}
          clearable={false}
          labels={pickerLabels}
        />
      </div>
      <div>
        <TimePicker
          id="slot-end"
          label={t("roomSlotTemplate.form.endTime")}
          value={endTime}
          onChange={(value) => setEndTime(value)}
          clearable={false}
          labels={pickerLabels}
        />
      </div>
      <div>
        <Input
          id="slot-duration"
          label={t("roomSlotTemplate.form.slotDurationMinutes")}
          type="number"
          value={slotDurationMinutes}
          onChange={(e) => setSlotDurationMinutes(e.target.value)}
        />
      </div>
      <div>
        <DatePicker
          id="slot-from"
          label={t("roomSlotTemplate.form.effectiveFrom")}
          value={effectiveFrom}
          onChange={(value) => setEffectiveFrom(value)}
          showTodayButton={false}
          labels={pickerLabels}
        />
      </div>
      <div>
        <DatePicker
          id="slot-to"
          label={t("roomSlotTemplate.form.effectiveTo")}
          value={effectiveTo}
          onChange={(value) => setEffectiveTo(value)}
          showTodayButton={false}
          labels={pickerLabels}
        />
      </div>
      <div className="md:col-span-2">
        <Checkbox id="slot-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
      </div>
    </div>
  );
});

export default RoomSlotTemplateDataForm;
