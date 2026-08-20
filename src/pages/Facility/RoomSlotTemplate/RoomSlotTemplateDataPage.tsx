import {
  facilityService,
  type RoomListItem,
  type RoomSlotTemplateCreate,
  type RoomSlotTemplateItem,
  type RoomSlotTemplateUpdate,
} from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import DeleteForm from "@/components/DataPage/DeleteForm";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import FacilityRoomScopedSearchPopover, {
  type FacilityRoomScopedSearchFilters,
} from "@/pages/Facility/shared/FacilityRoomScopedSearchPopover";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { PopoverPosition, Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import RoomSlotTemplateDataForm, {
  type RoomSlotTemplateDataFormHandle,
  type RoomSlotTemplateFormValues,
} from "./RoomSlotTemplateDataForm";

type TemplateRow = RoomSlotTemplateItem & Record<string, unknown>;

const RoomSlotTemplateDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchFilters, setSearchFilters] = useState<FacilityRoomScopedSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<FacilityRoomScopedSearchFilters>({});
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [formValues, setFormValues] = useState<RoomSlotTemplateFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const formRef = useRef<RoomSlotTemplateDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);
  const clearSelectionRef = useRef<() => void>(() => {});

  useEffect(() => {
    void facilityService.getRoomList().then((res) => {
      if (res.success) setRooms(res.data.items || []);
    });
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getRoomSlotTemplatePages({
        page: currentPage - 1,
        page_size: pageSize,
        deleted: showDeleted || undefined,
        keyword: appliedFilters.keyword?.trim() || undefined,
        facilityId: appliedFilters.facilityId,
      });
      if (res.success) {
        setItems((res.data.items || []) as TemplateRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      }
    } catch (error) {
      notifyApiError(error, { title: t("common:feedback.loadFailed"), fallbackDescription: t("common:feedback.loadFailedDesc") });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, showDeleted, appliedFilters, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const columns: DataTableColumn<TemplateRow>[] = useMemo(
    () => [
      { key: "name", label: t("roomSlotTemplate.table.name"), width: "w-40" },
      {
        key: "daysOfWeek",
        label: t("roomSlotTemplate.table.daysOfWeek"),
        width: "w-48",
        render: (v) =>
          (Array.isArray(v) ? v : [])
            .map((day) => t(`roomSlotTemplate.days.${day}`))
            .join(", "),
      },
      { key: "startTime", label: t("roomSlotTemplate.table.startTime"), width: "w-24", render: (v) => String(v).slice(0, 5) },
      { key: "endTime", label: t("roomSlotTemplate.table.endTime"), width: "w-24", render: (v) => String(v).slice(0, 5) },
      { key: "slotDurationMinutes", label: t("roomSlotTemplate.table.slotDuration"), width: "w-24" },
      {
        key: "isActive",
        label: t("roomSlotTemplate.table.isActive"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(() => {
    const searchPopoverCallback = ({
      isOpen: searchOpen,
      onOpenChange,
      trigger,
      popover,
    }: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      trigger: ReactNode;
      popover: PopoverType;
    }) => (
      <FacilityRoomScopedSearchPopover
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        onSearch={(filters) => {
          setAppliedFilters(filters);
          setCurrentPage(1);
          onOpenChange(false);
        }}
        onClear={() => {
          setSearchFilters({});
          setAppliedFilters({});
          setCurrentPage(1);
          onOpenChange(false);
        }}
        keywordLabel={t("roomSlotTemplate.search.keywordLabel")}
        keywordPlaceholder={t("roomSlotTemplate.search.keywordPlaceholder")}
        trigger={trigger}
        isOpen={searchOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    return [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: {
          title: t("roomSlotTemplate.search.popoverTitle"),
          position: PopoverPosition.BottomLeft,
          width: "420px",
        },
      }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setFormValues({
            facilityId: appliedFilters.facilityId || "",
            name: "",
            daysOfWeek: [0, 1, 2, 3, 4],
            startTime: "09:00",
            endTime: "17:00",
            slotDurationMinutes: 60,
          });
          openModal();
        },
        { visible: !showDeleted }
      ),
      CommonPageButton.REFRESH(() => void fetchPages()),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted((v) => !v);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) }
      ),
    ];
  }, [appliedFilters.facilityId, fetchPages, openModal, searchFilters, showDeleted, t]);

  const rowActions: MenuButtonType<TemplateRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        async (row) => {
          const res = await facilityService.getRoomSlotTemplateById(row.id);
          if (res.success) {
            const d = res.data;
            setFormMode("edit");
            setEditing(row);
            setFormValues({
              facilityId: d.facilityId,
              name: d.name,
              daysOfWeek: d.daysOfWeek,
              startTime: d.startTime,
              endTime: d.endTime,
              slotDurationMinutes: d.slotDurationMinutes,
              isActive: d.isActive,
              effectiveFrom: d.effectiveFrom,
              effectiveTo: d.effectiveTo,
            });
            openModal();
          }
        },
        { visible: !showDeleted }
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          try {
            await facilityService.restoreRoomSlotTemplate(row.id);
            notifySuccess({ title: t("common:feedback.restored") });
            await fetchPages();
          } catch (error) {
            notifyApiError(error, {
              title: t("common:feedback.actionFailed"),
              fallbackDescription: t("common:feedback.actionFailedDesc"),
            });
          }
        },
        { visible: showDeleted }
      ),
      CommonRowAction.DELETE((row) => {
        setEditing(row);
        openDeleteModal();
      }),
    ],
    [fetchPages, openModal, openDeleteModal, showDeleted]
  );

  return (
    <>
      <DataPage<TemplateRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.FacilityRoomSlotTemplate}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
        onClearSelectionRef={(fn) => {
          clearSelectionRef.current = fn;
        }}
      />

      <ModalForm
        ref={modalRef}
        isOpen={isOpen}
        onClose={closeModal}
        title={formMode === "create" ? t("roomSlotTemplate.modal.createTitle") : t("roomSlotTemplate.modal.editTitle")}
        className="max-w-3xl w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal}>
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
          setSubmitting(true);
          try {
            if (formMode === "create") {
              await facilityService.createRoomSlotTemplate(values as RoomSlotTemplateCreate);
              notifySuccess({ title: t("common:feedback.created") });
            } else if (editing?.id) {
              await facilityService.updateRoomSlotTemplate(editing.id, values as RoomSlotTemplateUpdate);
              notifySuccess({ title: t("common:feedback.updated") });
            }
            closeModal();
            await fetchPages();
          } catch (error) {
            notifyApiError(error, { title: t("common:feedback.saveFailed"), fallbackDescription: t("common:feedback.saveFailedDesc") });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <RoomSlotTemplateDataForm ref={formRef} defaultValues={formValues} rooms={rooms} facilityLocked={formMode === "edit"} />
      </ModalForm>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} title={t("roomSlotTemplate.modal.deleteSoft")} className="max-w-lg mx-4 p-6">
        <DeleteForm
          entityName={t("roomSlotTemplate.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            await facilityService.deleteRoomSlotTemplate(editing.id, { reason, permanent });
            notifySuccess({ title: t("common:feedback.deleted") });
            closeDeleteModal();
            await fetchPages();
          }}
        />
      </Modal>
    </>
  );
};

export default RoomSlotTemplateDataPage;
