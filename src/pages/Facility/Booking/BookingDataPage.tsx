import ministryService, { type MinistryListItem } from "@/api/services/ministryService";
import { facilityService, type BookingDetail, type BookingListItem } from "@/api/services/facilityService";
import type { CalendarView } from "@/components/calendar";
import PageToolbar from "@/components/common/PageToolbar";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { bookingSeriesDetailPath } from "@/pages/Facility/shared/bookingSeriesRoute";
import { BOOKING_STATUS_VALUES } from "@/pages/Facility/shared/bookingStatusBadge";
import { useRoomListOptions } from "@/pages/Facility/shared/useRoomListOptions";
import { cn } from "@/utils";
import { DateUtil } from "@/utils/dateUtil";
import { dayjsToApiUtcIso, localDatetimeInputToDayjs } from "@/utils/dayjsApi";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { Button, ButtonGroup, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MdAdd,
  MdCalendarMonth,
  MdCancel,
  MdEventRepeat,
  MdGridOn,
  MdPayments,
  MdRefresh,
  MdViewList,
} from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router";
import BookingCalendar from "./BookingCalendar";
import BookingCancelForm from "./BookingCancelForm";
import BookingDataForm, { type BookingDataFormHandle, type BookingFormValues } from "./BookingDataForm";
import { buildOneTimeBookingCreatePayload } from "./bookingCreatePayload";
import BookingDetailDrawer from "./BookingDetailDrawer";
import BookingEditForm, { type BookingEditFormHandle } from "./BookingEditForm";
import BookingGrid from "./BookingGrid";
import BookingListFilters from "./BookingListFilters";
import BookingSeriesExpandPanel from "./BookingSeriesExpandPanel";
import { filterBookingRowsByMinistry } from "./bookingListFilter";
import { loadBookingsForVisibleRange } from "./bookingOccupancyLoad";
import { resolveBookingSaveErrorMessage } from "./bookingSaveError";
import { groupBookingsBySeries, type BookingSeriesGroupRow } from "./bookingSeriesGrouping";
import { buildBookingUpdatePayload } from "./bookingUpdatePayload";
import BookingPaymentConfirmationPanel from "../BookingPayment/BookingPaymentConfirmationPanel";
import { PENDING_PAYMENT_READ_PERMISSION } from "../BookingPayment/pendingPaymentPermission";
import RecurringSeriesCreateModal from "../BookingSeries/RecurringSeriesCreateModal";

type BookingRow = BookingListItem & Record<string, unknown>;
/** One grouped List row: a Series (occurrenceCount > 1) or a one-time booking (occurrenceCount 1). */
type BookingListRow = BookingSeriesGroupRow & Record<string, unknown>;
type BookingViewMode = "list" | "calendar" | "grid";

const parseViewMode = (value: string | null): BookingViewMode => {
  if (value === "calendar") return "calendar";
  if (value === "grid") return "grid";
  return "list";
};

