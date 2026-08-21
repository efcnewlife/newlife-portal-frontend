import type { LocaleItem } from "@/api/services/localeService";
import type { PositionTranslationInput, PositionTranslationItem } from "@/api/services/orgService";
import { POSITION_OFFICES, POSITION_TEAMS, type PositionOffice, type PositionTeam } from "@/const/positionEnums";
import { useActiveLocales } from "@/hooks/useActiveLocales";
import { get_default_locale_id } from "@/utils/localeResolve";
import { localeTabLabel } from "@/utils/translationForm";
import { Checkbox, Input, Select, Tabs, TextArea } from "@efcnewlife/newlife-ui";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export interface PositionTranslationFields {
  name: string;
  description: string;
  remark: string;
}

export type PositionTranslationMap = Record<string, PositionTranslationFields>;

export interface PositionFormValues {
  code: string;
  team?: PositionTeam;
  office?: PositionOffice;
  name?: string;
  canOwnMinistry?: boolean;
  isActive?: boolean;
  translations?: PositionTranslationItem[];
}

export interface PositionDataFormHandle {
  validate: () => boolean;
  getValues: () => PositionFormValues;
}

const createEmptyPositionTranslationMap = (locales: LocaleItem[]): PositionTranslationMap =>
  locales.reduce<PositionTranslationMap>((acc, locale) => {
    acc[locale.id] = { name: "", description: "", remark: "" };
    return acc;
  }, {});

const hydratePositionTranslationMap = (
  locales: LocaleItem[],
  existingTranslations?: PositionTranslationItem[],
  legacyFallback?: { name?: string }
): PositionTranslationMap => {
  const map = createEmptyPositionTranslationMap(locales);
  const default_locale_id = get_default_locale_id(locales);

  if (existingTranslations?.length) {
    for (const item of existingTranslations) {
      if (map[item.localeId]) {
        map[item.localeId] = {
          name: item.name || "",
          description: item.description || "",
          remark: item.remark || "",
        };
      }
    }
  }

  if (legacyFallback && default_locale_id && map[default_locale_id]) {
    const current = map[default_locale_id];
    map[default_locale_id] = {
      name: current.name || legacyFallback.name || "",
      description: current.description,
      remark: current.remark,
    };
  }

  return map;
};

const buildPositionTranslationPayload = (map: PositionTranslationMap): PositionTranslationInput[] =>
  Object.entries(map)
    .filter(([, fields]) => fields.name.trim())
    .map(([localeId, fields]) => ({
      localeId,
      name: fields.name.trim(),
      description: fields.description.trim() || undefined,
      remark: fields.remark.trim() || undefined,
    }));

const PositionDataForm = forwardRef<
  PositionDataFormHandle,
  { mode: "create" | "edit"; defaultValues?: Partial<PositionFormValues> | null }
