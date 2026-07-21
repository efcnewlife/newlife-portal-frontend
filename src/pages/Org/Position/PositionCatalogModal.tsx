import {
  orgService,
  type PositionCreate,
  type PositionDetail,
  type PositionUpdate,
} from "@/api/services/orgService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataTable, DataTableToolbar } from "@/components/DataPage";
import DeleteForm from "@/components/DataPage/DeleteForm";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PositionDataForm, { type PositionDataFormHandle, type PositionFormValues } from "./PositionDataForm";

type PositionRow = PositionDetail & Record<string, unknown>;

interface PositionCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogChanged: () => void;
}

const PositionCatalogModal = ({ isOpen, onClose, onCatalogChanged }: PositionCatalogModalProps) => {
  const { t } = useTranslation("org");
  const [items, setItems] = useState<PositionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [descending, setDescending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PositionRow | null>(null);
  const [formValues, setFormValues] = useState<PositionFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const clearSelectionRef = useRef<() => void>(() => {});
  const formRef = useRef<PositionDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const fetchPages = useCallback(async () => {
    clearSelectionRef.current?.();
    setLoading(true);
    try {
      const res = await orgService.getPositionPages({
        page: currentPage - 1,
        page_size: pageSize,
        order_by: orderBy,
        descending,
        deleted: showDeleted || undefined,
      });
      if (res.success) {
        setItems((res.data.items || []) as PositionRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      alert(t("shared.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, orderBy, descending, showDeleted, t]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchPages();
  }, [isOpen, fetchPages]);

  const refreshAfterMutation = useCallback(async () => {
    await fetchPages();
    onCatalogChanged();
  }, [fetchPages, onCatalogChanged]);

  const positionTeamLabel = useCallback(
    (value?: string) => (value ? t(`position.enums.team.${value}`) : ""),
    [t],
  );

  const positionOfficeLabel = useCallback(
    (value?: string) => (value ? t(`position.enums.office.${value}`) : ""),
    [t],
  );

  const columns: DataTableColumn<PositionRow>[] = useMemo(
    () => [
      { key: "code", label: t("position.table.code"), sortable: true, width: "w-32" },
      {
        key: "team",
        label: t("position.table.team"),
        sortable: true,
        width: "w-32",
        render: (value) => positionTeamLabel(String(value || "")),
      },
      {
        key: "office",
        label: t("position.table.office"),
        sortable: true,
        width: "w-32",
        render: (value) => positionOfficeLabel(String(value || "")),
      },
      { key: "name", label: t("position.table.name"), sortable: true, width: "w-40" },
      {
        key: "canOwnMinistry",
        label: t("position.table.canOwnMinistry"),
        width: "w-28",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
      {
        key: "isActive",
        label: t("position.table.isActive"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
    ],
    [t, positionTeamLabel, positionOfficeLabel],
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setFormValues(null);
          openFormModal();
        },
        { visible: !showDeleted },
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
        { className: getRecycleButtonClassName(showDeleted) },
      ),
    ],
    [fetchPages, showDeleted, openFormModal],
  );

  const rowActions: MenuButtonType<PositionRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        async (row) => {
          const res = await orgService.getPositionById(row.id, { all_locales: true });
          if (res.success) {
            const d = res.data;
            setFormMode("edit");
            setEditing(row);
            setFormValues({
              code: d.code,
              team: d.team,
              office: d.office,
              canOwnMinistry: d.canOwnMinistry,
              isActive: d.isActive,
              translations: d.translations,
            });
            openFormModal();
          }
        },
        { visible: !showDeleted },
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          await orgService.restorePositions({ ids: [row.id] });
          await refreshAfterMutation();
        },
        { visible: showDeleted },
      ),
      CommonRowAction.DELETE((row) => {
        setEditing(row);
        openDeleteModal();
      }),
    ],
    [openFormModal, openDeleteModal, refreshAfterMutation, showDeleted],
  );

  return (
    <>
      <Modal
        title={t("position.modal.settingsTitle")}
        isOpen={isOpen}
        onClose={onClose}
        className="max-w-7xl w-full mx-4 p-6"
      >
        <div className="space-y-4 h-[calc(100vh-300px)] flex flex-col">
          <DataTableToolbar buttons={toolbarButtons} resource={Resource.OrgPosition} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <DataTable<PositionRow>
              data={{ page: currentPage, pageSize, total, items }}
              columns={columns}
              loading={loading}
              orderBy={orderBy}
              descending={descending}
              resource={Resource.OrgPosition}
              rowActions={rowActions}
              onSort={(key, desc) => {
                setOrderBy(key || undefined);
                setDescending(!!desc);
              }}
              pagination={{
                onPageChange: setCurrentPage,
                onItemsPerPageChange: (size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
              }}
              onClearSelectionRef={(fn) => {
                clearSelectionRef.current = fn;
              }}
            />
          </div>
        </div>
      </Modal>

      <ModalForm
        ref={modalRef}
        title={formMode === "create" ? t("position.modal.createTitle") : t("position.modal.editTitle")}
        isOpen={isFormOpen}
        onClose={closeFormModal}
        className="max-w-2xl w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeFormModal} disabled={submitting}>
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
              await orgService.createPosition(values as PositionCreate);
            } else if (editing?.id) {
              const { code: _c, ...update } = values;
              await orgService.updatePosition(editing.id, update as PositionUpdate);
            }
            closeFormModal();
            await refreshAfterMutation();
          } catch {
            alert(t("shared.saveFailed"));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <PositionDataForm ref={formRef} mode={formMode} defaultValues={formValues} />
      </ModalForm>

      <Modal
        title={showDeleted ? t("position.modal.deletePermanent") : t("position.modal.deleteSoft")}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-lg w-full mx-4 p-6"
      >
        <DeleteForm
          entityName={t("position.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            setSubmitting(true);
            try {
              await orgService.deletePosition(editing.id, { reason, permanent });
              closeDeleteModal();
              await refreshAfterMutation();
            } catch {
              alert(t("shared.deleteFailed"));
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>
    </>
  );
};

export default PositionCatalogModal;
