import {
  facilityService,
  type BookingCreate,
  type BookingDetail,
  type BookingListItem,
} from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { useRoomListOptions } from "@/pages/Facility/shared/useRoomListOptions";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { cn } from "@/utils";
import { MdCancel } from "react-icons/md";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import BookingCalendar from "./BookingCalendar";
import BookingCancelForm from "./BookingCancelForm";
import BookingDataForm, { type BookingDataFormHandle, type BookingFormValues } from "./BookingDataForm";
import BookingDetailDrawer from "./BookingDetailDrawer";

type BookingRow = BookingListItem & Record<string, unknown>;
type BookingViewMode = "list" | "calendar";

const parseViewMode = (value: string | null): BookingViewMode => {
  if (value === "calendar") return "calendar";
  return "list";
};

const parseIsoDate = (value: string | null): Date => {
  if (!value) return new Date();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date();
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const toIsoDate = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const localDatetimeToUtcIso = (localValue: string): string => new Date(localValue).toISOString();

const BookingDataPage = () => {
  const { t } = useTranslation("facility");
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(`${Resource.FacilityBooking}:${Verb.Create}`);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = parseViewMode(searchParams.get("view"));
  const anchorDate = parseIsoDate(searchParams.get("date"));

  const [items, setItems] = useState<BookingRow[]>([]);
  const [calendarItems, setCalendarItems] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formDefaults, setFormDefaults] = useState<Partial<BookingFormValues> | null>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);

  const { rooms } = useRoomListOptions();
  const { isOpen: isDetailOpen, openModal: openDetail, closeModal: closeDetail } = useModal(false);
  const { isOpen: isCancelOpen, openModal: openCancel, closeModal: closeCancel } = useModal(false);
  const { isOpen: isCreateOpen, openModal: openCreate, closeModal: closeCreate } = useModal(false);

  const formRef = useRef<BookingDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const setViewMode = useCallback(
    (next: BookingViewMode) => {
      const params = new URLSearchParams(searchParams);
      if (next === "list") {
        params.delete("view");
      } else {
        params.set("view", next);
      }
      if (next === "list") {
        // List may ignore date; keep or drop — leave date if present for share restore when switching back
      } else if (!params.get("date")) {
        params.set("date", toIsoDate(anchorDate));
      }
      setSearchParams(params, { replace: true });
    },
    [anchorDate, searchParams, setSearchParams]
  );

  const setAnchorDate = useCallback(
    (date: Date) => {
      const params = new URLSearchParams(searchParams);
      params.set("date", toIsoDate(date));
      if (viewMode === "list") {
        params.set("view", "calendar");
      } else {
        params.set("view", viewMode);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, viewMode]
  );

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

  const fetchCalendarRange = useCallback(async () => {
    if (!visibleRange) return;
    setLoading(true);
    try {
      const res = await facilityService.getBookingPages({
        page: 0,
        page_size: 200,
        dateFrom: visibleRange.start.toISOString(),
        dateTo: visibleRange.end.toISOString(),
      });
      if (res.success) {
        setCalendarItems((res.data.items || []) as BookingRow[]);
      }
    } catch {
      alert(t("shared.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, visibleRange]);

  useEffect(() => {
    if (viewMode === "list") {
      void fetchPages();
    }
  }, [fetchPages, viewMode]);

  useEffect(() => {
    if (viewMode === "calendar") {
      void fetchCalendarRange();
    }
  }, [fetchCalendarRange, viewMode]);

  const openCreateModal = useCallback(
    (defaults?: Partial<BookingFormValues> | null) => {
      setFormDefaults(defaults || null);
      openCreate();
    },
    [openCreate]
  );

  const openBookingDetail = useCallback(
    async (row: BookingListItem) => {
      const res = await facilityService.getBookingById(row.id);
      if (res.success) {
        setDetail(res.data);
        openDetail();
      }
    },
    [openDetail]
  );

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
    () => [
      CommonPageButton.ADD(() => openCreateModal(null)),
      CommonPageButton.REFRESH(() => {
        if (viewMode === "calendar") {
          void fetchCalendarRange();
        } else {
          void fetchPages();
        }
      }),
    ],
    [fetchCalendarRange, fetchPages, openCreateModal, viewMode]
  );

  const rowActions: MenuButtonType<BookingRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        await openBookingDetail(row);
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
    [t, openCancel, openBookingDetail]
  );

  const viewToggle = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-500">{t("booking.view.label")}</span>
      {(["list", "calendar"] as const).map((mode) => (
        <Button
          key={mode}
          size="sm"
          variant={viewMode === mode ? "primary" : "outline"}
          className={cn(viewMode === mode && "pointer-events-none")}
          onClick={() => setViewMode(mode)}
        >
          {t(`booking.view.${mode}`)}
        </Button>
      ))}
    </div>
  );

  return (
    <>
      {viewToggle}

      {viewMode === "list" && (
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
      )}

      {viewMode === "calendar" && (
        <div className="space-y-3">
          {canCreate && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openCreateModal(null)}>
                {t("common:create", { ns: "common" })}
              </Button>
            </div>
          )}
          <BookingCalendar
            anchorDate={anchorDate}
            bookings={calendarItems}
            onAnchorDateChange={setAnchorDate}
            onVisibleRangeChange={setVisibleRange}
            onEventClick={(booking) => void openBookingDetail(booking)}
            onCancelClick={(booking) => {
              setCancelling(booking as BookingRow);
              openCancel();
            }}
            onAddSlot={(startLocal, endLocal) => {
              if (!canCreate) return;
              openCreateModal({
                startAtLocal: startLocal,
                endAtLocal: endLocal,
              });
            }}
          />
        </div>
      )}

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
              if (viewMode === "calendar") {
                await fetchCalendarRange();
              } else {
                await fetchPages();
              }
            } catch {
              alert(t("shared.cancelFailed"));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>

      <ModalForm
        ref={modalRef}
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title={t("booking.modal.createTitle")}
        className="max-w-2xl w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeCreate} disabled={submitting}>
              {t("common:cancel", { ns: "common" })}
            </Button>
            <Button variant="primary" size="sm" onClick={() => modalRef.current?.submit()} disabled={submitting}>
              {t("common:save", { ns: "common" })}
            </Button>
          </>
        }
        onSubmit={async (e) => {
          e.preventDefault();
          if (!formRef.current?.validate()) return;
          const values = formRef.current.getValues();
          const payload: BookingCreate = {
            userId: values.userId,
            startAt: localDatetimeToUtcIso(values.startAtLocal),
            endAt: localDatetimeToUtcIso(values.endAtLocal),
            isMissionAligned: values.isMissionAligned,
            ministryId: values.ministryId || undefined,
            rooms: values.facilityIds.map((facilityId, index) => ({
              facilityId,
              sequence: index,
            })),
            surchargeCodes: values.surchargeCodes,
            remark: values.remark.trim() || undefined,
          };
          setSubmitting(true);
          try {
            await facilityService.createBooking(payload);
            closeCreate();
            if (viewMode === "calendar") {
              await fetchCalendarRange();
            } else {
              await fetchPages();
            }
          } catch {
            alert(t("shared.saveFailed"));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <BookingDataForm ref={formRef} defaultValues={formDefaults} rooms={rooms} />
      </ModalForm>
    </>
  );
};

export default BookingDataPage;
