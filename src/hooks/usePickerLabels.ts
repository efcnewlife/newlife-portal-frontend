import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const usePickerLabels = () => {
  const { t } = useTranslation("common");
  return useMemo(
    () => ({
      clear: t("picker.clear"),
      today: t("picker.today"),
      submit: t("picker.submit"),
      cancel: t("picker.cancel"),
      now: t("picker.now"),
    }),
    [t]
  );
};
