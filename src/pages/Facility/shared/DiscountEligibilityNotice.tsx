import type { UseDiscountEligibilityResult } from "./useDiscountEligibility";
import { useTranslation } from "react-i18next";

interface Props {
  eligibility: UseDiscountEligibilityResult;
}

const KIND_MESSAGE_KEY = {
  ministry: "discountEligibility.ministry",
  recurring: "discountEligibility.recurring",
  applied: "discountEligibility.applied",
  none: "discountEligibility.none",
} as const;

const DiscountEligibilityNotice = ({ eligibility }: Props) => {
  const { t } = useTranslation("facility");
  const className = "text-sm text-gray-600 dark:text-gray-300";
  const { hasBooker, loading, failed, display } = eligibility;

  if (!hasBooker) {
    return <p className={className}>{t("discountEligibility.selectBooker")}</p>;
  }
  if (loading) {
    return <p className={className}>{t("discountEligibility.checking")}</p>;
  }
  if (failed) {
    return <p className="text-sm text-error-500">{t("discountEligibility.failed")}</p>;
  }
  if (display.kind === "none") {
    return <p className={className}>{t(KIND_MESSAGE_KEY.none)}</p>;
  }
  return <p className={className}>{t(KIND_MESSAGE_KEY[display.kind], { percent: display.discountPercent })}</p>;
};

export default DiscountEligibilityNotice;
