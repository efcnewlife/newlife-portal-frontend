import { facilityService } from "@/api/services/facilityService";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const useRoomListOptions = () => {
  const { t } = useTranslation("facility");
  const [rooms, setRooms] = useState<Array<{ id: string; code: string; name?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await facilityService.getRoomList();
        if (res.success) {
          setRooms(res.data.items || []);
        } else {
          setRooms([]);
        }
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const roomOptions = useMemo(
    () => [
      { value: "", label: t("shared.allRooms") },
      ...rooms.map((room) => ({
        value: room.id,
        label: room.name || room.code,
      })),
    ],
    [rooms, t],
  );

  const roomLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) {
      map.set(room.id, room.name || room.code);
    }
    return map;
  }, [rooms]);

  return { rooms, roomOptions, roomLabelById, loading };
};