>(function PositionDataForm({ mode, defaultValues }, ref) {
  const { t } = useTranslation("org");
  const { t: tCommon } = useTranslation("common");
  const { locales, defaultLocaleId, loading, error } = useActiveLocales();

  const [code, setCode] = useState(defaultValues?.code || "");
  const [team, setTeam] = useState<PositionTeam | "">(defaultValues?.team || "");
  const [office, setOffice] = useState<PositionOffice | "">(defaultValues?.office || "");
  const [canOwnMinistry, setCanOwnMinistry] = useState(defaultValues?.canOwnMinistry ?? false);
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);
  const [translationMap, setTranslationMap] = useState<PositionTranslationMap>({});
  const [activeTab, setActiveTab] = useState(defaultLocaleId || "");
  const [errors, setErrors] = useState<{ code?: string; team?: string; office?: string; name?: string }>({});

  const teamOptions = useMemo(
    () => [
      { value: "", label: t("position.form.selectTeam") },
      ...POSITION_TEAMS.map((value) => ({
        value,
        label: t(`position.enums.team.${value}`),
      })),
    ],
    [t]
  );

  const officeOptions = useMemo(
    () => [
      { value: "", label: t("position.form.selectOffice") },
      ...POSITION_OFFICES.map((value) => ({
        value,
        label: t(`position.enums.office.${value}`),
      })),
    ],
    [t]
  );

  useEffect(() => {
    if (locales.length === 0) return;
    setCode(defaultValues?.code || "");
    setTeam(defaultValues?.team || "");
    setOffice(defaultValues?.office || "");
    setCanOwnMinistry(defaultValues?.canOwnMinistry ?? false);
    setIsActive(defaultValues?.isActive ?? true);
    setTranslationMap(
      hydratePositionTranslationMap(locales, defaultValues?.translations, { name: defaultValues?.name })
    );
    setActiveTab(defaultLocaleId || locales[0]?.id || "");
  }, [defaultValues, defaultLocaleId, locales]);

  useEffect(() => {
    if (locales.length > 0 && Object.keys(translationMap).length === 0) {
      setTranslationMap(createEmptyPositionTranslationMap(locales));
    }
  }, [locales, translationMap]);

  const tabs = useMemo(
    () =>
      locales.map((locale) => ({
        value: locale.id,
        label: localeTabLabel(locale, locale.id === defaultLocaleId),
      })),
    [locales, defaultLocaleId]
  );

  const updateField = (localeId: string, field: keyof PositionTranslationFields, value: string) => {
    setTranslationMap((prev) => ({
      ...prev,
      [localeId]: {
        ...prev[localeId],
        [field]: value,
      },
    }));
  };

  const validate = (): boolean => {
    const next: { code?: string; team?: string; office?: string; name?: string } = {};
    if (mode === "create" && !code.trim()) next.code = t("position.form.codeRequired");
    if (!team) next.team = t("position.form.teamRequired");
    if (!office) next.office = t("position.form.officeRequired");
    if (defaultLocaleId) {
      const fields = translationMap[defaultLocaleId];
      if (!fields?.name?.trim()) next.name = t("position.form.nameRequired");
    } else {
      next.name = tCommon("translation.defaultLocaleRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  useImperativeHandle(ref, () => ({
    validate,
    getValues: () => ({
      code: code.trim(),
      team: team as PositionTeam,
      office: office as PositionOffice,
      canOwnMinistry,
      isActive,
      translations: buildPositionTranslationPayload(translationMap),
    }),
  }));

  const activeFields = translationMap[activeTab] || { name: "", description: "", remark: "" };

  return (
    <div className="space-y-4">
      {mode === "create" && (
        <Input
          id="position-code"
          label={t("position.form.code")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          id="position-team"
          label={t("position.form.team")}
          options={teamOptions}
          value={team}
          onChange={(v) => setTeam(String(v) as PositionTeam | "")}
          error={errors.team}
        />
        <Select
          id="position-office"
          label={t("position.form.office")}
          options={officeOptions}
          value={office}
          onChange={(v) => setOffice(String(v) as PositionOffice | "")}
          error={errors.office}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Checkbox
          id="position-can-own"
          label={t("position.form.canOwnMinistry")}
          checked={canOwnMinistry}
          onChange={setCanOwnMinistry}
        />
        <Checkbox id="position-active" label={t("shared.active")} checked={isActive} onChange={setIsActive} />
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">{tCommon("loading")}</p>
      ) : error || locales.length === 0 ? (
        <p className="text-sm text-error-500">{tCommon(error || "translation.loadLocalesFailed")}</p>
      ) : (
        <div className="space-y-3">
          <Tabs
            tabs={tabs}
            value={activeTab}
            onChange={setActiveTab}
            label={tCommon("translation.tabsLabel")}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id={`position-name-${activeTab}`}
              label={t("position.form.name")}
              value={activeFields.name}
              onChange={(e) => updateField(activeTab, "name", e.target.value)}
              error={activeTab === defaultLocaleId ? errors.name : undefined}
            />
            <div className="md:col-span-2">
              <TextArea
                id={`position-description-${activeTab}`}
                label={t("position.form.description")}
                value={activeFields.description}
                onChange={(fieldValue) => updateField(activeTab, "description", fieldValue)}
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PositionDataForm;
