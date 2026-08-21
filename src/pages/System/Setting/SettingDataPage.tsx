import { settingService, type SettingItem } from "@/api/services/settingService";
import type { DataTableColumn, MenuButtonType, PageButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import DeleteForm from "@/components/DataPage/DeleteForm";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import { PopoverPosition, Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import type { ApiError } from "@/types/api";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SettingDataForm, { toSettingCreate, toSettingUpdate, type SettingDataFormHandle } from "./SettingDataForm";
import SettingSearchPopover, { type SettingSearchFilters } from "./SettingSearchPopover";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";

type SettingRow = SettingItem & Record<string, unknown>;

const formatValuePreview = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
};

const SettingDataPage = () => {
  const { t } = useTranslation();
  const [allItems, setAllItems] = useState<SettingRow[]>([]);
  const [searchFilters, setSearchFilters] = useState<SettingSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<SettingSearchFilters>({});
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [descending, setDescending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<SettingRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const clearSelectionRef = useRef<() => void>(() => {});
  const formRef = useRef<SettingDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const fetchList = useCallback(async () => {
    clearSelectionRef.current?.();
    setLoading(true);
    try {
      const namespace = appliedFilters.namespace?.trim() || undefined;
      const res = await settingService.list({
        namespace,
        deleted: showDeleted || undefined,
      });
      if (res.success) {
        setAllItems((res.data.items || []) as SettingRow[]);
        setCurrentPage(1);
      } else {
        setAllItems([]);
      }
    } catch (error) {
      setAllItems([]);
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, showDeleted, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const sortedItems = useMemo(() => {
    const items = [...allItems];
    if (!orderBy) return items;
    const key = orderBy as keyof SettingRow;
    items.sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const as = av == null ? "" : String(av);
      const bs = bv == null ? "" : String(bv);
      const cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: "base" });
      return descending ? -cmp : cmp;
    });
    return items;
  }, [allItems, orderBy, descending]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const columns: DataTableColumn<SettingRow>[] = useMemo(
    () => [
      { key: "namespace", label: t("system:setting.table.namespace"), sortable: true, width: "w-32" },
      { key: "settingKey", label: t("system:setting.table.settingKey"), sortable: true, width: "w-40" },
      { key: "valueType", label: t("system:setting.table.valueType"), sortable: true, width: "w-28" },
      {
        key: "value",
        label: t("system:setting.table.value"),
        width: "w-56",
        render: (value) => (
          <span className="block truncate max-w-xs" title={formatValuePreview(value)}>
            {formatValuePreview(value)}
          </span>
        ),
      },
      {
        key: "isActive",
        label: t("system:setting.table.isActive"),
        width: "w-24",
        render: (v) => (v ? t("common:yes") : t("common:no")),
      },
      {
        key: "remark",
        label: t("system:setting.table.remark"),
        width: "w-40",
        render: (v) => (v == null || v === "" ? t("system:shared.notSet") : String(v)),
      },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(() => {
    const searchPopoverCallback = ({
      isOpen,
      onOpenChange,
      trigger,
      popover,
    }: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      trigger: React.ReactNode;
      popover: PopoverType;
    }) => (
      <SettingSearchPopover
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        onSearch={(filters) => {
          setAppliedFilters({
            namespace: filters.namespace?.trim() || undefined,
          });
          setCurrentPage(1);
          onOpenChange(false);
        }}
        onClear={() => {
          setSearchFilters({});
          setAppliedFilters({});
          setCurrentPage(1);
          onOpenChange(false);
        }}
        trigger={trigger}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    return [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: {
          title: t("system:setting.search.popoverTitle"),
          position: PopoverPosition.BottomLeft,
          width: "420px",
        },
      }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          openFormModal();
        },
        { visible: !showDeleted }
      ),
      CommonPageButton.REFRESH(() => {
        clearSelectionRef.current?.();
        void fetchList();
      }),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted((v) => !v);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) }
      ),
    ];
  }, [fetchList, openFormModal, searchFilters, showDeleted, t]);

  const rowActions: MenuButtonType<SettingRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        async (row) => {
          try {
            const res = await settingService.getById(row.id);
            if (res.success) {
              setFormMode("edit");
              setEditing(res.data as SettingRow);
              openFormModal();
            } else {
              notifyApiError(
                { code: 400, message: "" },
                { title: t("common:feedback.loadFailed"), fallbackDescription: t("common:feedback.loadFailedDesc") }
              );
            }
          } catch (error) {
            notifyApiError(error, {
              title: t("common:feedback.loadFailed"),
              fallbackDescription: t("common:feedback.loadFailedDesc"),
            });
          }
        },
        { visible: () => !showDeleted }
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          try {
            setSubmitting(true);
            await settingService.restore([row.id]);
            notifySuccess({ title: t("common:feedback.restored") });
            await fetchList();
          } catch (error) {
            const apiError = error as ApiError;
            notifyApiError(apiError ?? error, {
              title: t("common:feedback.actionFailed"),
              fallbackDescription: t("common:feedback.actionFailedDesc"),
            });
          } finally {
            setSubmitting(false);
          }
        },
        { visible: () => showDeleted }
      ),
      CommonRowAction.DELETE(
        (row) => {
          setEditing(row);
          openDeleteModal();
        },
        {
          text: showDeleted ? t("common:deletePermanently") : t("common:delete"),
          visible: (row) => !row.isBuiltIn,
        }
      ),
    ],
    [fetchList, openDeleteModal, openFormModal, showDeleted, t]
  );

  return (
    <>
      <DataPage<SettingRow>
        data={{
          page: currentPage,
          pageSize,
          total: sortedItems.length,
          items: pagedItems,
        }}
        columns={columns}
        loading={loading}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.SystemSetting}
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
        ref={modalRef}
        title={formMode === "create" ? t("system:setting.modal.createTitle") : t("system:setting.modal.editTitle")}
        isOpen={isFormOpen}
        onClose={() => {
          closeFormModal();
          setEditing(null);
        }}
        className="max-w-2xl w-full mx-4 p-6"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                closeFormModal();
                setEditing(null);
              }}
              disabled={submitting}
            >
              {t("common:cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={() => modalRef.current?.submit()} disabled={submitting}>
              {t("common:save")}
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
              await settingService.create(toSettingCreate(values));
              notifySuccess({ title: t("common:feedback.created") });
            } else {
              if (!editing?.id) return;
              await settingService.update(editing.id, toSettingUpdate(values));
              notifySuccess({ title: t("common:feedback.updated") });
            }
            closeFormModal();
            setEditing(null);
            await fetchList();
          } catch (error) {
            const apiError = error as ApiError;
            notifyApiError(apiError ?? error, {
              title: t("common:feedback.saveFailed"),
              fallbackDescription: t("common:feedback.saveFailedDesc"),
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {(formMode === "create" || editing) && <SettingDataForm ref={formRef} mode={formMode} setting={editing} />}
      </ModalForm>

      <Modal
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[600px] p-5 lg:p-10"
        showCloseButton={false}
      >
        <DeleteForm
          entityName={t("system:setting.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async (payload) => {
            if (!editing?.id) return;
            setSubmitting(true);
            try {
              await settingService.delete(editing.id, {
                reason: payload.reason,
                permanent: payload.permanent ?? showDeleted,
              });
              notifySuccess({ title: t("common:feedback.deleted") });
              closeDeleteModal();
              setEditing(null);
              await fetchList();
            } catch (error) {
              const apiError = error as ApiError;
              notifyApiError(apiError ?? error, {
                title: t("common:feedback.deleteFailed"),
                fallbackDescription: t("common:feedback.deleteFailedDesc"),
              });
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>
    </>
  );
};

export default SettingDataPage;
