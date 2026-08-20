type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const MINISTRY_STATUS_BADGE_COLOR: Record<string, BadgeColor> = {
  draft: "light",
  pending_approval: "warning",
  active: "success",
  rejected: "error",
  inactive: "dark",
};

export const ministryStatusBadgeColor = (status: string): BadgeColor => MINISTRY_STATUS_BADGE_COLOR[status] ?? "light";
