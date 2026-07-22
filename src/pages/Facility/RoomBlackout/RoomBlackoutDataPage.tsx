import {
  facilityService,
  type RoomBlackoutCreate,
  type RoomBlackoutItem,
  type RoomBlackoutUpdate,
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
import RoomBlackoutDataForm, {
  type RoomBlackoutDataFormHandle,
  type RoomBlackoutFormValues,
} from "./RoomBlackoutDataForm";

type BlackoutRow = RoomBlackoutItem & Record<string, unknown>;

const toApiPayload = (values: RoomBlackoutFormValues): RoomBlackoutCreate => {
  if (values.kind === "one_off") {
    return {
      facilityId: values.facilityId,
      name: values.name,
      reason: values.reason,
      kind: "one_off",
      blackoutDate: values.blackoutDate,
      startTime: values.startTime,
      endTime: values.endTime,
      isActive: values.isActive ?? true,
    };
  }
  return {
    facilityId: values.facilityId,
    name: values.name,
    reason: values.reason,
    kind: "recurring",
    daysOfWeek: values.daysOfWeek,
    startTime: values.startTime,
    endTime: values.endTime,
    isActive: values.isActive ?? true,
    effectiveFrom: values.effectiveFrom,
    effectiveTo: values.effectiveTo,
  };
};

const RoomBlackoutDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<BlackoutRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchFilters, setSearchFilters] = useState<FacilityRoomScopedSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<FacilityRoomScopedSearchFilters>({});
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<BlackoutRow | null>(null);
  const [formValues, setFormValues] = useState<RoomBlackoutFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const formRef = useRef<RoomBlackoutDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);
  const clearSelectionRef = useRef<() => void>(() => {});

  const roomNameById = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((r) => map.set(r.id, r.name ? `${r.code} - ${r.name}` : r.code));
    return map;
  }, [rooms]);

  useEffect(() => {
    void facilityService.getRoomList().then((res) => {
      if (res.success) setRooms(res.data.items || []);
    });
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getRoomBlackoutPages({
        page: currentPage - 1,
        page_size: pageSize,
        deleted: showDeleted || undefined,
        keyword: appliedFilters.keyword?.trim() || undefined,
        facilityId: appliedFilters.facilityId,
      });
      if (res.success) {
        setItems((res.data.items || []) as BlackoutRow[]);
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

  const columns: DataTableColumn<BlackoutRow>[] = useMemo(
    () => [
      { key: "name", label: t("roomBlackout.table.name"), width: "w-36" },
      {
        key: "facilityId",
        label: t("roomBlackout.table.scope"),
        width: "w-40",
        render: (v) => (v ? roomNameById.get(String(v)) || String(v) : t("roomBlackout.form.allRooms")),
      },
      {
        key: "kind",
        label: t("roomBlackout.table.kind"),
        width: "w-28",
        render: (v) => t(`roomBlackout.kind.${String(v)}`),
      },
      {
        key: "blackoutDate",
        label: t("roomBlackout.table.dateOrDays"),
        width: "w-40",
        render: (_v, row) => {
          if (row.kind === "one_off") return String(row.blackoutDate || "");
          return (Array.isArray(row.daysOfWeek) ? row.daysOfWeek : [])
            .map((day) => t(`roomSlotTemplate.days.${day}`))
            .join(", ");
        },
      },
      {
        key: "startTime",
        label: t("roomBlackout.table.startTime"),
        width: "w-24",
        render: (v) => String(v).slice(0, 5),
      },
      {
        key: "endTime",
        label: t("roomBlackout.table.endTime"),
        width: "w-24",
        render: (v) => String(v).slice(0, 5),
      },
      { key: "reason", label: t("roomBlackout.table.reason"), width: "w-40" },
      {
        key: "isActive",
        label: t("roomBlackout.table.isActive"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
    ],
    [roomNameById, t]
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
        keywordLabel={t("roomBlackout.search.keywordLabel")}
        keywordPlaceholder={t("roomBlackout.search.keywordPlaceholder")}
        trigger={trigger}
        isOpen={searchOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    return [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: {
          title: t("roomBlackout.search.popoverTitle"),
          position: PopoverPosition.BottomLeft,
          width: "420px",
        },
      }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setFormValues({
            facilityId: appliedFilters.facilityId || null,
            name: "",
            reason: "",
            kind: "one_off",
            blackoutDate: "",
            daysOfWeek: [0, 1, 2, 3, 4],
            startTime: "09:00",
            endTime: "17:00",
            isActive: true,
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

  const rowActions: MenuButtonType<BlackoutRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        async (row) => {
          const res = await facilityService.getRoomBlackoutById(row.id);
          if (res.success) {
            const d = res.data;
            setFormMode("edit");
            setEditing(row);
            setFormValues({
              facilityId: d.facilityId ?? null,
              name: d.name,
              reason: d.reason,
              kind: d.kind,
              blackoutDate: d.blackoutDate,
              daysOfWeek: d.daysOfWeek ?? [0, 1, 2, 3, 4],
              startTime: d.startTime,
              endTime: d.endTime,
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
          await facilityService.restoreRoomBlackout(row.id);
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
      <DataPage<BlackoutRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.FacilityRoomBlackout}
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
        title={formMode === "create" ? t("roomBlackout.modal.createTitle") : t("roomBlackout.modal.editTitle")}
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
          const payload = toApiPayload(values);
          setSubmitting(true);
          try {
            if (formMode === "create") {
              await facilityService.createRoomBlackout(payload);
            } else if (editing?.id) {
              await facilityService.updateRoomBlackout(editing.id, payload as RoomBlackoutUpdate);
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
        <RoomBlackoutDataForm ref={formRef} defaultValues={formValues} rooms={rooms} />
      </ModalForm>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} title={t("roomBlackout.modal.deleteSoft")} className="max-w-lg mx-4 p-6">
        <DeleteForm
          entityName={t("roomBlackout.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            await facilityService.deleteRoomBlackout(editing.id, { reason, permanent });
            closeDeleteModal();
            await fetchPages();
          }}
        />
      </Modal>
    </>
  );
};

export default RoomBlackoutDataPage;
