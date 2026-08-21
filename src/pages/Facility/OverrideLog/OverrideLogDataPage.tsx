import { facilityService, type OverrideLogItem } from "@/api/services/facilityService";
import type { DataTableColumn, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, DataPage } from "@/components/DataPage";
import { Resource } from "@/const/enums";
import { DateUtil } from "@/utils/dateUtil";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyApiError } from "@/utils/operationFeedback";

type LogRow = OverrideLogItem & Record<string, unknown>;

const OverrideLogDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getOverrideLogPages({
        page: currentPage - 1,
        page_size: pageSize,
      });
      if (res.success) {
        setItems((res.data.items || []) as LogRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const columns: DataTableColumn<LogRow>[] = useMemo(
    () => [
      { key: "facilityName", label: t("overrideLog.table.facility"), width: "w-36" },
      { key: "outcome", label: t("overrideLog.table.outcome"), width: "w-32" },
      { key: "reason", label: t("overrideLog.table.reason"), width: "w-48", overflow: true },
      { key: "overriddenByName", label: t("overrideLog.table.overriddenBy"), width: "w-36" },
      {
        key: "createdAt",
        label: t("overrideLog.table.createdAt"),
        width: "w-40",
        render: (v) => (v ? DateUtil.format(v as string) : ""),
      },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [CommonPageButton.REFRESH(() => void fetchPages())],
    [fetchPages]
  );

  return (
    <DataPage<LogRow>
      data={{ page: currentPage, pageSize, total, items }}
      columns={columns}
      loading={loading}
      resource={Resource.FacilityBookingOverrideLog}
      buttons={toolbarButtons}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={(s) => {
        setPageSize(s);
        setCurrentPage(1);
      }}
    />
  );
};

export default OverrideLogDataPage;
