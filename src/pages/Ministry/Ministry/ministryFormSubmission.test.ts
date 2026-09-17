import { describe, expect, it, vi } from "vitest";
import type { TranslationMap } from "@/utils/translationForm";

// @/utils/translationForm transitively imports @/i18n, which reads localStorage at module load time.
vi.stubGlobal("localStorage", { getItem: () => "en" } as unknown as Storage);

const { buildMinistryFormPayload, validateMinistryFormFields } = await import("./ministryFormSubmission");

const t = (key: string) => key;

const valid_translation_map: TranslationMap = {
  "locale-1": { name: "Youth Ministry" },
};

describe("validateMinistryFormFields", () => {
  it("does not require a Ministry Type for a valid create submission", () => {
    const errors = validateMinistryFormFields(
      {
        translationMap: valid_translation_map,
        defaultLocaleId: "locale-1",
        members: [],
        showMembers: false,
        validateMembers: false,
      },
      t,
      t
    );
    expect(errors).toEqual({});
  });
});

describe("buildMinistryFormPayload", () => {
  it("does not send a Ministry Type for a valid create/edit submission", () => {
    const payload = buildMinistryFormPayload({
      ownerPositionId: "",
      targetAudienceIds: [],
      schedules: [],
      hasPriorityBooking: false,
      isActive: true,
      translationMap: valid_translation_map,
      members: [],
      showMembers: false,
    });
    expect(payload).not.toHaveProperty("ministryTypeId");
    expect(payload.translations).toEqual([{ localeId: "locale-1", name: "Youth Ministry" }]);
  });
});
