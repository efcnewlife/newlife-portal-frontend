export const POSITION_TEAMS = ["elder_and_deacon", "pastoral_team"] as const;
export type PositionTeam = (typeof POSITION_TEAMS)[number];

export const POSITION_OFFICES = ["elder", "deacon", "pastor", "staff"] as const;
export type PositionOffice = (typeof POSITION_OFFICES)[number];
