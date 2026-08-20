import {
  facilityService,
  type RoomCreate,
  type RoomDetail,
  type RoomUpdate,
} from "@/api/services/facilityService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import { Button, Modal, ModalForm, type ModalFormHandle, Tooltip } from "@efcnewlife/newlife-ui";
import { Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import RoomDataForm, { type RoomDataFormHandle, type RoomFormValues } from "./RoomDataForm";
import RoomDeleteForm from "./RoomDeleteForm";

type RoomRow = RoomDetail & Record<string, unknown>;

const RoomDataPage = () => {
  const { t } = useTranslation("facility");
  const [items, setItems] = useState<RoomRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [descending, setDescending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RoomRow | null>(null);
  const [editingFormValues, setEditingFormValues] = useState<RoomFormValues | null>(null);
  const [viewing, setViewing] = useState<RoomRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);

  const clearSelectionRef = useRef<() => void>(() => {});
  const formRef = useRef<RoomDataFormHandle>(null);
  const modalFormRef = useRef<ModalFormHandle>(null);

  const fetchPages = useCallback(async () => {
    clearSelectionRef.current?.();
    setLoading(true);
    try {
      const res = await facilityService.getRoomPages({
        page: currentPage - 1,
        page_size: pageSize,
        order_by: orderBy,
        descending,
        deleted: showDeleted || undefined,
      });
      if (res.success) {
        setItems((res.data.items || []) as RoomRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, orderBy, descending, showDeleted, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const columns: DataTableColumn<RoomRow>[] = useMemo(
    () => [
      { key: "code", label: t("room.table.code"), sortable: true, width: "w-32" },
      { key: "name", label: t("room.table.name"), sortable: true, width: "w-40" },
      { key: "roomNumber", label: t("room.table.roomNumber"), sortable: true, width: "w-28" },
      {
        key: "capacity",
        label: t("room.table.capacity"),
        sortable: true,
        width: "w-24",
        render: (v) => (v === null || v === undefined || v === "" ? "—" : String(v)),
      },
      {
        key: "isActive",
        label: t("room.table.isActive"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
      {
        key: "createAt",
        label: t("room.table.createdAt"),
        sortable: true,
        width: "w-40",
        render: (value: unknown) => {
          if (!value) return null;
          return (
            <Tooltip content={DateUtil.format(value as string)}>
              <span className="text-sm text-gray-600 dark:text-gray-400 cursor-help">{DateUtil.friendlyDate(value as string)}</span>
            </Tooltip>
          );
        },
      },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setEditingFormValues(null);
          openModal();
        },
        { visible: !showDeleted }
      ),
      CommonPageButton.REFRESH(() => {
        clearSelectionRef.current?.();
        void fetchPages();
      }),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted((v) => !v);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) }
      ),
    ],
    [fetchPages, showDeleted, openModal]
  );

  const rowActions: MenuButtonType<RoomRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        try {
          setSubmitting(true);
          const res = await facilityService.getRoomById(row.id);
          if (res.success) {
            setViewing(res.data as RoomRow);
            openViewModal();
          }
        } finally {
          setSubmitting(false);
        }
      }),
      CommonRowAction.EDIT(
        async (row) => {
          try {
            setSubmitting(true);
            const res = await facilityService.getRoomById(row.id, { all_locales: true });
            if (res.success) {
              const d = res.data;
              setFormMode("edit");
              setEditing(row);
              setEditingFormValues({
                code: d.code,
                name: d.name || "",
                roomNumber: d.roomNumber,
                capacity: d.capacity,
                isActive: d.isActive,
                description: d.description,
                translations: d.translations,
              });
              openModal();
            }
          } finally {
            setSubmitting(false);
          }
        },
        { visible: !showDeleted }
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          try {
            setSubmitting(true);
            await facilityService.restoreRooms({ ids: [row.id] });
            notifySuccess({ title: t("common:feedback.restored") });
            await fetchPages();
          } catch (error) {
            notifyApiError(error, {
              title: t("common:feedback.actionFailed"),
              fallbackDescription: t("common:feedback.actionFailedDesc"),
            });
          } finally {
            setSubmitting(false);
          }
        },
        { visible: showDeleted }
      ),
      CommonRowAction.DELETE((row) => {
        setEditing(row);
        openDeleteModal();
      }),
    ],
    [fetchPages, openModal, openDeleteModal, openViewModal, showDeleted, t]
  );

  const pagedData = useMemo(
    () => ({ page: currentPage, pageSize, total, items }),
    [currentPage, pageSize, total, items]
  );

  return (
    <>
      <DataPage<RoomRow>
        data={pagedData}
        columns={columns}
        loading={loading}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.FacilityRoom}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onSort={(key, desc) => {
          setOrderBy(key || undefined);
          setDescending(!!desc);
        }}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
        onClearSelectionRef={(fn) => {
          clearSelectionRef.current = fn;
        }}
      />

      <ModalForm
        ref={modalFormRef}
        title={formMode === "create" ? t("room.modal.createTitle") : t("room.modal.editTitle")}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-2xl w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal} disabled={submitting}>
              {t("common:cancel", { ns: "common" })}
            </Button>
            <Button variant="primary" size="sm" onClick={() => modalFormRef.current?.submit()} disabled={submitting}>
              {t("common:save", { ns: "common" })}
            </Button>
          </>
        }
        onSubmit={async (e) => {
          e.preventDefault();
          if (!formRef.current?.validate()) return;
          const values = formRef.current.getValues();
          try {
            setSubmitting(true);
            if (formMode === "create") {
              await facilityService.createRoom(values as RoomCreate);
            } else if (editing?.id) {
              const { code: _c, ...update } = values;
              await facilityService.updateRoom(editing.id, update as RoomUpdate);
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
        <RoomDataForm ref={formRef} mode={formMode} defaultValues={editingFormValues} />
      </ModalForm>

      <Modal
        title={showDeleted ? t("room.modal.deletePermanent") : t("room.modal.deleteSoft")}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-lg w-full mx-4 p-6"
      >
        <RoomDeleteForm
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            try {
              setSubmitting(true);
              await facilityService.deleteRoom(editing.id, { reason, permanent });
              notifySuccess({ title: t("common:feedback.deleted") });
              closeDeleteModal();
              await fetchPages();
            } catch (error) {
              notifyApiError(error, {
                title: t("common:feedback.deleteFailed"),
                fallbackDescription: t("common:feedback.deleteFailedDesc"),
              });
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>

      <Modal title={t("room.modal.detailTitle")} isOpen={isViewOpen} onClose={closeViewModal} className="max-w-2xl w-full mx-4 p-6">
        {viewing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">{t("room.table.code")}</dt>
            <dd>{viewing.code}</dd>
            <dt className="text-gray-500">{t("room.table.name")}</dt>
            <dd>{viewing.name}</dd>
            <dt className="text-gray-500">{t("room.table.roomNumber")}</dt>
            <dd>{viewing.roomNumber}</dd>
            <dt className="text-gray-500">{t("room.table.capacity")}</dt>
            <dd>{viewing.capacity}</dd>
            <dt className="text-gray-500">{t("room.form.description")}</dt>
            <dd className="col-span-1">{viewing.description}</dd>
          </dl>
        )}
      </Modal>
    </>
  );
};

export default RoomDataPage;
