import { Button, Checkbox, DatePicker, Input, Select, TimePicker } from "@efcnewlife/newlife-ui";
import type { RoomListItem } from "@/api/services/facilityService";
import { usePickerLabels } from "@/hooks/usePickerLabels";
import { apiDateToDayjs, apiTimeToDayjs, dayjsToApiDate, dayjsToApiTime } from "@/utils/dayjsApi";
import type { Dayjs } from "dayjs";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export type RoomBlackoutKind = "one_off" | "recurring";

export interface RoomBlackoutFormValues {
  facilityId: string | null;
  name: string;
  reason: string;
  kind: RoomBlackoutKind;
  blackoutDate?: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface RoomBlackoutDataFormHandle {
  validate: () => boolean;
  getValues: () => RoomBlackoutFormValues;
}

interface Props {
  defaultValues?: Partial<RoomBlackoutFormValues> | null;
  rooms: RoomListItem[];
}

const WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEKDAYS_PRESET = [0, 1, 2, 3, 4];
const EVERY_DAY_PRESET = [0, 1, 2, 3, 4, 5, 6];
const ALL_ROOMS_VALUE = "__all_rooms__";

const RoomBlackoutDataForm = forwardRef<RoomBlackoutDataFormHandle, Props>(function RoomBlackoutDataForm(
  { defaultValues, rooms },
  ref
) {
  const { t } = useTranslation("facility");
  const pickerLabels = usePickerLabels();

  const [facilityId, setFacilityId] = useState<string>(
    defaultValues?.facilityId === null || defaultValues?.facilityId === undefined
      ? ALL_ROOMS_VALUE
      : defaultValues.facilityId || ALL_ROOMS_VALUE
  );
  const [name, setName] = useState(defaultValues?.name || "");
  const [reason, setReason] = useState(defaultValues?.reason || "");
  const [kind, setKind] = useState<RoomBlackoutKind>(defaultValues?.kind || "one_off");
  const [blackoutDate, setBlackoutDate] = useState<Dayjs | null>(() => apiDateToDayjs(defaultValues?.blackoutDate));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(defaultValues?.daysOfWeek ?? WEEKDAYS_PRESET);
  const [startTime, setStartTime] = useState<Dayjs | null>(() => apiTimeToDayjs(defaultValues?.startTime || "09:00"));
  const [endTime, setEndTime] = useState<Dayjs | null>(() => apiTimeToDayjs(defaultValues?.endTime || "17:00"));
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [effectiveFrom, setEffectiveFrom] = useState<Dayjs | null>(() => apiDateToDayjs(defaultValues?.effectiveFrom));
  const [effectiveTo, setEffectiveTo] = useState<Dayjs | null>(() => apiDateToDayjs(defaultValues?.effectiveTo));
  const [errors, setErrors] = useState<{
    name?: string;
    reason?: string;
    daysOfWeek?: string;
    blackoutDate?: string;
  }>({});

  useEffect(() => {
    setFacilityId(
      defaultValues?.facilityId === null || defaultValues?.facilityId === undefined
        ? ALL_ROOMS_VALUE
        : defaultValues.facilityId || ALL_ROOMS_VALUE
    );
    setName(defaultValues?.name || "");
    setReason(defaultValues?.reason || "");
    setKind(defaultValues?.kind || "one_off");
    setBlackoutDate(apiDateToDayjs(defaultValues?.blackoutDate));
    setDaysOfWeek(defaultValues?.daysOfWeek ?? WEEKDAYS_PRESET);
    setStartTime(apiTimeToDayjs(defaultValues?.startTime || "09:00"));
    setEndTime(apiTimeToDayjs(defaultValues?.endTime || "17:00"));
    setIsActive(defaultValues?.isActive ?? true);
    setEffectiveFrom(apiDateToDayjs(defaultValues?.effectiveFrom));
    setEffectiveTo(apiDateToDayjs(defaultValues?.effectiveTo));
  }, [defaultValues]);

  const roomOptions = [
    { value: ALL_ROOMS_VALUE, label: t("roomBlackout.form.allRooms") },
    ...rooms.map((r) => ({
      value: r.id,
      label: r.name || r.code,
    })),
  ];

  const kindOptions = [
    { value: "one_off", label: t("roomBlackout.kind.one_off") },
    { value: "recurring", label: t("roomBlackout.kind.recurring") },
  ];

  const toggleDay = (day: number, checked: boolean) => {
    setDaysOfWeek((prev) => {
      if (checked) {
        return prev.includes(day) ? prev : [...prev, day].sort((a, b) => a - b);
      }
      return prev.filter((d) => d !== day);
    });
  };

  const applyAllDay = () => {
    setStartTime(apiTimeToDayjs("00:00:00"));
    setEndTime(apiTimeToDayjs("23:59:00"));
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: { name?: string; reason?: string; daysOfWeek?: string; blackoutDate?: string } = {};
      if (!name.trim()) next.name = t("roomBlackout.form.nameRequired");
      if (!reason.trim()) next.reason = t("roomBlackout.form.reasonRequired");
      if (kind === "one_off" && !blackoutDate) next.blackoutDate = t("roomBlackout.form.blackoutDateRequired");
      if (kind === "recurring" && daysOfWeek.length === 0) {
        next.daysOfWeek = t("roomBlackout.form.daysOfWeekRequired");
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => ({
      facilityId: facilityId === ALL_ROOMS_VALUE ? null : facilityId,
      name: name.trim(),
      reason: reason.trim(),
      kind,
      blackoutDate: kind === "one_off" ? dayjsToApiDate(blackoutDate) : undefined,
      daysOfWeek: kind === "recurring" ? daysOfWeek : [],
      startTime: dayjsToApiTime(startTime) || "09:00:00",
      endTime: dayjsToApiTime(endTime) || "17:00:00",
      isActive,
      effectiveFrom: kind === "recurring" ? dayjsToApiDate(effectiveFrom) : undefined,
      effectiveTo: kind === "recurring" ? dayjsToApiDate(effectiveTo) : undefined,
    }),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div>
        <Select
          id="blackout-facility"
          label={t("shared.selectRoom")}
          options={roomOptions}
          value={facilityId}
          onChange={(v) => setFacilityId(String(v))}
        />
      </div>
      <div>
        <Select
          id="blackout-kind"
          label={t("roomBlackout.form.kind")}
          options={kindOptions}
          value={kind}
          onChange={(v) => setKind(String(v) as RoomBlackoutKind)}
        />
      </div>
      <div>
        <Input
          id="blackout-name"
          label={t("roomBlackout.form.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
      </div>
      <div>
        <Input
          id="blackout-reason"
          label={t("roomBlackout.form.reason")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={errors.reason}
        />
      </div>
      {kind === "one_off" ? (
        <div>
          <DatePicker
            id="blackout-date"
            label={t("roomBlackout.form.blackoutDate")}
            value={blackoutDate}
            onChange={(value) => setBlackoutDate(value)}
            showTodayButton={false}
            labels={pickerLabels}
            error={errors.blackoutDate}
          />
        </div>
      ) : (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-700 mb-2">{t("roomBlackout.form.daysOfWeek")}</p>
          <div className="flex flex-wrap gap-3 mb-2">
            {WEEKDAY_VALUES.map((day) => (
              <Checkbox
                key={day}
                id={`blackout-dow-${day}`}
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
      )}
      <div>
        <TimePicker
          id="blackout-start"
          label={t("roomBlackout.form.startTime")}
          value={startTime}
          onChange={(value) => setStartTime(value)}
          clearable={false}
          minuteStep={15}
          ampm
          labels={pickerLabels}
        />
      </div>
      <div>
        <TimePicker
          id="blackout-end"
          label={t("roomBlackout.form.endTime")}
          value={endTime}
          onChange={(value) => setEndTime(value)}
          clearable={false}
          minuteStep={15}
          ampm
          labels={pickerLabels}
        />
      </div>
      <div className="md:col-span-2">
        <Button btnType="button" variant="outline" size="sm" onClick={applyAllDay}>
          {t("roomBlackout.form.allDay")}
        </Button>
      </div>
      {kind === "recurring" ? (
        <>
          <div>
            <DatePicker
              id="blackout-from"
              label={t("roomBlackout.form.effectiveFrom")}
              value={effectiveFrom}
              onChange={(value) => setEffectiveFrom(value)}
              showTodayButton={false}
              labels={pickerLabels}
            />
          </div>
          <div>
            <DatePicker
              id="blackout-to"
              label={t("roomBlackout.form.effectiveTo")}
              value={effectiveTo}
              onChange={(value) => setEffectiveTo(value)}
              showTodayButton={false}
              labels={pickerLabels}
            />
          </div>
        </>
      ) : null}
      <div className="md:col-span-2">
        <Checkbox id="blackout-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
      </div>
    </div>
  );
});

export default RoomBlackoutDataForm;
