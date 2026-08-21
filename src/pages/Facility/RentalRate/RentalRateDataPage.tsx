import {
  facilityService,
  type RentalRateItem,
  type RentalRateTemplateItem,
  type RoomListItem,
} from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import DeleteForm from "@/components/DataPage/DeleteForm";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import FacilityRoomScopedSearchPopover, {
  type FacilityRoomScopedSearchFilters,
} from "@/pages/Facility/shared/FacilityRoomScopedSearchPopover";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { PopoverPosition, Resource, Verb } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdOutlineRule } from "react-icons/md";
import RentalRateTemplatePanel from "@/pages/Facility/RentalRateTemplate/RentalRateTemplatePanel";
import RentalRateDataForm, { type RentalRateDataFormHandle, type RentalRateFormValues } from "./RentalRateDataForm";

type RateRow = RentalRateItem & Record<string, unknown>;

const RentalRateDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<RateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchFilters, setSearchFilters] = useState<FacilityRoomScopedSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<FacilityRoomScopedSearchFilters>({});
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [templates, setTemplates] = useState<RentalRateTemplateItem[]>([]);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RateRow | null>(null);
  const [formValues, setFormValues] = useState<RentalRateFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const { isOpen: isTemplatesOpen, openModal: openTemplatesModal, closeModal: closeTemplatesModal } = useModal(false);
  const formRef = useRef<RentalRateDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const loadTemplates = useCallback(async () => {
    const res = await facilityService.getRentalRateTemplateList();
    if (res.success) setTemplates(res.data.items || []);
  }, []);

  useEffect(() => {
    void facilityService.getRoomList().then((res) => {
      if (res.success) setRooms(res.data.items || []);
    });
    void loadTemplates();
  }, [loadTemplates]);

  const handleTemplatesClose = useCallback(() => {
    closeTemplatesModal();
    void loadTemplates();
  }, [closeTemplatesModal, loadTemplates]);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getRentalRatePages({
        page: currentPage - 1,
        page_size: pageSize,
        deleted: showDeleted || undefined,
        keyword: appliedFilters.keyword?.trim() || undefined,
        facilityId: appliedFilters.facilityId,
      });
      if (res.success) {
        setItems((res.data.items || []) as RateRow[]);
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
  }, [currentPage, pageSize, showDeleted, appliedFilters, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const roomLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) {
      map.set(room.id, room.name ? `${room.code} - ${room.name}` : room.code);
    }
    return map;
  }, [rooms]);

  const columns: DataTableColumn<RateRow>[] = useMemo(
    () => [
      {
        key: "facilityId",
        label: t("rentalRate.table.room"),
        width: "w-40",
        render: (v) => roomLabelById.get(String(v)) || String(v || "—"),
      },
      {
        key: "templateId",
        label: t("rentalRate.table.template"),
        width: "w-40",
        render: (_v, row) => row.template?.name || String(row.templateId || "—"),
      },
      {
        key: "billingUnit",
        label: t("rentalRate.table.billingUnit"),
        width: "w-28",
        render: (_v, row) =>
          row.template?.billingUnit
            ? t(`rentalRateTemplate.billingUnits.${row.template.billingUnit}`, {
                defaultValue: row.template.billingUnit,
              })
            : "—",
      },
      {
        key: "templateAmount",
        label: t("rentalRate.table.amount"),
        width: "w-28",
        render: (_v, row) =>
          row.template ? `${row.template.unitAmount ?? ""} ${row.template.currency || ""}`.trim() : "—",
      },
      {
        key: "isActive",
        label: t("rentalRate.table.isActive"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
    ],
    [roomLabelById, t]
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
        keywordLabel={t("rentalRate.search.keywordLabel")}
        keywordPlaceholder={t("rentalRate.search.keywordPlaceholder")}
        trigger={trigger}
        isOpen={searchOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    return [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: {
          title: t("rentalRate.search.popoverTitle"),
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
            templateId: "",
            isActive: true,
          });
          openModal();
        },
        { visible: !showDeleted }
      ),
      {
        key: "templates",
        text: t("rentalRate.toolbar.templates"),
        icon: <MdOutlineRule className="size-4" />,
        onClick: openTemplatesModal,
        outline: true,
        permission: `${Resource.FacilityRentalRateTemplate}:${Verb.Read}`,
      },
      CommonPageButton.REFRESH(() => void fetchPages()),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted((v) => !v);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) }
      ),
    ];
  }, [appliedFilters.facilityId, fetchPages, openModal, openTemplatesModal, searchFilters, showDeleted, t]);

  const rowActions: MenuButtonType<RateRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        async (row) => {
          const res = await facilityService.getRentalRateById(row.id);
          if (res.success) {
            const d = res.data;
            setFormMode("edit");
            setEditing(row);
            setFormValues({
              facilityId: d.facilityId ?? "",
              templateId: d.templateId,
              isActive: d.isActive,
            });
            openModal();
          }
        },
        { visible: () => !showDeleted }
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          try {
            await facilityService.restoreRentalRate(row.id);
            notifySuccess({ title: t("common:feedback.restored") });
            await fetchPages();
          } catch (error) {
            notifyApiError(error, {
              title: t("common:feedback.actionFailed"),
              fallbackDescription: t("common:feedback.actionFailedDesc"),
            });
          }
        },
        { visible: () => showDeleted }
      ),
      CommonRowAction.DELETE((row) => {
        setEditing(row);
        openDeleteModal();
      }),
    ],
    [fetchPages, openModal, openDeleteModal, showDeleted, t]
  );

  return (
    <>
      <DataPage<RateRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.FacilityRentalRate}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      <ModalForm
        ref={modalRef}
        isOpen={isOpen}
        onClose={closeModal}
        title={formMode === "create" ? t("rentalRate.modal.createTitle") : t("rentalRate.modal.editTitle")}
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
          setSubmitting(true);
          try {
            if (formMode === "create") {
              await facilityService.createRentalRate(formRef.current.getValues());
            } else if (editing?.id) {
              await facilityService.updateRentalRate(editing.id, formRef.current.getValues());
            }
            notifySuccess({
              title: formMode === "create" ? t("common:feedback.created") : t("common:feedback.updated"),
            });
            closeModal();
            await fetchPages();
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
        <RentalRateDataForm
          ref={formRef}
          defaultValues={formValues}
          rooms={rooms}
          templates={templates}
          facilityLocked={formMode === "edit"}
        />
      </ModalForm>

      <Modal
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        title={t("rentalRate.modal.deleteSoft")}
        className="max-w-lg mx-4 p-6"
      >
        <DeleteForm
          entityName={t("rentalRate.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            try {
              await facilityService.deleteRentalRate(editing.id, { reason, permanent });
              notifySuccess({ title: t("common:feedback.deleted") });
              closeDeleteModal();
              await fetchPages();
            } catch (error) {
              notifyApiError(error, {
                title: t("common:feedback.deleteFailed"),
                fallbackDescription: t("common:feedback.deleteFailedDesc"),
              });
            }
          }}
        />
      </Modal>

      <Modal
        isOpen={isTemplatesOpen}
        onClose={handleTemplatesClose}
        title={t("rentalRateTemplate.page.title")}
        className="max-w-3xl w-full mx-4 p-6"
      >
        <RentalRateTemplatePanel onChanged={() => void loadTemplates()} />
      </Modal>
    </>
  );
};

export default RentalRateDataPage;
