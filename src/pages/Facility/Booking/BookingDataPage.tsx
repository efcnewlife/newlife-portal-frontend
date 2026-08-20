import { facilityService, type BookingCreate, type BookingDetail, type BookingListItem } from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import PageToolbar from "@/components/common/PageToolbar";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { useRoomListOptions } from "@/pages/Facility/shared/useRoomListOptions";
import { cn } from "@/utils";
import { DateUtil } from "@/utils/dateUtil";
import { dayjsToApiUtcIso, localDatetimeInputToDayjs } from "@/utils/dayjsApi";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { Button, ButtonGroup, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd, MdCalendarMonth, MdCancel, MdGridOn, MdViewList } from "react-icons/md";
import { useSearchParams } from "react-router";
import BookingCalendar from "./BookingCalendar";
import BookingCancelForm from "./BookingCancelForm";
import BookingDataForm, { type BookingDataFormHandle, type BookingFormValues } from "./BookingDataForm";
import BookingDetailDrawer from "./BookingDetailDrawer";
import BookingGrid from "./BookingGrid";
import { resolveBookingSaveErrorMessage } from "./bookingSaveError";

type BookingRow = BookingListItem & Record<string, unknown>;
type BookingViewMode = "list" | "calendar" | "grid";

const parseViewMode = (value: string | null): BookingViewMode => {
  if (value === "calendar") return "calendar";
  if (value === "grid") return "grid";
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

const BookingDataPage = () => {
  const { t } = useTranslation("facility");
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(`${Resource.FacilityBooking}:${Verb.Create}`);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = parseViewMode(searchParams.get("view"));
  const dateParam = searchParams.get("date");
  const anchorDate = useMemo(() => parseIsoDate(dateParam), [dateParam]);

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
    (next: BookingViewMode, date?: Date) => {
      const params = new URLSearchParams(searchParams);
      if (next === "list") {
        params.delete("view");
      } else {
        params.set("view", next);
      }
      if (date) {
        params.set("date", toIsoDate(date));
      } else if (next !== "list" && !params.get("date")) {
        params.set("date", toIsoDate(anchorDate));
      }
      setSearchParams(params, { replace: true });
    },
    [anchorDate, searchParams, setSearchParams],
  );

  const setAnchorDate = useCallback(
    (date: Date) => {
      const nextDate = toIsoDate(date);
      const params = new URLSearchParams(searchParams);
      params.set("date", nextDate);
      if (viewMode === "list") {
        params.set("view", "calendar");
      } else {
        params.set("view", viewMode);
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams, viewMode],
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
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
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
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [t, visibleRange]);

  const handleVisibleRangeChange = useCallback((range: { start: Date; end: Date }) => {
    setVisibleRange((prev) => {
      const sameMs = !!prev && prev.start.getTime() === range.start.getTime() && prev.end.getTime() === range.end.getTime();
      return sameMs ? prev : range;
    });
  }, []);

  useEffect(() => {
    if (viewMode === "list") {
      void fetchPages();
    }
  }, [fetchPages, viewMode]);

  useEffect(() => {
    if (viewMode === "calendar" || viewMode === "grid") {
      void fetchCalendarRange();
    }
  }, [fetchCalendarRange, viewMode]);

  const refreshCurrentView = useCallback(async () => {
    if (viewMode === "calendar" || viewMode === "grid") {
      await fetchCalendarRange();
    } else {
      await fetchPages();
    }
  }, [fetchCalendarRange, fetchPages, viewMode]);

  const openCreateModal = useCallback(
    (defaults?: Partial<BookingFormValues> | null) => {
      setFormDefaults(defaults || null);
      openCreate();
    },
    [openCreate],
  );

  const openBookingDetail = useCallback(
    async (row: BookingListItem) => {
      const res = await facilityService.getBookingById(row.id);
      if (res.success) {
        setDetail(res.data);
        openDetail();
      }
    },
    [openDetail],
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
    [t],
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.ADD(() => openCreateModal(null)),
      CommonPageButton.REFRESH(() => {
        void refreshCurrentView();
      }),
    ],
    [openCreateModal, refreshCurrentView],
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
    [t, openCancel, openBookingDetail],
  );

  const viewModeButtons = useMemo(
    () => [
      {
        text: t("booking.view.list"),
        icon: <MdViewList className="size-4" aria-hidden />,
        iconOnly: true,
        active: viewMode === "list",
        onClick: () => setViewMode("list"),
        className: "h-9 w-9 justify-center px-0 py-0",
      },
      {
        text: t("booking.view.calendar"),
        icon: <MdCalendarMonth className="size-4" aria-hidden />,
        iconOnly: true,
        active: viewMode === "calendar",
        onClick: () => setViewMode("calendar"),
        className: "h-9 w-9 justify-center px-0 py-0",
      },
      {
        text: t("booking.view.grid"),
        icon: <MdGridOn className="size-4" aria-hidden />,
        iconOnly: true,
        active: viewMode === "grid",
        onClick: () => setViewMode("grid"),
        className: "h-9 w-9 justify-center px-0 py-0",
      },
    ],
    [setViewMode, t, viewMode],
  );

  const showScheduleCreate = (viewMode === "calendar" || viewMode === "grid") && canCreate;

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col gap-3 overflow-hidden">
      <PageToolbar
        left={
          showScheduleCreate ? (
            <Button
              size="sm"
              startIcon={<MdAdd className="size-5" aria-hidden />}
              className="h-9 w-9 !rounded-full !px-0"
              onClick={() => openCreateModal(null)}
            >
              <span className="sr-only">{t("booking.actions.create")}</span>
            </Button>
          ) : null
        }
        right={
          <ButtonGroup
            variant="primary"
            buttons={viewModeButtons}
            minWidth="auto"
            className={cn(
              "!pb-0 [&>div>div]:!shadow-none",
              "[&>div>div]:!rounded-full",
              "[&_button]:first:!rounded-l-full [&_button]:last:!rounded-r-full",
            )}
          />
        }
      />

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
        <div className="min-h-0 flex-1 space-y-3">
          <BookingCalendar
            anchorDate={anchorDate}
            bookings={calendarItems}
            onAnchorDateChange={setAnchorDate}
            onVisibleRangeChange={handleVisibleRangeChange}
            onEventClick={(booking) => void openBookingDetail(booking)}
            onCancelClick={(booking) => {
              setCancelling(booking as BookingRow);
              openCancel();
            }}
            onAddSlot={(startLocal, endLocal) => {
              if (!canCreate) return;
              openCreateModal({
                startAt: localDatetimeInputToDayjs(startLocal),
                endAt: localDatetimeInputToDayjs(endLocal),
              });
            }}
            onDensityOverflow={(date) => setViewMode("grid", date)}
          />
        </div>
      )}

      {viewMode === "grid" && (
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookingGrid
            anchorDate={anchorDate}
            rooms={rooms}
            bookings={calendarItems}
            canCreate={canCreate}
            onAnchorDateChange={setAnchorDate}
            onVisibleRangeChange={handleVisibleRangeChange}
            onBookingClick={(booking) => void openBookingDetail(booking)}
            onAddCell={(facilityId, startLocal, endLocal) => {
              openCreateModal({
                facilityIds: [facilityId],
                startAt: localDatetimeInputToDayjs(startLocal),
                endAt: localDatetimeInputToDayjs(endLocal),
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
              notifySuccess({ title: t("common:feedback.updated") });
              closeCancel();
              await refreshCurrentView();
            } catch (error) {
              notifyApiError(error, {
                title: t("common:feedback.cancelFailed"),
                fallbackDescription: t("common:feedback.cancelFailedDesc"),
              });
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
          const startAt = dayjsToApiUtcIso(values.startAt);
          const endAt = dayjsToApiUtcIso(values.endAt);
          if (!startAt || !endAt) return;
          const payload: BookingCreate = {
            userId: values.userId,
            startAt,
            endAt,
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
            notifySuccess({ title: t("common:feedback.created") });
            closeCreate();
            await refreshCurrentView();
          } catch (error) {
            notifyApiError(error, {
              title: t("common:feedback.saveFailed"),
              fallbackDescription: t("common:feedback.saveFailedDesc"),
              resolveDescription: (apiError) => resolveBookingSaveErrorMessage(apiError, rooms, t),
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <BookingDataForm ref={formRef} defaultValues={formDefaults} rooms={rooms} />
      </ModalForm>
    </div>
  );
};

export default BookingDataPage;
