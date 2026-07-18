import type { RateApplicabilityRule } from "@/api/services/facilityService";
import type { TFunction } from "i18next";

export type ApplicabilityMode = "always" | "hours_lt" | "hours_gte" | "hours_range";

export interface ApplicabilityDraft {
  mode: ApplicabilityMode;
  hours: string;
  minHours: string;
  maxHours: string;
  maxExclusive: boolean;
}

export const DEFAULT_APPLICABILITY_DRAFT: ApplicabilityDraft = {
  mode: "always",
  hours: "5",
  minHours: "0",
  maxHours: "5",
  maxExclusive: true,
};

function unwrapLeaf(rule: RateApplicabilityRule | null | undefined): Record<string, unknown> | null {
  if (!rule || typeof rule !== "object") return null;
  if ("all" in rule && Array.isArray(rule.all) && rule.all.length === 1) {
    return unwrapLeaf(rule.all[0]);
  }
  if ("op" in rule) return rule as Record<string, unknown>;
  return null;
}

export function hydrateApplicabilityDraft(
  rule: RateApplicabilityRule | null | undefined,
): ApplicabilityDraft {
  if (rule == null) return { ...DEFAULT_APPLICABILITY_DRAFT };
  const leaf = unwrapLeaf(rule);
  if (!leaf || typeof leaf.op !== "string") {
    return { ...DEFAULT_APPLICABILITY_DRAFT, mode: "always" };
  }
  if (leaf.op === "hours_lt") {
    return {
      ...DEFAULT_APPLICABILITY_DRAFT,
      mode: "hours_lt",
      hours: String(leaf.value ?? "5"),
    };
  }
  if (leaf.op === "hours_gte") {
    return {
      ...DEFAULT_APPLICABILITY_DRAFT,
      mode: "hours_gte",
      hours: String(leaf.value ?? "5"),
    };
  }
  if (leaf.op === "hours_range") {
    return {
      ...DEFAULT_APPLICABILITY_DRAFT,
      mode: "hours_range",
      minHours: String(leaf.min ?? "0"),
      maxHours: String(leaf.max ?? "5"),
      maxExclusive: leaf.max_exclusive !== false,
    };
  }
  return { ...DEFAULT_APPLICABILITY_DRAFT };
}

export function serializeApplicabilityDraft(
  draft: ApplicabilityDraft,
): RateApplicabilityRule | null {
  if (draft.mode === "always") return null;
  if (draft.mode === "hours_lt") {
    return { all: [{ op: "hours_lt", value: Number(draft.hours) }] };
  }
  if (draft.mode === "hours_gte") {
    return { all: [{ op: "hours_gte", value: Number(draft.hours) }] };
  }
  return {
    all: [
      {
        op: "hours_range",
        min: Number(draft.minHours),
        max: Number(draft.maxHours),
        max_exclusive: draft.maxExclusive,
      },
    ],
  };
}

export function prefillDraftForBillingUnit(billingUnit: string): ApplicabilityDraft {
  if (billingUnit === "hourly") {
    return { ...DEFAULT_APPLICABILITY_DRAFT, mode: "hours_lt", hours: "5" };
  }
  if (billingUnit === "daily_flat") {
    return { ...DEFAULT_APPLICABILITY_DRAFT, mode: "hours_gte", hours: "5" };
  }
  return { ...DEFAULT_APPLICABILITY_DRAFT };
}

export function validateApplicabilityDraft(
  draft: ApplicabilityDraft,
  t: TFunction,
): string | undefined {
  if (draft.mode === "hours_lt" || draft.mode === "hours_gte") {
    if (draft.hours === "" || Number.isNaN(Number(draft.hours))) {
      return t("rentalRate.form.hoursRequired");
    }
  }
  if (draft.mode === "hours_range") {
    const min = Number(draft.minHours);
    const max = Number(draft.maxHours);
    if (
      draft.minHours === "" ||
      draft.maxHours === "" ||
      Number.isNaN(min) ||
      Number.isNaN(max)
    ) {
      return t("rentalRate.form.hoursRequired");
    }
    if (min >= max) return t("rentalRate.form.rangeInvalid");
  }
  return undefined;
}

export function formatApplicabilitySummary(
  rule: RateApplicabilityRule | null | undefined,
  t: TFunction,
): string {
  if (rule == null) return t("rentalRate.applicability.summary.always");
  const leaf = unwrapLeaf(rule);
  if (!leaf || typeof leaf.op !== "string") {
    return t("rentalRate.applicability.summary.unknown");
  }
  if (leaf.op === "hours_lt") {
    return t("rentalRate.applicability.summary.hoursLt", { hours: leaf.value });
  }
  if (leaf.op === "hours_gte") {
    return t("rentalRate.applicability.summary.hoursGte", { hours: leaf.value });
  }
  if (leaf.op === "hours_range") {
    return t("rentalRate.applicability.summary.hoursRange", {
      min: leaf.min ?? 0,
      max: leaf.max,
    });
  }
  return t("rentalRate.applicability.summary.unknown");
}

export function formatApplicabilityPreview(draft: ApplicabilityDraft, t: TFunction): string {
  return formatApplicabilitySummary(serializeApplicabilityDraft(draft), t);
}
