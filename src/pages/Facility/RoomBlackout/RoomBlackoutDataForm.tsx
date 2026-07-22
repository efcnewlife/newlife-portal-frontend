import { Button, Checkbox, Input, Select } from "@efcnewlife/newlife-ui";
import type { RoomListItem } from "@/api/services/facilityService";
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
  const [facilityId, setFacilityId] = useState<string>(
    defaultValues?.facilityId === null || defaultValues?.facilityId === undefined
      ? ALL_ROOMS_VALUE
      : defaultValues.facilityId || ALL_ROOMS_VALUE
  );
  const [name, setName] = useState(defaultValues?.name || "");
  const [reason, setReason] = useState(defaultValues?.reason || "");
  const [kind, setKind] = useState<RoomBlackoutKind>(defaultValues?.kind || "one_off");
  const [blackoutDate, setBlackoutDate] = useState(defaultValues?.blackoutDate || "");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(defaultValues?.daysOfWeek ?? WEEKDAYS_PRESET);
  const [startTime, setStartTime] = useState(defaultValues?.startTime?.slice(0, 5) || "09:00");
  const [endTime, setEndTime] = useState(defaultValues?.endTime?.slice(0, 5) || "17:00");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [effectiveFrom, setEffectiveFrom] = useState(defaultValues?.effectiveFrom || "");
  const [effectiveTo, setEffectiveTo] = useState(defaultValues?.effectiveTo || "");
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
    setBlackoutDate(defaultValues?.blackoutDate || "");
    setDaysOfWeek(defaultValues?.daysOfWeek ?? WEEKDAYS_PRESET);
    setStartTime(defaultValues?.startTime?.slice(0, 5) || "09:00");
    setEndTime(defaultValues?.endTime?.slice(0, 5) || "17:00");
    setIsActive(defaultValues?.isActive ?? true);
    setEffectiveFrom(defaultValues?.effectiveFrom || "");
    setEffectiveTo(defaultValues?.effectiveTo || "");
  }, [defaultValues]);

  const roomOptions = [
    { value: ALL_ROOMS_VALUE, label: t("roomBlackout.form.allRooms") },
    ...rooms.map((r) => ({
      value: r.id,
      label: r.name ? `${r.code} - ${r.name}` : r.code,
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
    setStartTime("00:00");
    setEndTime("23:59");
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
      blackoutDate: kind === "one_off" ? blackoutDate || undefined : undefined,
      daysOfWeek: kind === "recurring" ? daysOfWeek : [],
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      isActive,
      effectiveFrom: kind === "recurring" ? effectiveFrom || undefined : undefined,
      effectiveTo: kind === "recurring" ? effectiveTo || undefined : undefined,
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
          <Input
            id="blackout-date"
            label={t("roomBlackout.form.blackoutDate")}
            type="date"
            value={blackoutDate}
            onChange={(e) => setBlackoutDate(e.target.value)}
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
        <Input
          id="blackout-start"
          label={t("roomBlackout.form.startTime")}
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div>
        <Input
          id="blackout-end"
          label={t("roomBlackout.form.endTime")}
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
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
            <Input
              id="blackout-from"
              label={t("roomBlackout.form.effectiveFrom")}
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
          <div>
            <Input
              id="blackout-to"
              label={t("roomBlackout.form.effectiveTo")}
              type="date"
              value={effectiveTo}
              onChange={(e) => setEffectiveTo(e.target.value)}
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
