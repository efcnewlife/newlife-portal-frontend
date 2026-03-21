import { permissionService } from "@/api";
import type { PermissionDetail as ApiPermissionDetail, PermissionPageItem } from "@/types/api";
import type { DataTableColumn, MenuButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import RestoreForm from "@/components/DataPage/RestoreForm";
import { Modal } from "@efcnewlife/newlife-ui";
import { PopoverPosition, Resource } from "@/const/enums";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/hooks/useModal";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdCheck, MdClose } from "react-icons/md";
import PermissionDataForm, { type PermissionFormValues } from "./PermissionDataForm";
import PermissionDeleteForm from "./PermissionDeleteForm";
import PermissionDetailView from "./PermissionDetailView";
import PermissionSearchPopover, { type PermissionSearchFilters } from "./PermissionSearchPopover";

export default function PermissionDataPage() {
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

  // Fetch function - useRef avoids unnecessary re-creation
  const fetchPagesRef = useRef({
    currentPage,
    pageSize,
    orderBy,
    descending,
    appliedFilters,
    showDeleted,
  });

  // Update ref when dependencies change
  fetchPagesRef.current = {
    currentPage,
    pageSize,
    orderBy,
    descending,
    appliedFilters,
    showDeleted,
  };

  const fetchPages = useCallback(async () => {
    // Clear selected rows before fetching pages
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
          title: "Load Failed",
          description: response.message || "Unable to load permission data.",
          position: "top-right",
        });
        setItems([]);
        setTotal(0);
      }
    } catch (e) {
      console.error("Error fetching permission pages:", e);
      showNotification({
        variant: "error",
        title: "Load Failed",
        description: "Unable to load permission data. Please try again later.",
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]); // Include showNotification dependency

  // Columns definition
  const columns: DataTableColumn<PermissionPageItem>[] = useMemo(
    () => [
      {
        key: "displayName",
        label: "Display Name",
        width: "w-48",
        tooltip: (row) => row.displayName,
      },
      {
        key: "code",
        label: "Code",
        sortable: true,
        width: "w-48",
        tooltip: (row) => row.code,
        render: (_value: unknown, row: PermissionPageItem) => (
          <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">{row.code}</code>
        ),
      },
      {
        key: "isActive",
        label: "Status",
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
        label: "Resource",
        width: "w-36",
        tooltip: (row) => row.resourceName,
      },
      {
        key: "verbName",
        label: "Action",
        width: "w-24",
        tooltip: (row) => row.verbName,
      },
      {
        key: "description",
        label: "Description",
        width: "w-72",
        render: (_value: unknown, row: PermissionPageItem) => (
          <span className="text-gray-600 dark:text-gray-400 truncate max-w-xs">{row.description || "-"}</span>
        ),
      },
    ],
    [],
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
        title: "Restore Successful",
        description: `Successfully restored ${ids.length} permissions.`,
      });
      await fetchPages();
      closeRestoreModal();
      setSelectedKeys([]);
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: "Restore Failed",
        description: "Unable to restore permissions. Please try again later.",
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toolbar buttons
  const toolbarButtons = useMemo(() => {
    // Use popoverCallback mode with a unified trigger style
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
          onOpenChange(false); // Close popover after search
        }}
        onClear={() => {
          setSearchFilters({});
          setAppliedFilters({});
          setCurrentPage(1);
          onOpenChange(false); // Close popover after clearing filters
        }}
        trigger={trigger}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    const buttons = [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: { title: "Search Permissions", position: PopoverPosition.BottomLeft, width: "400px" },
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
        },
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
        { className: getRecycleButtonClassName(showDeleted) },
      ),
    ];

    return buttons;
  }, [openModal, fetchPages, searchFilters, showDeleted, selectedKeys, handleBulkRestore]);

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
            // Fetch full permission details (including resourceId and verbId)
            const response = await permissionService.getById(row.id);
            if (response.success) {
              const detail: ApiPermissionDetail = response.data;
              setFormMode("edit");
              setEditing(row);
              // Convert to form values
              setEditingFormValues({
                id: detail.id,
                displayName: detail.displayName,
                code: detail.code,
                resourceId: detail.resource.id,
                verbId: detail.verb.id,
                isActive: detail.isActive,
                description: detail.description || "",
                remark: detail.remark || "",
              });
              openModal();
            } else {
              showNotification({
                variant: "error",
                title: "Load Failed",
                description: "Unable to load permission details. Please try again later.",
                position: "top-right",
              });
            }
          } catch (e) {
            console.error("Error fetching permission detail:", e);
            showNotification({
              variant: "error",
              title: "Load Failed",
              description: "Unable to load permission details. Please try again later.",
              position: "top-right",
            });
          } finally {
            setSubmitting(false);
          }
        },
        {
          visible: !showDeleted, // Show only in normal mode
        },
      ),
      CommonRowAction.RESTORE(
        async (row: PermissionPageItem) => {
          handleSingleRestore(row);
        },
        {
          visible: showDeleted, // Show only in recycle mode
        },
      ),
      CommonRowAction.DELETE(
        (row: PermissionPageItem) => {
          setEditing(row);
          openDeleteModal();
        },
        {
          text: showDeleted ? "Delete Permanently" : "Delete",
        },
      ),
    ],
    [openModal, openDeleteModal, openViewModal, showDeleted, fetchPages, setSubmitting, showNotification],
  );

  // Submit handlers
  const handleSubmit = async (values: PermissionFormValues) => {
    try {
      setSubmitting(true);
      if (formMode === "create") {
        await permissionService.create(values);
        showNotification({
          variant: "success",
          title: "Permission Created",
          description: `Successfully created permission "${values.displayName}".`,
        });
      } else if (formMode === "edit" && editing?.id) {
        await permissionService.update(editing.id, values);
        showNotification({
          variant: "success",
          title: "Permission Updated",
          description: `Successfully updated permission "${values.displayName}".`,
        });
      }
      closeModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: "Save Failed",
        description: "Unable to save permission data. Please try again later.",
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
        title: permanent ? "Permission Permanently Deleted" : "Permission Deleted",
        description: `Successfully ${permanent ? "permanently deleted" : "deleted"} permission "${deletedPermission.displayName}".`,
      });
      closeDeleteModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: "Delete Failed",
        description: "Unable to delete permission. Please try again later.",
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
        title={formMode === "create" ? "Create Permission" : "Edit Permission"}
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
        title={showDeleted ? "Confirm Permanent Permission Deletion" : "Confirm Permission Deletion"}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <PermissionDeleteForm onSubmit={handleDelete} onCancel={closeDeleteModal} submitting={submitting} isPermanent={showDeleted} />
      </Modal>

      <Modal title="Restore Permission" isOpen={isRestoreOpen} onClose={closeRestoreModal} className="max-w-[500px] w-full mx-4 p-6">
        <RestoreForm
          ids={restoreIds}
          entityName="permission"
          onSubmit={handleRestoreConfirm}
          onCancel={closeRestoreModal}
          submitting={submitting}
        />
      </Modal>

      <Modal title="Permission Details" isOpen={isViewOpen} onClose={closeViewModal} className="max-w-[800px] w-full mx-4 p-6">
        {viewing && <PermissionDetailView permissionId={viewing.id} />}
      </Modal>
    </>
  );
}
