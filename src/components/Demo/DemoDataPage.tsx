import { demoService, type DemoDetail as ApiDemoDetail, type DemoPagesResponse } from "@/api/services/demoService";
import type { DataTableColumn, MenuButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage, SearchPopoverContent } from "@/components/DataPage";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import RestoreForm from "@/components/DataPage/RestoreForm";
import { Modal } from "@/components/ui/modal";
import Tooltip from "@/components/ui/tooltip";
import { Gender, PopoverPosition } from "@/const/enums";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import DemoDataForm, { type DemoFormValues } from "./DemoDataForm";
import DemoDeleteForm from "./DemoDeleteForm";

type DemoDetail = ApiDemoDetail & {
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
} & Record<string, unknown>;

export default function DemoDataPage() {
  const [currentPage, setCurrentPage] = useState(1); // 1-based for UI
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [orderBy, setOrderBy] = useState<string>();
  const [descending, setDescending] = useState<boolean>();

  const [items, setItems] = useState<DemoDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Notification
  const { showNotification } = useNotification();

  // Modal state
  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const { isOpen: isRestoreOpen, openModal: openRestoreModal, closeModal: closeRestoreModal } = useModal(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<DemoDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restoreIds, setRestoreIds] = useState<string[]>([]);

  // Fetch function - use useRef to avoid unnecessary re-creations
  const fetchPagesRef = useRef({
    currentPage,
    pageSize,
    orderBy,
    descending,
    keyword,
    showDeleted,
  });

  // Update ref when dependencies change
  fetchPagesRef.current = {
    currentPage,
    pageSize,
    orderBy,
    descending,
    keyword,
    showDeleted,
  };

  const fetchPages = useCallback(async () => {
    const { currentPage, pageSize, orderBy, descending, keyword, showDeleted } = fetchPagesRef.current;

    setLoading(true);
    try {
      const params = {
        page: Math.max(0, currentPage - 1),
        page_size: pageSize,
        order_by: orderBy && orderBy.trim() !== "" ? orderBy : undefined,
        descending: orderBy && orderBy.trim() !== "" ? descending : undefined,
        keyword: keyword || undefined,
        deleted: showDeleted || undefined,
      } as Record<string, unknown>;

      const res = await demoService.getPages(params);
      const data = res.data as DemoPagesResponse;
      setItems((data.items || []) as DemoDetail[]);
      setTotal(data.total);
      // Backend page is 0-based; map back to 1-based UI if changed externally
      setCurrentPage(data.page + 1);
      setPageSize(data.page_size);
    } catch (e) {
      console.error("Error fetching pages:", e);
      showNotification({
        variant: "error",
        title: "Loading failed",
        description: "Unable to load data, please try again later",
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification]); // Include showNotification dependency

  // Columns definition
  const columns: DataTableColumn<DemoDetail>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        sortable: true,
        width: "w-72",
        tooltip: (row) => row.name,
      },
      {
        key: "remark",
        label: "Remark",
        sortable: false,
        overflow: true,
        tooltip: (row) => row.remark || "",
      },
      {
        key: "age",
        label: "Age",
        sortable: true,
        width: "w-48",
      },
      {
        key: "gender",
        label: "Gender",
        sortable: true,
        width: "w-48",
        valueEnum: {
          item: (value: unknown) => {
            const v = value as Gender | undefined;
            if (v === Gender.Male) return { text: "Male", color: "text-blue-600" };
            if (v === Gender.Female) return { text: "Female", color: "text-pink-600" };
            return { text: "Unknown", color: "text-gray-500" };
          },
        },
      },
      {
        key: "created_at",
        label: "Created At",
        sortable: true,
        width: "w-32",
        render: (value: unknown) => {
          if (!value) return null;
          const friendlyTime = DateUtil.friendlyDate(value);
          const shortTime = DateUtil.format(value);
          return (
            <Tooltip content={shortTime}>
              <span className="text-sm text-gray-600 dark:text-gray-400 cursor-help">{friendlyTime}</span>
            </Tooltip>
          );
        },
      },
      {
        key: "updated_at",
        label: "Updated At",
        sortable: true,
        width: "w-32",
        render: (value: unknown) => {
          if (!value) return null;
          const friendlyTime = DateUtil.friendlyDate(value);
          const shortTime = DateUtil.format(value);
          return (
            <Tooltip content={shortTime}>
              <span className="text-sm text-gray-600 dark:text-gray-400 cursor-help">{friendlyTime}</span>
            </Tooltip>
          );
        },
      },
      {
        key: "created_by",
        label: "Created By",
        sortable: true,
        width: "w-32",
      },
      {
        key: "updated_by",
        label: "Updated By",
        sortable: true,
        width: "w-32",
      },
    ],
    [],
  );

  const handleRowSelect = (_selectedRows: DemoDetail[], selectedKeys: string[]) => {
    setSelectedKeys(selectedKeys);
  };

  const handleBulkRestore = useCallback(() => {
    setRestoreIds(selectedKeys);
    openRestoreModal();
  }, [selectedKeys, openRestoreModal]);

  const handleRestoreConfirm = async (ids: string[]) => {
    try {
      setSubmitting(true);
      await demoService.restore(ids);
      showNotification({
        variant: "success",
        title: "Restore successful",
        description: `Successfully restored ${ids.length} items.`,
      });
      await fetchPages();
      closeRestoreModal();
      setSelectedKeys([]);
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: "Restore failed",
        description: "Unable to restore data, please try again later",
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleRestore = useCallback(
    (row: DemoDetail) => {
      setRestoreIds([row.id]);
      openRestoreModal();
    },
    [openRestoreModal],
  );

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
      <SearchPopoverContent
        value={searchDraft}
        onChange={setSearchDraft}
        onSearch={() => {
          setKeyword(searchDraft);
          setCurrentPage(1);
          onOpenChange(false); // Close popover after search
        }}
        onClear={() => {
          setSearchDraft("");
          setKeyword("");
          setCurrentPage(1);
          onOpenChange(false); // Close popover after clearing
        }}
        placeholder="Enter keyword"
        trigger={trigger}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    return [
      CommonPageButton.SEARCH(searchPopoverCallback, { popover: { title: "Search", position: PopoverPosition.BottomLeft, width: "300px" } }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          openModal();
        },
        {
          visible: !showDeleted,
        },
      ),
      CommonPageButton.REFRESH(() => {
        fetchPages();
        showNotification({
          variant: "info",
          title: "Refreshing",
          description: "Refreshing data...",
          hideDuration: 2000,
        });
      }),
      CommonPageButton.RESTORE(
        () => {
          handleBulkRestore();
        },
        {
          visible: showDeleted,
          disabled: selectedKeys.length === 0,
        },
      ),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted(!showDeleted);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) },
      ),
    ];
  }, [openModal, fetchPages, showDeleted, searchDraft, showNotification, handleBulkRestore, selectedKeys]);

  // Trigger fetch on dependencies change
  useEffect(() => {
    fetchPages();
  }, [currentPage, pageSize, orderBy, descending, keyword, showDeleted, fetchPages]);

  // Event handlers wired to DataPage
  const handleSort = (columnKey: string | null, newDescending: boolean) => {
    if (columnKey === null) {
      // Unsort
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

  // Row actions
  const rowActions: MenuButtonType<DemoDetail>[] = useMemo(
    () => [
      CommonRowAction.EDIT(
        (row: DemoDetail) => {
          setFormMode("edit");
          setEditing(row);
          openModal();
        },
        {
          visible: !showDeleted, // Only shown in normal mode
        },
      ),
      CommonRowAction.RESTORE(
        async (row: DemoDetail) => {
          handleSingleRestore(row);
        },
        {
          visible: showDeleted, // Only shown in recycle bin mode
        },
      ),
      CommonRowAction.DELETE(
        (row: DemoDetail) => {
          setEditing(row);
          openDeleteModal();
        },
        {
          text: showDeleted ? "Delete Permanently" : "Delete",
        },
      ),
    ],
    [openModal, openDeleteModal, showDeleted, handleSingleRestore],
  );

  // Submit handlers
  const handleSubmit = async (values: DemoFormValues) => {
    try {
      setSubmitting(true);
      if (formMode === "create") {
        await demoService.create(values);
        showNotification({
          variant: "success",
          title: "Created Successfully",
          description: `Successfully created "${values.name}".`,
        });
      } else if (formMode === "edit" && editing?.id) {
        await demoService.update(editing.id, values);
        showNotification({
          variant: "success",
          title: "Updated Successfully",
          description: `Successfully updated "${values.name}".`,
        });
      }
      closeModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: "Save failed",
        description: "Unable to save data, please try again later",
        position: "top-right",
        hideDuration: 10000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async ({ reason, permanent }: { reason?: string; permanent?: boolean }) => {
    try {
      setSubmitting(true);
      if (!editing?.id) return;

      const deletedItem = editing;
      await demoService.remove(editing.id, { reason, permanent: !!permanent });

      showNotification({
        variant: "success",
        title: permanent ? "Permanently Deleted" : "Deleted Successfully",
        description: permanent
          ? `Successfully permanently deleted "${deletedItem.name}".`
          : `Successfully deleted "${deletedItem.name}".`,
      });

      closeDeleteModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: "Delete failed",
        description: "Unable to delete data, please try again later",
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const pagedData = useMemo(
    () => ({
      page: currentPage,
      pageSize,
      total,
      items,
    }),
    [currentPage, pageSize, total, items],
  );

  return (
    <>
      <DataPage<DemoDetail>
        data={pagedData}
        columns={columns}
        loading={loading}
        singleSelect={!showDeleted}
        orderBy={orderBy}
        descending={descending}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        onRowSelect={handleRowSelect}
      />

      <Modal
        title={formMode === "create" ? "Create Demo Item" : "Edit Demo Item"}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[600px] w-full mx-4 p-6"
      >
        <DemoDataForm mode={formMode} defaultValues={editing} onSubmit={handleSubmit} onCancel={closeModal} submitting={submitting} />
      </Modal>

      <Modal
        title={showDeleted ? "Confirm Permanent Deletion" : "Confirm Deletion"}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <DemoDeleteForm onSubmit={handleDelete} onCancel={closeDeleteModal} submitting={submitting} isPermanent={showDeleted} />
      </Modal>

      <Modal title="Restore Demo Item" isOpen={isRestoreOpen} onClose={closeRestoreModal} className="max-w-[500px] w-full mx-4 p-6">
        <RestoreForm
          ids={restoreIds}
          entityName="demo item"
          onSubmit={handleRestoreConfirm}
          onCancel={closeRestoreModal}
          submitting={submitting}
        />
      </Modal>
    </>
  );
}
