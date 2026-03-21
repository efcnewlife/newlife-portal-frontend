import { roleService, type RoleCreate, type RolePageItem, type RolePagesResponse, type RoleUpdate } from "@/api/services/roleService";
import type { DataTableColumn, MenuButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import Button from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ModalForm, type ModalFormHandle } from "@/components/ui/modal/modal-form";
import Tooltip from "@/components/ui/tooltip";
import { PopoverPosition, Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RoleDataForm, { type RoleDataFormHandle, type RoleFormValues } from "./RoleDataForm";
import RoleDeleteForm from "./RoleDeleteForm";
import RoleDetailView from "./RoleDetailView";
import RoleSearchPopover, { type RoleSearchFilters } from "./RoleSearchPopover";

export default function RoleDataPage() {
  const [items, setItems] = useState<RolePageItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [descending, setDescending] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Modal state
  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RolePageItem | null>(null);
  const [editingFormValues, setEditingFormValues] = useState<RoleFormValues | null>(null);
  const [viewing, setViewing] = useState<RolePageItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilters, setSearchFilters] = useState<RoleSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<RoleSearchFilters>({});

  const clearSelectionRef = useRef<() => void>(() => {});
  const roleFormRef = useRef<RoleDataFormHandle>(null);
  const roleModalFormRef = useRef<ModalFormHandle>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await roleService.getPages({
        page: currentPage - 1,
        page_size: pageSize,
        order_by: orderBy,
        descending,
        deleted: showDeleted,
        keyword: appliedFilters.keyword,
      });
      if (res.success) {
        const data: RolePagesResponse = res.data;
        setItems(data.items || []);
        setTotal(data.total);
        setCurrentPage((data.page ?? 0) + 1);
      } else {
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, orderBy, descending, showDeleted, appliedFilters.keyword]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const columns: DataTableColumn<RolePageItem>[] = useMemo(
    () => [
      { key: "code", label: "code", sortable: true, width: "w-40" },
      { key: "name", label: "name", sortable: true, width: "w-48" },
      {
        key: "isActive",
        label: "enable",
        sortable: true,
        width: "w-24",
        render: (val) => (val ? "yes" : "no"),
      },
      {
        key: "remark",
        label: "Remark",
        overflow: true,
        width: "w-48",
      },
      {
        key: "permissions",
        label: "Number of permissions",
        width: "w-24",
        render: (_, row) => (row.permissions ? row.permissions.length : 0),
      },
      {
        key: "createAt",
        label: "Setup time",
        sortable: true,
        width: "w-44",
        render: (value: unknown) => {
          if (!value) return null;
          const friendlyTime = DateUtil.friendlyDate(value as string);
          const shortTime = DateUtil.format(value as string);
          return (
            <Tooltip content={shortTime}>
              <span className="text-sm text-gray-600 dark:text-gray-400 cursor-help">{friendlyTime}</span>
            </Tooltip>
          );
        },
      },
      {
        key: "updateAt",
        label: "Update time",
        sortable: true,
        width: "w-44",
        render: (value: unknown) => {
          if (!value) return null;
          const friendlyTime = DateUtil.friendlyDate(value as string);
          const shortTime = DateUtil.format(value as string);
          return (
            <Tooltip content={shortTime}>
              <span className="text-sm text-gray-600 dark:text-gray-400 cursor-help">{friendlyTime}</span>
            </Tooltip>
          );
        },
      },
    ],
    [],
  );

  const toolbarButtons = useMemo(() => {
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
      <RoleSearchPopover
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
        trigger={trigger}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        popover={popover}
      />
    );

    return [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: { title: "Search for roles", position: PopoverPosition.BottomLeft, width: "420px" },
      }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setEditingFormValues(null);
          openModal();
        },
        { visible: !showDeleted },
      ),
      CommonPageButton.REFRESH(() => {
        clearSelectionRef.current?.();
        fetchPages();
      }),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted((v) => !v);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) },
      ),
    ];
  }, [fetchPages, searchFilters, showDeleted, openModal, setFormMode, setEditing, setEditingFormValues, clearSelectionRef]);

  const rowActions: MenuButtonType<RolePageItem>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        try {
          setSubmitting(true);
          // Get full role details (including permission list)
          const response = await roleService.getById(row.id);
          if (response.success) {
            setViewing(response.data);
            openViewModal();
          } else {
            alert("Failed to load character details, please try again later");
          }
        } catch (e) {
          console.error("Error fetching role detail:", e);
          alert("Failed to load character details, please try again later");
        } finally {
          setSubmitting(false);
        }
      }),
      CommonRowAction.EDIT(
        async (row) => {
          try {
            setSubmitting(true);
            // Get full role details (including permission list)
            const response = await roleService.getById(row.id);
            if (response.success) {
              const detail = response.data;
              setFormMode("edit");
              setEditing(row);
              // Convert to form value format
              setEditingFormValues({
                code: detail.code,
                name: detail.name || "",
                isActive: detail.isActive,
                description: detail.description || "",
                remark: detail.remark || "",
                permissions: detail.permissions.map((p) => p.id),
              });
              openModal();
            } else {
              alert("Failed to load character details, please try again later");
            }
          } catch (e) {
            console.error("Error fetching role detail:", e);
            alert("Failed to load character details, please try again later");
          } finally {
            setSubmitting(false);
          }
        },
        {
          visible: !showDeleted,
        },
      ),
      CommonRowAction.RESTORE(
        async (row) => {
          try {
            setSubmitting(true);
            await roleService.restore(row.id);
            await fetchPages();
          } finally {
            setSubmitting(false);
          }
        },
        {
          visible: showDeleted,
        },
      ),
      CommonRowAction.DELETE(
        (row) => {
          setEditing(row);
          openDeleteModal();
        },
        {
          text: showDeleted ? "Delete permanently" : "delete",
        },
      ),
    ],
    [openModal, openDeleteModal, openViewModal, showDeleted, fetchPages, setSubmitting],
  );

  const handleSort = (key?: string | null, desc?: boolean) => {
    if (!key) {
      setOrderBy(undefined);
      setDescending(false);
    } else {
      setOrderBy(key);
      setDescending(!!desc);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const pagedData = useMemo(() => {
    return {
      page: currentPage,
      pageSize,
      total,
      items,
    };
  }, [currentPage, pageSize, total, items]);

  return (
    <>
      <DataPage<RolePageItem>
        data={pagedData}
        columns={columns}
        loading={loading}
        singleSelect={!showDeleted}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.SystemRole}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onSort={handleSort}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        onRowSelect={(_rows, keys) => setSelectedKeys(keys)}
        onClearSelectionRef={(clearFn) => {
          clearSelectionRef.current = clearFn;
        }}
      />

      <ModalForm
        ref={roleModalFormRef}
        title={formMode === "create" ? "Add new role" : "Edit role"}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-7xl w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={() => roleModalFormRef.current?.submit()} disabled={submitting}>
              {formMode === "create" ? "Add new role" : "Save changes"}
            </Button>
          </>
        }
        onSubmit={async (e) => {
          e.preventDefault();
          if (!roleFormRef.current?.validate()) return;
          const values = roleFormRef.current.getValues();
          try {
            setSubmitting(true);
            if (formMode === "create") {
              await roleService.create(values as RoleCreate);
            } else if (formMode === "edit" && editing?.id) {
              await roleService.update(editing.id, values as RoleUpdate);
            }
            closeModal();
            await fetchPages();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <RoleDataForm ref={roleFormRef} mode={formMode} defaultValues={editingFormValues} />
      </ModalForm>

      <Modal
        title={showDeleted ? "Confirm permanent deletion of role" : "Confirm role deletion"}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <RoleDeleteForm
          onSubmit={async ({ reason, permanent }) => {
            try {
              setSubmitting(true);
              if (!editing?.id) return;
              await roleService.remove(editing.id, { reason, permanent });
              closeDeleteModal();
              await fetchPages();
            } catch (e) {
              console.error(e);
              alert("Deletion failed, please try again later");
            } finally {
              setSubmitting(false);
            }
          }}
          onCancel={closeDeleteModal}
          submitting={submitting}
          isPermanent={showDeleted}
        />
      </Modal>

      <Modal
        title="Role details"
        isOpen={isViewOpen}
        onClose={closeViewModal}
        className="max-w-7xl w-full max-h-9/10 mx-4 p-6 overflow-y-auto"
      >
        {viewing && <RoleDetailView role={viewing} />}
      </Modal>
    </>
  );
}
