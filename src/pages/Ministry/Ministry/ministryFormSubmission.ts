import type { MinistryScheduleItem } from "@/api/services/ministryService";
import type { MinistryMemberDraft } from "@/pages/Ministry/components/MinistryMembersEditor";
import { validateMinistryMembers } from "@/pages/Ministry/components/ministryMemberDraft";
import { buildTranslationPayload, validateDefaultLocaleName, type TranslationMap } from "@/utils/translationForm";

export interface MinistryFormValues {
  name?: string;
  ownerPositionId?: string;
  targetAudienceIds?: string[];
  schedules?: MinistryScheduleItem[];
  hasPriorityBooking?: boolean;
  isActive?: boolean;
  translations?: ReturnType<typeof buildTranslationPayload>;
  members?: MinistryMemberDraft[];
}

interface MinistryFormFields {
  translationMap: TranslationMap;
  members: MinistryMemberDraft[];
  showMembers: boolean;
}

export interface MinistryFormValidationInput extends MinistryFormFields {
  defaultLocaleId?: string;
  validateMembers: boolean;
}

export const validateMinistryFormFields = (
  input: MinistryFormValidationInput,
  t: (key: string) => string,
  tCommon: (key: string) => string
): { name?: string; members?: string } => {
  const errors: { name?: string; members?: string } = {};
  const name_error_key = validateDefaultLocaleName(input.translationMap, input.defaultLocaleId);
  if (name_error_key) errors.name = tCommon(name_error_key);
  if (input.showMembers && input.validateMembers) {
    const member_error = validateMinistryMembers(
      input.members.filter((m) => m.userId),
      t
    );
    if (member_error) errors.members = member_error;
  }
  return errors;
};

export interface MinistryFormPayloadInput extends MinistryFormFields {
  ownerPositionId: string;
  targetAudienceIds: string[];
  schedules: MinistryScheduleItem[];
  hasPriorityBooking: boolean;
  isActive: boolean;
}

export const buildMinistryFormPayload = (input: MinistryFormPayloadInput): MinistryFormValues => ({
  ownerPositionId: input.ownerPositionId || undefined,
  targetAudienceIds: input.targetAudienceIds,
  schedules: input.schedules,
  hasPriorityBooking: input.hasPriorityBooking,
  isActive: input.isActive,
  translations: buildTranslationPayload(input.translationMap),
  members: input.showMembers ? input.members.filter((m) => m.userId) : undefined,
});
