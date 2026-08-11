import { ministryCatalogService, type MinistryCatalogItem } from "@/api/services/ministryCatalogService";
import type { MinistryScheduleItem } from "@/api/services/ministryService";
import { orgService, type AssignablePositionItem } from "@/api/services/orgService";
import TranslationTabsForm from "@/components/translation/TranslationTabsForm";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import MinistryMembersEditor, {
  type MinistryMemberDraft,
  validateMinistryMembers,
} from "@/pages/Ministry/components/MinistryMembersEditor";
import MinistrySchedulesEditor, {
  scheduleDraftToItem,
  scheduleItemToDraft,
  type MinistryScheduleDraft,
} from "@/pages/Ministry/components/MinistrySchedulesEditor";
import {
  buildTranslationPayload,
  createEmptyTranslationMap,
  hydrateTranslationMap,
  validateDefaultLocaleName,
  type TranslationMap,
} from "@/utils/translationForm";
import { Checkbox, Select } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const ALL_AGES_CODE = "all_ages";

export interface MinistryFormValues {
  name?: string;
  ownerPositionId?: string;
  ministryTypeId?: string;
  targetAudienceIds?: string[];
  schedules?: MinistryScheduleItem[];
  hasPriorityBooking?: boolean;
  isActive?: boolean;
  translations?: ReturnType<typeof buildTranslationPayload>;
  members?: MinistryMemberDraft[];
}

export interface MinistryDataFormHandle {
  validate: () => boolean;
  getValues: () => MinistryFormValues;
}

const MinistryDataForm = forwardRef<
  MinistryDataFormHandle,
  {
    mode: "create" | "edit";
    defaultValues?: Partial<MinistryFormValues> | null;
    showMembers?: boolean;
    validateMembers?: boolean;
  }
