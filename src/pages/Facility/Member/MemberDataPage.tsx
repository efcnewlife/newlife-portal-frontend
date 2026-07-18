import { facilityService, type MemberListItem } from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { Modal, Tooltip } from "@efcnewlife/newlife-ui";
import { Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type MemberRow = MemberListItem & Record<string, unknown>;

const MemberDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<MemberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<MemberRow | null>(null);
  const { isOpen, openModal, closeModal } = useModal(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getMemberPages({
        page: currentPage - 1,
        page_size: pageSize,
      });
      if (res.success) {
        setItems((res.data.items || []) as MemberRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      }
    } catch {
      alert(t("shared.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const columns: DataTableColumn<MemberRow>[] = useMemo(
    () => [
      { key: "email", label: t("member.table.email"), width: "w-48" },
      { key: "displayName", label: t("member.table.displayName"), width: "w-40" },
      {
        key: "ministries",
        label: t("member.table.ministries"),
        width: "w-56",
        render: (_, row) => {
          const labels = (row.ministries || []).map((m) => m.name || m.code).join(", ");
          return (
            <Tooltip content={labels}>
              <span className="truncate block max-w-[14rem]">{labels || "-"}</span>
            </Tooltip>
          );
        },
      },
      {
        key: "lastLoginAt",
        label: t("member.table.lastLoginAt"),
        width: "w-40",
        render: (v) => (v ? DateUtil.format(v as string) : t("system:shared.neverLoggedIn", { ns: "system", defaultValue: "-" })),
      },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(() => [CommonPageButton.REFRESH(() => void fetchPages())], [fetchPages]);

  const rowActions: MenuButtonType<MemberRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        const res = await facilityService.getMemberById(row.id);
        if (res.success) {
          setViewing(res.data as MemberRow);
          openModal();
        }
      }),
    ],
    [openModal]
  );

  return (
    <>
      <DataPage<MemberRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.FacilityMember}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      <Modal isOpen={isOpen} onClose={closeModal} title={t("member.modal.detailTitle")} className="max-w-lg mx-4 p-6">
        {viewing && (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">{t("member.table.email")}</dt>
              <dd>{viewing.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t("member.table.displayName")}</dt>
              <dd>{viewing.displayName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t("member.table.ministries")}</dt>
              <dd>{(viewing.ministries || []).map((m) => m.name || m.code).join(", ") || "-"}</dd>
            </div>
          </dl>
        )}
      </Modal>
    </>
  );
};

export default MemberDataPage;