const parseCalendarLayout = (value: string | null): CalendarView => {
  if (value === "day" || value === "month" || value === "week") {
    return value;
  }
  return "week";
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
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(`${Resource.FacilityBooking}:${Verb.Create}`);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = parseViewMode(searchParams.get("view"));
  const dateParam = searchParams.get("date");
  const calendarLayout = parseCalendarLayout(searchParams.get("layout"));
  const anchorDate = useMemo(() => parseIsoDate(dateParam), [dateParam]);

  const [items, setItems] = useState<BookingRow[]>([]);
  const [calendarItems, setCalendarItems] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [editing, setEditing] = useState<BookingDetail | null>(null);
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formDefaults, setFormDefaults] = useState<Partial<BookingFormValues> | null>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState<Dayjs | null>(null);
  const [dateToFilter, setDateToFilter] = useState<Dayjs | null>(null);
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);

  const { rooms } = useRoomListOptions();
  const { isOpen: isDetailOpen, openModal: openDetail, closeModal: closeDetail } = useModal(false);
  const { isOpen: isEditOpen, openModal: openEdit, closeModal: closeEdit } = useModal(false);
  const { isOpen: isCancelOpen, openModal: openCancel, closeModal: closeCancel } = useModal(false);
  const { isOpen: isCreateOpen, openModal: openCreate, closeModal: closeCreate } = useModal(false);
  const { isOpen: isPaymentOpen, openModal: openPayment, closeModal: closePayment } = useModal(false);
  const { isOpen: isSeriesCreateOpen, openModal: openSeriesCreate, closeModal: closeSeriesCreate } = useModal(false);

  const formRef = useRef<BookingDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);
  const editFormRef = useRef<BookingEditFormHandle>(null);
  const editModalRef = useRef<ModalFormHandle>(null);

  const setViewMode = useCallback(
    (next: BookingViewMode, date?: Date) => {
      const params = new URLSearchParams(searchParams);
      if (next === "list") {
        params.delete("view");
        params.delete("layout");
      } else {
        params.set("view", next);
        if (next !== "calendar") {
          params.delete("layout");
        } else if (!params.get("layout")) {
          params.set("layout", calendarLayout);
        }
      }
      if (date) {
        params.set("date", toIsoDate(date));
      } else if (next !== "list" && !params.get("date")) {
        params.set("date", toIsoDate(anchorDate));
      }
      setSearchParams(params, { replace: true });
    },
    [anchorDate, calendarLayout, searchParams, setSearchParams]
  );

  const setAnchorDate = useCallback(
    (date: Date) => {
      const nextDate = toIsoDate(date);
      const params = new URLSearchParams(searchParams);
      params.set("date", nextDate);
      if (viewMode === "list") {
        params.set("view", "calendar");
        if (!params.get("layout")) {
          params.set("layout", "week");
        }
      } else {
        params.set("view", viewMode);
        if (viewMode === "calendar" && !params.get("layout")) {
          params.set("layout", calendarLayout);
        }
      }
      setSearchParams(params, { replace: true });
    },
    [calendarLayout, searchParams, setSearchParams, viewMode]
  );

  const setCalendarLayout = useCallback(
    (layout: CalendarView) => {
      const params = new URLSearchParams(searchParams);
      params.set("view", "calendar");
      params.set("layout", layout);
      if (!params.get("date")) {
        params.set("date", toIsoDate(anchorDate));
      }
      setSearchParams(params, { replace: true });
    },
    [anchorDate, searchParams, setSearchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setKeyword(keywordInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [keywordInput]);

  useEffect(() => {
    void ministryService
      .getMinistryList()
      .then((res) => setMinistries(res.success ? res.data.items || [] : []))
      .catch(() => setMinistries([]));
  }, []);

  const dateFromIso = useMemo(
    () => (dateFromFilter ? dayjsToApiUtcIso(dateFromFilter.startOf("day")) : undefined),
    [dateFromFilter]
  );
  const dateToIso = useMemo(
    () => (dateToFilter ? dayjsToApiUtcIso(dateToFilter.endOf("day")) : undefined),
    [dateToFilter]
  );

  // Ministry has no server-side filter (see bookingListFilter.ts); resetting to page 1 only
  // for the server-backed filters keeps that client-side Ministry filter page-local on purpose.
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, dateFromIso, dateToIso]);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getBookingPages({
        page: currentPage - 1,
        page_size: pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFromIso,
        dateTo: dateToIso,
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
  }, [currentPage, dateFromIso, dateToIso, keyword, pageSize, statusFilter, t]);

  const fetchCalendarRange = useCallback(async () => {
    if (!visibleRange) return;
    setLoading(true);
    try {
      const items = await loadBookingsForVisibleRange(facilityService, visibleRange);
      if (items !== null) {
        setCalendarItems(items as BookingRow[]);
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
      const sameMs =
        !!prev && prev.start.getTime() === range.start.getTime() && prev.end.getTime() === range.end.getTime();
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

  const openBookingEdit = useCallback(
    async (row: BookingListItem) => {
      const res = await facilityService.getBookingById(row.id);
      if (res.success) {
        setEditing(res.data);
        openEdit();
      }
    },
    [openEdit]
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("booking.filter.allStatuses") },
      ...BOOKING_STATUS_VALUES.map((status) => ({ value: status, label: t(`booking.status.${status}`) })),
    ],
    [t]
  );

  const ministryOptions = useMemo(
    () => [
      { value: "", label: t("booking.filter.allMinistries") },
      ...ministries.map((ministry) => ({ value: ministry.id, label: ministry.name || ministry.id })),
    ],
    [ministries, t]
  );

  const groupedRows = useMemo(() => groupBookingsBySeries(items) as BookingListRow[], [items]);
  const visibleRows = useMemo(
    () => filterBookingRowsByMinistry(groupedRows, ministryFilter),
    [groupedRows, ministryFilter]
  );
  // Ministry filters only the current page (see bookingListFilter.ts), so the server's
  // cross-page `total` would otherwise imply pages beyond what the filtered rows can fill.
  const displayTotal = ministryFilter ? visibleRows.length : total;

  const columns: DataTableColumn<BookingListRow>[] = useMemo(
    () => [
      {
        key: "userDisplayName",
        label: t("booking.table.user"),
        width: "w-40",
        render: (_, row) => row.userDisplayName || row.userEmail || row.userId,
      },
      { key: "facilityName", label: t("booking.table.facility"), width: "w-32" },
      {
        key: "ministryName",
        label: t("booking.table.ministry"),
        width: "w-32",
        render: (_, row) => row.ministryName || "—",
      },
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
      {
        key: "seriesId",
        label: t("booking.table.series"),
        width: "w-32",
        render: (_, row) =>
          row.seriesId ? (
            <Button
              variant="outline"
              size="sm"
              startIcon={<MdEventRepeat className="size-4" />}
              onClick={() => navigate(bookingSeriesDetailPath(row.seriesId!))}
            >
              {t("booking.list.viewSeries")}
            </Button>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{t("booking.list.oneTime")}</span>
          ),
        renderExpand: (row) =>
          row.seriesId ? (
            <BookingSeriesExpandPanel seriesId={row.seriesId} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("booking.list.notInSeries")}</p>
          ),
      },
    ],
    [navigate, t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.ADD(() => openCreateModal(null)),
      {
        key: "createSeries",
        text: t("booking.toolbar.createSeries"),
        icon: <MdEventRepeat className="size-4" />,
        onClick: openSeriesCreate,
        outline: true,
        permission: `${Resource.FacilityBooking}:${Verb.Create}`,
      },
      {
        key: "paymentConfirmation",
        text: t("booking.toolbar.paymentConfirmation"),
        icon: <MdPayments className="size-4" />,
        onClick: openPayment,
        outline: true,
        permission: PENDING_PAYMENT_READ_PERMISSION,
      },
      CommonPageButton.REFRESH(() => {
        void refreshCurrentView();
      }),
    ],
    [openCreateModal, openPayment, openSeriesCreate, refreshCurrentView, t]
  );

  const rowActions: MenuButtonType<BookingListRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        await openBookingDetail(row);
      }),
      CommonRowAction.EDIT(
        async (row) => {
          await openBookingEdit(row);
        },
        { visible: (row) => row.status !== "cancelled" }
      ),
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
    [t, openCancel, openBookingDetail, openBookingEdit]
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
    [setViewMode, t, viewMode]
  );

  const showScheduleCreate = (viewMode === "calendar" || viewMode === "grid") && canCreate;

  const scheduleRefreshButton = (
    <Button
      variant="outline"
      size="sm"
      className="h-9 w-9 justify-center !px-0"
      onClick={() => void refreshCurrentView()}
      disabled={loading}
    >
      <MdRefresh className="size-5" aria-hidden />
      <span className="sr-only">{t("common:refresh")}</span>
    </Button>
  );

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
              "[&_button]:first:!rounded-l-full [&_button]:last:!rounded-r-full"
            )}
          />
        }
      />

      {viewMode === "list" && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
          <BookingListFilters
            keyword={keywordInput}
            onKeywordChange={setKeywordInput}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={statusOptions}
            ministryId={ministryFilter}
            onMinistryIdChange={setMinistryFilter}
            ministryOptions={ministryOptions}
            dateFrom={dateFromFilter}
            onDateFromChange={setDateFromFilter}
            dateTo={dateToFilter}
            onDateToChange={setDateToFilter}
          />
          <div className="min-h-0 flex-1">
            <DataPage<BookingListRow>
              data={{ page: currentPage, pageSize, total: displayTotal, items: visibleRows }}
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
          </div>
        </div>
      )}

      {viewMode === "calendar" && (
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <BookingCalendar
            anchorDate={anchorDate}
            calendarLayout={calendarLayout}
            bookings={calendarItems}
            onAnchorDateChange={setAnchorDate}
            onCalendarLayoutChange={setCalendarLayout}
            onVisibleRangeChange={handleVisibleRangeChange}
            onEventClick={(booking) => void openBookingDetail(booking)}
            onCancelClick={(booking) => {
              setCancelling(booking as BookingRow);
              openCancel();
            }}
            onViewSeriesClick={(booking) => {
              if (booking.seriesId) navigate(bookingSeriesDetailPath(booking.seriesId));
            }}
            onAddSlot={(startLocal, endLocal) => {
              if (!canCreate) return;
              openCreateModal({
                startAt: localDatetimeInputToDayjs(startLocal),
                endAt: localDatetimeInputToDayjs(endLocal),
              });
            }}
            onDensityOverflow={(date) => setViewMode("grid", date)}
            toolbarEnd={scheduleRefreshButton}
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
            onViewSeriesClick={(booking) => {
              if (booking.seriesId) navigate(bookingSeriesDetailPath(booking.seriesId));
            }}
            onAddCell={(facilityId, startLocal, endLocal) => {
              openCreateModal({
                facilityIds: [facilityId],
                startAt: localDatetimeInputToDayjs(startLocal),
                endAt: localDatetimeInputToDayjs(endLocal),
              });
            }}
            toolbarEnd={scheduleRefreshButton}
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

      <Modal
        isOpen={isCancelOpen}
        onClose={closeCancel}
        title={t("booking.modal.cancelTitle")}
        className="max-w-lg mx-4 p-6"
      >
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
          const payload = buildOneTimeBookingCreatePayload({
            userId: values.userId,
            startAt,
            endAt,
            ministryId: values.ministryId,
            facilityIds: values.facilityIds,
            surchargeCodes: values.surchargeCodes,
            remark: values.remark,
          });
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

      <ModalForm
        ref={editModalRef}
        isOpen={isEditOpen}
        onClose={closeEdit}
        title={t("booking.modal.editTitle")}
        className="max-w-2xl w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeEdit} disabled={submitting}>
              {t("common:cancel", { ns: "common" })}
            </Button>
            <Button variant="primary" size="sm" onClick={() => editModalRef.current?.submit()} disabled={submitting}>
              {t("common:save", { ns: "common" })}
            </Button>
          </>
        }
        onSubmit={async (e) => {
          e.preventDefault();
          if (!editFormRef.current?.validate() || !editing) return;
          const values = editFormRef.current.getValues();
          const payload = buildBookingUpdatePayload(values);
          setSubmitting(true);
          try {
            await facilityService.updateBooking(editing.id, payload);
            notifySuccess({ title: t("common:feedback.updated") });
            closeEdit();
            await refreshCurrentView();
          } catch (error) {
            notifyApiError(error, {
              title: t("common:feedback.saveFailed"),
              fallbackDescription: t("common:feedback.saveFailedDesc"),
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {editing && <BookingEditForm ref={editFormRef} booking={editing} />}
      </ModalForm>

      <Modal
        isOpen={isPaymentOpen}
        onClose={() => {
          closePayment();
          void refreshCurrentView();
        }}
        title={t("bookingPayment.modal.title")}
        className="max-w-3xl w-full mx-4 p-6"
      >
        <BookingPaymentConfirmationPanel />
      </Modal>

      <RecurringSeriesCreateModal
        isOpen={isSeriesCreateOpen}
        rooms={rooms}
        onClose={closeSeriesCreate}
        onCreated={(series) => navigate(bookingSeriesDetailPath(series.id))}
      />
    </div>
  );
};

export default BookingDataPage;