>(function MinistryDataForm({ mode, defaultValues, showMembers = false, validateMembers = false }, ref) {
  const { t } = useTranslation("ministry");
  const { t: tCommon } = useTranslation("common");
  const { t: tOrg } = useTranslation("org");
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();

  const [ownerPositionId, setOwnerPositionId] = useState(defaultValues?.ownerPositionId || "");
  const [ministryTypeId, setMinistryTypeId] = useState(defaultValues?.ministryTypeId || "");
  const [targetAudienceIds, setTargetAudienceIds] = useState<string[]>(defaultValues?.targetAudienceIds || []);
  const [schedules, setSchedules] = useState<MinistryScheduleDraft[]>(
    () => (defaultValues?.schedules || []).map(scheduleItemToDraft)
  );
  const [positions, setPositions] = useState<AssignablePositionItem[]>([]);
  const [ministryTypes, setMinistryTypes] = useState<MinistryCatalogItem[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<MinistryCatalogItem[]>([]);
  const [hasPriorityBooking, setHasPriorityBooking] = useState(defaultValues?.hasPriorityBooking ?? false);
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [translationMap, setTranslationMap] = useState<TranslationMap>({});
  const [members, setMembers] = useState<MinistryMemberDraft[]>(defaultValues?.members || []);
  const [errors, setErrors] = useState<{ name?: string; members?: string; ministryTypeId?: string }>({});

  useEffect(() => {
    void orgService.getAssignablePositions().then((res) => {
      if (res.success) setPositions(res.data.items || []);
    });
    void ministryCatalogService.getMinistryTypes().then((res) => {
      if (res.success) setMinistryTypes(res.data.items || []);
    });
    void ministryCatalogService.getTargetAudiences().then((res) => {
      if (res.success) setTargetAudiences(res.data.items || []);
    });
  }, []);

  useEffect(() => {
    if (locales.length === 0) return;
    setOwnerPositionId(defaultValues?.ownerPositionId || "");
    setMinistryTypeId(defaultValues?.ministryTypeId || "");
    setTargetAudienceIds(defaultValues?.targetAudienceIds || []);
    setSchedules((defaultValues?.schedules || []).map(scheduleItemToDraft));
    setHasPriorityBooking(defaultValues?.hasPriorityBooking ?? false);
    setIsActive(defaultValues?.isActive ?? true);
    setMembers(defaultValues?.members || []);
    setTranslationMap(
      hydrateTranslationMap(locales, defaultValues?.translations, {
        name: defaultValues?.name,
      }),
    );
  }, [defaultValues, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const positionOptions = useMemo(
    () => [
      { value: "", label: t("ministry.form.ownerPositionPlaceholder") },
      ...positions.map((p) => {
        const parts = [
          p.team ? tOrg(`position.enums.team.${p.team}`) : "",
          p.office ? tOrg(`position.enums.office.${p.office}`) : "",
          p.name,
        ].filter(Boolean);
        return {
          value: p.id,
          label: parts.join(" / ") || p.code,
        };
      }),
    ],
    [positions, t, tOrg],
  );

  const ministryTypeOptions = useMemo(
    () => [
      { value: "", label: t("ministry.form.ministryTypePlaceholder") },
      ...ministryTypes.map((item) => ({ value: item.id, label: item.name || item.code })),
    ],
    [ministryTypes, t],
  );

  const targetAudienceOptions = useMemo(
    () => targetAudiences.map((item) => ({ value: item.id, label: item.name || item.code })),
    [targetAudiences],
  );

  const handleTargetAudienceChange = (value: string | number | (string | number | null)[] | null) => {
    const raw = Array.isArray(value) ? value : value != null ? [value] : [];
    const selected = raw.filter((item) => item != null).map(String);
    const all_ages = targetAudiences.find((item) => item.code === ALL_AGES_CODE);
    if (all_ages && selected.includes(all_ages.id)) {
      setTargetAudienceIds([all_ages.id]);
      return;
    }
    setTargetAudienceIds(selected.filter((id) => id !== all_ages?.id));
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      const next: { name?: string; members?: string; ministryTypeId?: string } = {};
      const name_error_key = validateDefaultLocaleName(translationMap, defaultLocaleId);
      if (name_error_key) next.name = tCommon(name_error_key);
      if (!ministryTypeId) next.ministryTypeId = t("ministry.form.ministryTypeRequired");
      if (showMembers && validateMembers) {
        const member_error = validateMinistryMembers(members.filter((m) => m.userId), t);
        if (member_error) next.members = member_error;
      }
      setErrors(next);
      return Object.keys(next).length === 0;
    },
    getValues: () => {
      const translations = buildTranslationPayload(translationMap);
      return {
        ownerPositionId: ownerPositionId || undefined,
        ministryTypeId: ministryTypeId || undefined,
        targetAudienceIds,
        schedules: schedules.map(scheduleDraftToItem),
        hasPriorityBooking,
        isActive,
        translations,
        members: showMembers ? members.filter((m) => m.userId) : undefined,
      };
    },
  }));

  return (
    <div className="space-y-4">
      <TranslationTabsForm
        locales={locales}
        defaultLocaleId={defaultLocaleId}
        value={translationMap}
        onChange={setTranslationMap}
        fields={["name", "scheduleNote"]}
        loading={loading}
        error={error}
        nameError={errors.name ? tCommon(errors.name) : undefined}
        labels={{
          name: t("ministry.form.name"),
          scheduleNote: t("ministry.form.scheduleNote"),
        }}
      />
      <Select
        id="ministry-type"
        label={t("ministry.form.ministryTypeId")}
        options={ministryTypeOptions}
        value={ministryTypeId}
        onChange={(v) => setMinistryTypeId(String(v))}
        error={errors.ministryTypeId}
      />
      <Select
        id="ministry-target-audiences"
        label={t("ministry.form.targetAudiences")}
        options={targetAudienceOptions}
        value={targetAudienceIds}
        multiple
        onChange={handleTargetAudienceChange}
      />
      <MinistrySchedulesEditor value={schedules} onChange={setSchedules} />
      <Select
        id="ministry-owner-position"
        label={t("ministry.form.ownerPositionId")}
        options={positionOptions}
        value={ownerPositionId}
        onChange={(v) => setOwnerPositionId(String(v))}
      />
      <div className="flex flex-col gap-2">
        <Checkbox
          id="ministry-priority"
          label={t("ministry.form.hasPriorityBooking")}
          checked={hasPriorityBooking}
          onChange={setHasPriorityBooking}
        />
        <Checkbox id="ministry-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
      </div>
      {showMembers && mode === "edit" ? (
        <MinistryMembersEditor value={members} onChange={setMembers} error={errors.members} />
      ) : null}
    </div>
  );
});

export default MinistryDataForm;
