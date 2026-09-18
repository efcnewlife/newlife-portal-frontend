import { facilityService, type DiscountEligibilityResponse } from "@/api/services/facilityService";
import { useEffect, useState } from "react";
import {
  buildDiscountEligibilityRequest,
  discountEligibilityDisplay,
  type DiscountEligibilityBookingType,
  type DiscountEligibilityDisplay,
} from "./discountEligibility";

export interface UseDiscountEligibilityResult {
  display: DiscountEligibilityDisplay;
  loading: boolean;
  failed: boolean;
  hasBooker: boolean;
}

export const useDiscountEligibility = (
  bookingType: DiscountEligibilityBookingType,
  ministryId: string | null,
  userId: string
): UseDiscountEligibilityResult => {
  const [result, setResult] = useState<DiscountEligibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const request = buildDiscountEligibilityRequest({
      bookingType,
      ministryId,
      userId,
    });
    if (!request) {
      setResult(null);
      setLoading(false);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void facilityService
      .evaluateDiscountEligibility(request)
      .then((response) => {
        if (cancelled) return;
        if (response.success) {
          setResult(response.data);
          setFailed(false);
          return;
        }
        setResult(null);
        setFailed(true);
      })
      .catch(() => {
        if (cancelled) return;
        setResult(null);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookingType, ministryId, userId]);

  return {
    display: discountEligibilityDisplay(result),
    loading,
    failed,
    hasBooker: Boolean(userId),
  };
};
