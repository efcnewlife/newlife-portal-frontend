import { facilityService, type BookingDetail, type BookingListItem } from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { Button, Modal } from "@efcnewlife/newlife-ui";
import { Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { MdCancel } from "react-icons/md";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BookingCancelForm from "./BookingCancelForm";
import BookingDetailDrawer from "./BookingDetailDrawer";

type BookingRow = BookingListItem & Record<string, unknown>;

const BookingDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen: isDetailOpen, openModal: openDetail, closeModal: closeDetail } = useModal(false);
  const { isOpen: isCancelOpen, openModal: openCancel, closeModal: closeCancel } = useModal(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getBookingPages({
        page: currentPage - 1,
        page_size: pageSize,
      });
      if (res.success) {
        setItems((res.data.items || []) as BookingRow[]);
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

  const columns: DataTableColumn<BookingRow>[] = useMemo(
    () => [
      {
        key: "userDisplayName",
        label: t("booking.table.user"),
        width: "w-40",
        render: (_, row) => row.userDisplayName || row.userEmail || row.userId,
      },
      { key: "facilityName", label: t("booking.table.facility"), width: "w-32" },
      {
        key: "bookingType",
        label: t("booking.table.bookingType"),
        width: "w-28",
        render: (v) => t(`booking.bookingType.${v}`, { defaultValue: String(v) }),
      },
      {
        key: "startAt",
        label: t("booking.table.startAt"),
        width: "w-40",
        render: (v) => (v ? DateUtil.format(v as string) : ""),
      },
      {
        key: "endAt",
        label: t("booking.table.endAt"),
        width: "w-40",
        render: (v) => (v ? DateUtil.format(v as string) : ""),
      },
      {
        key: "status",
        label: t("booking.table.status"),
        width: "w-28",
        render: (v) => t(`booking.status.${v}`, { defaultValue: String(v) }),
      },
      { key: "quotedAmount", label: t("booking.table.quotedAmount"), width: "w-24" },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [CommonPageButton.REFRESH(() => void fetchPages())],
    [fetchPages]
  );

  const rowActions: MenuButtonType<BookingRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        const res = await facilityService.getBookingById(row.id);
        if (res.success) {
          setDetail(res.data);
          openDetail();
        }
      }),
      {
        key: "cancel",
        text: t("booking.modal.cancelTitle"),
        icon: <MdCancel className="w-4 h-4" />,
        variant: "danger",
        permission: "modify",
        onClick: (row) => {
          setCancelling(row);
          openCancel();
        },
        visible: (row) => row.status !== "cancelled",
      },
    ],
    [t, openDetail, openCancel]
  );

  return (
    <>
      <DataPage<BookingRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.FacilityBooking}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      <Modal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        title={t("booking.modal.detailTitle")}
        className="max-w-2xl w-full mx-4 p-6"
        footer={
          <Button variant="outline" size="sm" onClick={closeDetail}>
            {t("common:confirm", { ns: "common" })}
          </Button>
        }
      >
        {detail && <BookingDetailDrawer booking={detail} />}
      </Modal>

      <Modal isOpen={isCancelOpen} onClose={closeCancel} title={t("booking.modal.cancelTitle")} className="max-w-lg mx-4 p-6">
        <BookingCancelForm
          submitting={submitting}
          onCancel={closeCancel}
          onSubmit={async (payload) => {
            if (!cancelling?.id) return;
            setSubmitting(true);
            try {
              await facilityService.cancelBooking(cancelling.id, payload);
              closeCancel();
              await fetchPages();
            } catch {
              alert(t("shared.cancelFailed"));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>
    </>
  );
};

export default BookingDataPage;
