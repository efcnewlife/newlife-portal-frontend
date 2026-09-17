import type { RecurringBookingConflict } from "@/api/services/facilityService";
import { DateUtil } from "@/utils/dateUtil";
import { groupRecurringConflictsByDate } from "./recurringSeriesConflicts";
import { Alert, Badge, Checkbox } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

interface RoomOption {
  id: string;
  code: string;
  name?: string;
}

interface RecurringSeriesConflictReviewProps {
  conflicts: RecurringBookingConflict[];
  excludedDates: string[];
  isPriorityMinistry: boolean;
  onToggleExcludeDate: (occurrenceDate: string) => void;
  rooms: RoomOption[];
  totalOccurrenceCount: number;
}

type ConflictBadgeColor = "success" | "warning" | "error" | "dark";

interface ConflictPresentation {
  badgeColor: ConflictBadgeColor;
  badgeKey: string;
  bodyKey: string;
}

const CONFLICT_PRESENTATION: Record<Exclude<RecurringBookingConflict["kind"], "occupancy">, ConflictPresentation> = {
  ministry: {
    badgeColor: "error",
    badgeKey: "bookingSeries.conflicts.kindMinistry",
    bodyKey: "bookingSeries.conflicts.kindMinistryBody",
  },
  blackout: {
    badgeColor: "dark",
    badgeKey: "bookingSeries.conflicts.kindBlackout",
    bodyKey: "bookingSeries.conflicts.kindBlackoutBody",
  },
  weekly_quota: {
    badgeColor: "warning",
    badgeKey: "bookingSeries.conflicts.kindWeeklyQuota",
    bodyKey: "bookingSeries.conflicts.kindWeeklyQuotaBody",
  },
};

const OCCUPANCY_PRESENTATION: Record<"overridable" | "blocked", ConflictPresentation> = {
  overridable: {
    badgeColor: "success",
    badgeKey: "bookingSeries.conflicts.kindOccupancyOverridable",
    bodyKey: "bookingSeries.conflicts.kindOccupancyOverridableBody",
  },
  blocked: {
    badgeColor: "warning",
    badgeKey: "bookingSeries.conflicts.kindOccupancyBlocked",
    bodyKey: "bookingSeries.conflicts.kindOccupancyBlockedBody",
  },
};

const roomNames = (facilityIds: string[], rooms: RoomOption[]): string =>
  facilityIds.map((id) => rooms.find((room) => room.id === id)?.name ?? id).join(", ");

const presentationForConflict = (conflict: RecurringBookingConflict): ConflictPresentation => {
  if (conflict.kind === "occupancy") {
    return OCCUPANCY_PRESENTATION[conflict.isOverridable ? "overridable" : "blocked"];
  }
  return CONFLICT_PRESENTATION[conflict.kind];
};

const RecurringSeriesConflictReview = ({
  conflicts,
  excludedDates,
  isPriorityMinistry,
  onToggleExcludeDate,
  rooms,
  totalOccurrenceCount,
}: RecurringSeriesConflictReviewProps) => {
  const { t } = useTranslation("facility");
  const groups = groupRecurringConflictsByDate(conflicts);
  const excluded = new Set(excludedDates);
  const remaining = totalOccurrenceCount - excludedDates.length;

  return (
    <div className="w-full space-y-4">
      <Alert
        message={
          isPriorityMinistry ? t("bookingSeries.conflicts.priorityIntro") : t("bookingSeries.conflicts.rentalIntro")
        }
        title={
          isPriorityMinistry ? t("bookingSeries.conflicts.priorityTitle") : t("bookingSeries.conflicts.rentalTitle")
        }
        variant={isPriorityMinistry ? "info" : "warning"}
        width="full"
      />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        {t("bookingSeries.conflicts.occurrenceSummary", { remaining, total: totalOccurrenceCount })}
      </p>
      <div className="space-y-3">
        {groups.map((group) => {
          const isExcluded = excluded.has(group.occurrenceDate);
          return (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700" key={group.occurrenceDate}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {DateUtil.format(group.occurrenceDate, "YYYY-MM-DD")}
                </p>
                <Checkbox
                  checked={isExcluded}
                  id={`bs-exclude-${group.occurrenceDate}`}
                  label={t("bookingSeries.conflicts.exclude")}
                  onChange={() => onToggleExcludeDate(group.occurrenceDate)}
                />
              </div>
              <ul className="mt-3 space-y-2">
                {group.conflicts.map((conflict, index) => {
                  const presentation = presentationForConflict(conflict);
                  return (
                    <li className="flex flex-col gap-1" key={`${group.occurrenceDate}-${conflict.kind}-${index}`}>
                      <div className="flex items-center gap-2">
                        <Badge color={presentation.badgeColor} size="sm">
                          {t(presentation.badgeKey)}
                        </Badge>
                        {conflict.facilityIds.length > 0 ? (
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {roomNames(conflict.facilityIds, rooms)}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t(presentation.bodyKey)}</p>
                      {conflict.kind === "ministry" &&
                      (conflict.ministryStewardDisplayName || conflict.ministryStewardEmail) ? (
                        <p className="text-sm text-gray-900 dark:text-white">
                          {t("bookingSeries.conflicts.stewardLabel")}{" "}
                          {[conflict.ministryStewardDisplayName, conflict.ministryStewardEmail]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {group.isBlocking && !isExcluded ? (
                <p className="mt-3 text-sm font-medium text-error-500" role="status">
                  {t("bookingSeries.conflicts.mustResolve")}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecurringSeriesConflictReview;
