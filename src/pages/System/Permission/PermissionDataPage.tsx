import { permissionService } from "@/api";
import type { PermissionCreate, PermissionDetail as ApiPermissionDetail, PermissionPageItem, PermissionUpdate } from "@/types/api";
import type { DataTableColumn, MenuButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import RestoreForm from "@/components/DataPage/RestoreForm";
import { Modal } from "@efcnewlife/newlife-ui";
import { PopoverPosition, Resource } from "@/const/enums";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/hooks/useModal";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdCheck, MdClose } from "react-icons/md";
import PermissionDataForm, { type PermissionFormValues } from "./PermissionDataForm";
import PermissionDeleteForm from "./PermissionDeleteForm";
import PermissionDetailView from "./PermissionDetailView";
import PermissionSearchPopover, { type PermissionSearchFilters } from "./PermissionSearchPopover";

const mapPermissionFormValuesToPayload = (values: PermissionFormValues): PermissionCreate => {
  return {
    name: values.name,
    code: values.code,
    resource_id: values.resourceId,
    verb_id: values.verbId,
    is_active: values.isActive,
    description: values.description,
    remark: values.remark,
    translations: values.translations,
  };
};

export default function PermissionDataPage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1); // 1-based for UI
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<PermissionSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<PermissionSearchFilters>({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [orderBy, setOrderBy] = useState<string>();
  const [descending, setDescending] = useState<boolean>();

  const [items, setItems] = useState<PermissionPageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Notification
  const { showNotification } = useNotification();

  // Modal state
  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);
  const { isOpen: isRestoreOpen, openModal: openRestoreModal, closeModal: closeRestoreModal } = useModal(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PermissionPageItem | null>(null);
  const [editingFormValues, setEditingFormValues] = useState<PermissionFormValues | null>(null);
  const [viewing, setViewing] = useState<PermissionPageItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restoreIds, setRestoreIds] = useState<string[]>([]);

  const clearSelectionRef = useRef<(() => void) | null>(null);

  // Fetch function: use a ref to avoid recreating the callback unnecessarily
  const fetchPagesRef = useRef({
    currentPage,
    pageSize,
    orderBy,
    descending,
    appliedFilters,
    showDeleted,
  });

  // Keep ref in sync when dependencies change
  fetchPagesRef.current = {
    currentPage,
    pageSize,
    orderBy,
    descending,
    appliedFilters,
    showDeleted,
  };

  const fetchPages = useCallback(async () => {
    // Clear row selection before fetching
    clearSelectionRef.current?.();

    const { currentPage, pageSize, orderBy, descending, appliedFilters, showDeleted } = fetchPagesRef.current;

    setLoading(true);
    try {
      const params = {
        page: Math.max(0, currentPage - 1),
        page_size: pageSize,
        order_by: orderBy && orderBy.trim() !== "" ? orderBy : undefined,
        descending: orderBy && orderBy.trim() !== "" ? descending : undefined,
        keyword: appliedFilters.keyword || undefined,
        is_active: appliedFilters.isActive,
        deleted: showDeleted || undefined,
      } as Record<string, unknown>;

      const response = await permissionService.pages(params);
      if (response.success) {
        const data = response.data;
        console.log("API Response:", data);
        setItems(data.items || []);
        setTotal(data.total);
        // Backend page is 0-based; map back to 1-based UI if changed externally
        setCurrentPage(data.page + 1);
      } else {
        console.error("Failed to fetch permissions:", response.message);
        showNotification({
          variant: "error",
          title: t("system:permission.feedback.load.title"),
          description: `${t("system:permission.feedback.load.desc")} ${t("system:permission.feedback.load.retryDesc")}`,
          position: "top-right",
        });
        setItems([]);
        setTotal(0);
      }
    } catch (e) {
      console.error("Error fetching permission pages:", e);
      showNotification({
        variant: "error",
        title: t("system:permission.feedback.load.title"),
        description: `${t("system:permission.feedback.load.desc")} ${t("system:permission.feedback.load.retryDesc")}`,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification, t]); // showNotification is intentionally included

  // Columns definition
  const columns: DataTableColumn<PermissionPageItem>[] = useMemo(
    () => [
      {
        key: "name",
        label: t("system:permission.table.displayName"),
        width: "w-48",
        tooltip: (row) => String(row.name ?? ""),
      },
      {
        key: "code",
        label: t("system:permission.table.code"),
        sortable: true,
        width: "w-48",
        tooltip: (row) => row.code,
        render: (_value: unknown, row: PermissionPageItem) => (
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">{row.code}</code>
        ),
      },
      {
        key: "isActive",
        label: t("system:permission.table.status"),
        sortable: true,
        width: "w-20",
        render: (_value: unknown, row: PermissionPageItem) => {
          return (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                row.isActive
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
              }`}
            >
              {row.isActive ? <MdCheck size={16} /> : <MdClose size={16} />}
            </span>
          );
        },
      },
      {
        key: "resourceName",
        label: t("system:permission.table.resource"),
        width: "w-36",
        tooltip: (row) => row.resourceName,
      },
      {
        key: "verbName",
        label: t("system:permission.table.action"),
        width: "w-24",
        tooltip: (row) => row.verbName,
      },
      {
        key: "description",
        label: t("system:permission.table.description"),
        width: "w-72",
        render: (_value: unknown, row: PermissionPageItem) => (
          <span className="text-gray-600 dark:text-gray-400 truncate max-w-xs">{row.description || t("common:none")}</span>
        ),
      },
    ],
    [t]
  );

  // Toolbar buttons

  // Trigger fetch on dependencies change
  useEffect(() => {
    fetchPages();
  }, [currentPage, pageSize, orderBy, descending, appliedFilters, showDeleted, fetchPages]);

  // Event handlers wired to DataPage
  const handleSort = (columnKey: string | null, newDescending: boolean) => {
    if (columnKey === null) {
      // Clear sorting
      setOrderBy("");
      setDescending(false);
    } else {
      setOrderBy(columnKey);
      setDescending(newDescending);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleRowSelect = (_selectedRows: PermissionPageItem[], selectedKeys: string[]) => {
    setSelectedKeys(selectedKeys);
  };

  const handleBulkRestore = useCallback(async () => {
    setRestoreIds(selectedKeys);
    openRestoreModal();
  }, [selectedKeys, openRestoreModal]);

  const handleSingleRestore = async (row: PermissionPageItem) => {
    setRestoreIds([row.id]);
    openRestoreModal();
  };

  const handleRestoreConfirm = async (ids: string[]) => {
    try {
      setSubmitting(true);
      await permissionService.restore(ids);
      showNotification({
        variant: "success",
        title: t("system:permission.feedback.restoreSuccess.title"),
        description: t("system:permission.feedback.restoreSuccess.desc", { count: ids.length }),
      });
      await fetchPages();
      closeRestoreModal();
      setSelectedKeys([]);
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:permission.feedback.restoreFailed.title"),
        description: t("system:permission.feedback.restoreFailed.desc"),
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toolbar buttons
  const toolbarButtons = useMemo(() => {
    // popoverCallback pattern with a unified trigger style
    const searchPopoverCallback = ({
      isOpen,
      onOpenChange,
      trigger,
      popover,
    }: {
      isOpen: boolean;
      onOpenChange: (open: boolean) => void;
      trigger: ReactNode;
      popover: PopoverType;
    }) => (
      <PermissionSearchPopover
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        onSearch={(filters) => {
          setAppliedFilters(filters);
          setCurrentPage(1);
          onOpenChange(false); // Close popover after applying search
        }}
        onClear={() => {
          setSearchFilters({});
          setAppliedFilters({});
          setCurrentPage(1);
          onOpenChange(false); // Close popover after clear
        }}
        trigger={trigger}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    const buttons = [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: { title: t("system:permission.search.popoverTitle"), position: PopoverPosition.BottomLeft, width: "400px" },
      }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setEditingFormValues(null);
          openModal();
        },
        {
          visible: !showDeleted,
        }
      ),
      CommonPageButton.RESTORE(handleBulkRestore, {
        visible: showDeleted,
        disabled: selectedKeys.length === 0,
      }),
      CommonPageButton.REFRESH(() => {
        fetchPages();
      }),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted(!showDeleted);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) }
      ),
    ];

    return buttons;
  }, [openModal, fetchPages, searchFilters, showDeleted, selectedKeys, handleBulkRestore, t]);

  // Row actions
  const rowActions: MenuButtonType<PermissionPageItem>[] = useMemo(
    () => [
      CommonRowAction.VIEW((row: PermissionPageItem) => {
        setViewing(row);
        openViewModal();
      }),
      CommonRowAction.EDIT(
        async (row: PermissionPageItem) => {
          try {
            setSubmitting(true);
            // Load full permission detail (includes resourceId and verbId)
            const response = await permissionService.getById(row.id);
            if (response.success) {
              const detail: ApiPermissionDetail = response.data;
              setFormMode("edit");
              setEditing(row);
              // Map API detail to form values
              setEditingFormValues({
                id: detail.id,
                name: detail.name,
                code: detail.code,
                resourceId: detail.resource.id,
                verbId: detail.verb.id,
                isActive: detail.isActive,
                description: detail.description || "",
                remark: detail.remark || "",
                translations: detail.translations,
              });
              openModal();
            } else {
              showNotification({
                variant: "error",
                title: t("system:permission.feedback.detailLoad.title"),
                description: t("system:permission.feedback.detailLoad.failure"),
                position: "top-right",
              });
            }
          } catch (e) {
            console.error("Error fetching permission detail:", e);
            showNotification({
              variant: "error",
              title: t("system:permission.feedback.detailLoad.title"),
              description: t("system:permission.feedback.detailLoad.failure"),
              position: "top-right",
            });
          } finally {
            setSubmitting(false);
          }
        },
        {
          visible: !showDeleted, // Only when not in trash mode
        }
      ),
      CommonRowAction.RESTORE(
        async (row: PermissionPageItem) => {
          handleSingleRestore(row);
        },
        {
          visible: showDeleted, // Only in trash mode
        }
      ),
      CommonRowAction.DELETE(
        (row: PermissionPageItem) => {
          setEditing(row);
          openDeleteModal();
        },
        {
          text: showDeleted ? t("common:deletePermanently") : t("common:delete"),
        }
      ),
    ],
    [openModal, openDeleteModal, openViewModal, showDeleted, fetchPages, showNotification, t]
  );

  // Submit handlers
  const handleSubmit = async (values: PermissionFormValues) => {
    try {
      setSubmitting(true);
      const payload: PermissionCreate | PermissionUpdate = mapPermissionFormValuesToPayload(values);
      if (formMode === "create") {
        await permissionService.create(payload);
        showNotification({
          variant: "success",
          title: t("system:permission.feedback.createSuccess.title"),
          description: t("system:permission.feedback.createSuccess.desc", { name: values.name }),
        });
      } else if (formMode === "edit" && editing?.id) {
        await permissionService.update(editing.id, payload);
        showNotification({
          variant: "success",
          title: t("system:permission.feedback.updateSuccess.title"),
          description: t("system:permission.feedback.updateSuccess.desc", { name: values.name }),
        });
      }
      closeModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:permission.feedback.saveFailed.title"),
        description: t("system:permission.feedback.saveFailed.desc"),
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async ({ reason, permanent }: { reason?: string; permanent?: boolean }) => {
    try {
      setSubmitting(true);
      if (!editing?.id) return;
      const deletedPermission = editing;
      await permissionService.remove(editing.id, { reason, permanent: !!permanent });
      showNotification({
        variant: "success",
        title: permanent ? t("system:permission.feedback.deleteSuccessPermanent.title") : t("system:permission.feedback.deleteSuccessSoft.title"),
        description: permanent
          ? t("system:permission.feedback.deletePermanentSuccess.desc", { name: deletedPermission.name })
          : t("system:permission.feedback.deleteSoftSuccess.desc", { name: deletedPermission.name }),
      });
      closeDeleteModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:permission.feedback.deleteFailed.title"),
        description: t("system:permission.feedback.deleteFailed.desc"),
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pagedData = useMemo(() => {
    const data = {
      page: currentPage,
      pageSize,
      total,
      items,
    };
    return data;
  }, [currentPage, pageSize, total, items]);

  return (
    <>
      <DataPage<PermissionPageItem>
        data={pagedData}
        columns={columns}
        loading={loading}
        singleSelect={!showDeleted}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.SystemPermission}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        onRowSelect={handleRowSelect}
        onClearSelectionRef={(clearFn) => {
          clearSelectionRef.current = clearFn;
        }}
      />

      <Modal
        title={formMode === "create" ? t("system:permission.modal.createTitle") : t("system:permission.modal.editTitle")}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[800px] w-full mx-4 p-6"
      >
        <PermissionDataForm
          mode={formMode}
          defaultValues={editingFormValues}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>

      <Modal
        title={showDeleted ? t("system:permission.modal.deleteConfirmPermanent.title") : t("system:permission.modal.deleteConfirmSoft.title")}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <PermissionDeleteForm onSubmit={handleDelete} onCancel={closeDeleteModal} submitting={submitting} isPermanent={showDeleted} />
      </Modal>

      <Modal title={t("system:permission.modal.restoreTitle")} isOpen={isRestoreOpen} onClose={closeRestoreModal} className="max-w-[500px] w-full mx-4 p-6">
        <RestoreForm
          ids={restoreIds}
          entityName={t("system:permission.restoreForm.entityLabel")}
          onSubmit={handleRestoreConfirm}
          onCancel={closeRestoreModal}
          submitting={submitting}
        />
      </Modal>

      <Modal title={t("system:permission.modal.detailTitle")} isOpen={isViewOpen} onClose={closeViewModal} className="max-w-[800px] w-full mx-4 p-6">
        {viewing && <PermissionDetailView permissionId={viewing.id} />}
      </Modal>
    </>
  );
}
