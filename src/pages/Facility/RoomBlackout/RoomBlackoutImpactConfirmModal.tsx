import type { RoomBlackoutImpactOccurrence } from "@/api/services/facilityService";
import { DateUtil } from "@/utils/dateUtil";
import { groupBlackoutImpactBySeries, isMinistrySeriesImpact } from "./roomBlackoutImpact";
import { Alert, Badge, Button, Modal } from "@efcnewlife/newlife-ui";
import { useTranslation } from "react-i18next";

interface RoomOption {
  id: string;
  code: string;
  name?: string;
}

interface RoomBlackoutImpactConfirmModalProps {
  isOpen: boolean;
  items: RoomBlackoutImpactOccurrence[];
  rooms: RoomOption[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const roomNames = (facilityIds: string[], rooms: RoomOption[]): string =>
  facilityIds.map((id) => rooms.find((room) => room.id === id)?.name ?? id).join(", ");

const RoomBlackoutImpactConfirmModal = ({
  isOpen,
  items,
  rooms,
  submitting,
  onClose,
  onConfirm,
}: RoomBlackoutImpactConfirmModalProps) => {
  const { t } = useTranslation(["facility", "common"]);
  const groups = groupBlackoutImpactBySeries(items);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("roomBlackout.impact.title")}
      className="max-w-2xl w-full mx-4 p-6"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm} disabled={submitting}>
            {t("roomBlackout.impact.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert
          variant="warning"
          width="full"
          title={t("roomBlackout.impact.alertTitle", { count: items.length })}
          message={t("roomBlackout.impact.alertBody")}
        />
        <div className="space-y-3">
          {groups.map((group) => (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700" key={group.seriesId}>
              <p className="font-semibold text-gray-900 dark:text-white">
                {t("roomBlackout.impact.series", { id: group.seriesId })}
              </p>
              <ul className="mt-2 space-y-2">
                {group.items.map((item) => (
                  <li
                    className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                    key={item.id}
                  >
                    <Badge color={isMinistrySeriesImpact(item) ? "warning" : "dark"} size="sm">
                      {t(isMinistrySeriesImpact(item) ? "roomBlackout.impact.ministry" : "roomBlackout.impact.rental")}
                    </Badge>
                    <span>
                      {DateUtil.format(item.startAt)} – {DateUtil.format(item.endAt, "hh:mm A")}
                    </span>
                    {item.facilityIds.length > 0 ? <span>{roomNames(item.facilityIds, rooms)}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default RoomBlackoutImpactConfirmModal;
