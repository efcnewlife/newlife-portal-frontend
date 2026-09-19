import { facilityService, type SurchargeItem } from "@/api/services/facilityService";
import ministryService, { type MinistryListItem } from "@/api/services/ministryService";
import { useEffect, useState } from "react";

export interface MinistrySurchargeOptions {
  ministries: MinistryListItem[];
  surcharges: SurchargeItem[];
}

/** Active Ministries and Surcharges shared by the Booking create and edit forms. */
export const useMinistrySurchargeOptions = (): MinistrySurchargeOptions => {
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [ministryRes, surchargeRes] = await Promise.all([
          ministryService.getMinistryList(),
          facilityService.listSurcharges(),
        ]);
        if (ministryRes.success) setMinistries((ministryRes.data.items || []).filter((m) => m.status === "active"));
        if (surchargeRes.success) setSurcharges((surchargeRes.data.items || []).filter((s) => s.isActive));
      } catch {
        setMinistries([]);
        setSurcharges([]);
      }
    })();
  }, []);

  return { ministries, surcharges };
};
