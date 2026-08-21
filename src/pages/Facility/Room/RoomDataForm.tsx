import type { FacilityTranslationItem } from "@/api/services/facilityService";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
import { Checkbox, Input } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

export interface RoomFormValues {
  code: string;
  name?: string;
  roomNumber?: string;
  capacity?: number;
  isActive?: boolean;
  description?: string;
  translations?: FacilityTranslationItem[];
}

export interface RoomDataFormHandle {
  validate: () => boolean;
  getValues: () => RoomFormValues;
}

const RoomDataForm = forwardRef<
  RoomDataFormHandle,
  { mode: "create" | "edit"; defaultValues?: Partial<RoomFormValues> | null }
>(function RoomDataForm({ mode, defaultValues }, ref) {
  const { t } = useTranslation("facility");
  const { t: tCommon } = useTranslation("common");
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();

  const [code, setCode] = useState(defaultValues?.code || "");
  const [roomNumber, setRoomNumber] = useState(defaultValues?.roomNumber || "");
  const [capacity, setCapacity] = useState<string>(
    defaultValues?.capacity !== undefined ? String(defaultValues.capacity) : ""
  );
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [errors, setErrors] = useState<{ code?: string; name?: string }>({});

  useEffect(() => {
    if (locales.length === 0) return;
    setCode(defaultValues?.code || "");
    setRoomNumber(defaultValues?.roomNumber || "");
    setCapacity(defaultValues?.capacity !== undefined ? String(defaultValues.capacity) : "");
    setIsActive(defaultValues?.isActive ?? true);
    setTranslationMap(
      hydrateTranslationMap(locales, defaultValues?.translations, {
        name: defaultValues?.name,
        description: defaultValues?.description,
      })
    );
  }, [defaultValues, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const validate = (): boolean => {
    const next: { code?: string; name?: string } = {};
    if (mode === "create" && !code.trim()) next.code = t("room.form.codeRequired");
    const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
    if (name_error_key) next.name = tCommon(name_error_key);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  useImperativeHandle(ref, () => ({
    validate,
    getValues: () => {
      const translations = buildTranslationPayload(translationMap);
      return {
        code: code.trim(),
        roomNumber: roomNumber.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
        isActive,
        translations,
      };
    },
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {mode === "create" && (
          <div>
            <Input
              id="room-code"
              label={t("room.form.code")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={errors.code}
            />
          </div>
        )}
        <div>
          <Input
            id="room-number"
            label={t("room.form.roomNumber")}
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />
        </div>
        <div>
          <Input
            id="room-capacity"
            label={t("room.form.capacity")}
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            hint={t("room.form.capacityHint")}
          />
        </div>
      </div>
      <Checkbox id="room-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
      <TranslationTabsForm
        locales={locales}
        defaultLocaleId={defaultLocaleId}
        value={translationMap}
        onChange={setTranslationMap}
        fields={["name", "description"]}
        loading={loading}
        error={error}
        nameError={errors.name ? tCommon(errors.name) : undefined}
        labels={{
          name: t("room.form.name"),
          description: t("room.form.description"),
        }}
      />
    </div>
  );
});

export default RoomDataForm;
