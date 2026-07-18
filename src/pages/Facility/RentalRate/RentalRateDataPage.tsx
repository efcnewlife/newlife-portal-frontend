import {
  facilityService,
  type RentalRateItem,
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
import { PopoverPosition, Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatApplicabilitySummary } from "./applicabilityFormat";
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
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RateRow | null>(null);
  const [formValues, setFormValues] = useState<RentalRateFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const formRef = useRef<RentalRateDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  useEffect(() => {
    void facilityService.getRoomList().then((res) => {
      if (res.success) setRooms(res.data.items || []);
    });
  }, []);

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
    } catch {
      alert(t("shared.loadFailed"));
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
      { key: "name", label: t("rentalRate.table.name"), width: "w-32" },
      {
        key: "billingUnit",
        label: t("rentalRate.table.billingUnit"),
        width: "w-28",
        render: (v) => t(`rentalRate.billingUnits.${v}`, { defaultValue: String(v) }),
      },
      {
        key: "unitAmount",
        label: t("rentalRate.table.amount"),
        width: "w-28",
        render: (v, row) => `${v ?? ""} ${row.currency || ""}`.trim(),
      },
      {
        key: "applicability",
        label: t("rentalRate.table.applicability"),
        width: "w-28",
        render: (_v, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatApplicabilitySummary(row.applicability, t)}
          </span>
        ),
      },
      {
        key: "isDefault",
        label: t("rentalRate.table.isDefault"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
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
            billingUnit: "hourly",
            unitAmount: "",
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

  const rowActions: MenuButtonType<RateRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        async (row) => {
          const res = await facilityService.getRentalRateById(row.id, { all_locales: true });
          if (res.success) {
            const d = res.data;
            setFormMode("edit");
            setEditing(row);
            setFormValues({
              facilityId: d.facilityId,
              billingUnit: d.billingUnit,
              unitAmount: String(d.unitAmount),
              currency: d.currency,
              isDefault: d.isDefault,
              isActive: d.isActive,
              applicability: d.applicability ?? null,
              effectiveFrom: d.effectiveFrom,
              effectiveTo: d.effectiveTo,
              name: d.name,
              remark: d.remark,
              translations: d.translations,
            });
            openModal();
          }
        },
        { visible: !showDeleted }
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          await facilityService.restoreRentalRate(row.id);
          await fetchPages();
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
            closeModal();
            await fetchPages();
          } catch {
            alert(t("shared.saveFailed"));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <RentalRateDataForm
          ref={formRef}
          defaultValues={formValues}
          rooms={rooms}
          facilityLocked={formMode === "edit"}
          isCreate={formMode === "create"}
        />
      </ModalForm>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} title={t("rentalRate.modal.deleteSoft")} className="max-w-lg mx-4 p-6">
        <DeleteForm
          entityName={t("rentalRate.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            await facilityService.deleteRentalRate(editing.id, { reason, permanent });
            closeDeleteModal();
            await fetchPages();
          }}
        />
      </Modal>
    </>
  );
};

export default RentalRateDataPage;
