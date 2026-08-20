import type { AssignablePositionItem } from "@/api/services/orgService";

export const formatPositionLabel = (position: AssignablePositionItem, tOrg: (key: string) => string): string => {
  const parts = [
    position.team ? tOrg(`position.enums.team.${position.team}`) : "",
    position.office ? tOrg(`position.enums.office.${position.office}`) : "",
    position.name,
  ].filter(Boolean);
  return parts.join(" / ") || position.code;
};
