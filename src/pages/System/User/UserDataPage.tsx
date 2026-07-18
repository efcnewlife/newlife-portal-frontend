import { userService, type UserDetail as ApiUserDetail, type UserPagesResponse } from "@/api/services/userService";
import type { DataTableColumn, MenuButtonType, PageButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import RestoreForm from "@/components/DataPage/RestoreForm";
import { Modal, Tooltip } from "@efcnewlife/newlife-ui";
import { Gender, PopoverPosition, Resource } from "@/const/enums";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/hooks/useModal";
import { format_admin_user_label } from "@/utils/userDisplayName";
import { DateUtil } from "@/utils/dateUtil";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdCheck, MdClose, MdGroup } from "react-icons/md";
import { TbCircleLetterSFilled } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import UserBindRoleForm from "./UserBindRoleForm";
import UserDataForm, { type UserFormValues } from "./UserDataForm";
import UserDeleteForm from "./UserDeleteForm";
import UserDetailView from "./UserDetailView";
import UserSearchPopover, { type UserSearchFilters } from "./UserSearchPopover";

type UserDetail = ApiUserDetail & Record<string, unknown>;

export default function UserDataPage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1); // 1-based for UI
  const [pageSize, setPageSize] = useState(10);
  const [searchFilters, setSearchFilters] = useState<UserSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<UserSearchFilters>({});
  const [showDeleted, setShowDeleted] = useState(false);
  const [orderBy, setOrderBy] = useState<string>();
  const [descending, setDescending] = useState<boolean>();

  const [items, setItems] = useState<UserDetail[]>([]);
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
  const { isOpen: isBindRoleOpen, openModal: openBindRoleModal, closeModal: closeBindRoleModal } = useModal(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<UserDetail | null>(null);
  const [viewing, setViewing] = useState<UserDetail | null>(null);
  const [bindingUser, setBindingUser] = useState<UserDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restoreIds, setRestoreIds] = useState<string[]>([]);
  const [userRoleIds, setUserRoleIds] = useState<string[]>([]);

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
        verified: appliedFilters.verified,
        is_active: appliedFilters.is_active,
        is_admin: appliedFilters.is_admin,
        is_superuser: appliedFilters.is_superuser,
        gender: appliedFilters.gender,
        deleted: showDeleted || undefined,
      } as Record<string, unknown>;

      const res = await userService.getPages(params);
      const data = res.data as UserPagesResponse;
      setItems((data.items || []) as UserDetail[]);
      setTotal(data.total);
      // Backend page is 0-based; map back to 1-based UI if changed externally
      setCurrentPage(data.page + 1);
    } catch (e) {
      console.error("Error fetching user pages:", e);
      showNotification({
        variant: "error",
        title: t("system:user.feedback.loadFailed.title"),
        description: t("system:user.feedback.loadFailed.desc"),
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  }, [showNotification, t]); // include t for localized error copy

  // Columns definition
  const columns: DataTableColumn<UserDetail>[] = useMemo(
    () => [
      {
        key: "email",
        label: t("system:user.table.email"),
        sortable: true,
        width: "w-60",
        tooltip: (row) => row.email,
      },
      {
        key: "preferred_name",
        label: t("system:user.table.preferredName"),
        sortable: true,
        width: "w-36",
        render: (_value: unknown, row: UserDetail) => format_admin_user_label(row) || t("system:shared.notSet"),
        tooltip: (row) => format_admin_user_label(row),
      },
      {
        key: "first_name",
        label: t("system:user.table.firstName"),
        sortable: true,
        width: "w-28",
        render: (_value: unknown, row: UserDetail) => row.first_name || t("system:shared.notSet"),
      },
      {
        key: "last_name",
        label: t("system:user.table.lastName"),
        sortable: true,
        width: "w-28",
        render: (_value: unknown, row: UserDetail) => row.last_name || t("system:shared.notSet"),
      },
      {
        key: "gender",
        label: t("system:user.table.gender"),
        sortable: true,
        width: "w-20",
        valueEnum: {
          item: (value: unknown) => {
            const v = value as Gender | undefined;
            if (v === Gender.Male) return { text: t("system:shared.genderMale"), color: "text-blue-600" };
            if (v === Gender.Female) return { text: t("system:shared.genderFemale"), color: "text-pink-600" };
            return { text: t("system:shared.genderUnknown"), color: "text-gray-500" };
          },
        },
      },
      {
        key: "is_verified",
        label: t("system:user.table.verified"),
        sortable: true,
        width: "w-18",
        render: (_value: unknown, row: UserDetail) => {
          return (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                row.verified
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
              }`}
            >
              {row.verified ? <MdCheck size={16} /> : <MdClose size={16} />}
            </span>
          );
        },
      },
      {
        key: "is_active",
        label: t("system:user.table.active"),
        sortable: true,
        width: "w-18",
        render: (_value: unknown, row: UserDetail) => {
          return (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                row.is_active
                  ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
              }`}
            >
              {row.is_active ? <MdCheck size={16} /> : <MdClose size={16} />}
            </span>
          );
        },
      },
      {
        key: "is_admin",
        label: t("system:user.table.admin"),
        sortable: true,
        width: "w-24",
        render: (_value: unknown, row: UserDetail) => {
          return (
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                  row.is_admin
                    ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                }`}
              >
                {row.is_admin ? <MdCheck size={16} /> : <MdClose size={16} />}
              </span>
              {row.is_admin && row.is_superuser && (
                <Tooltip content={t("system:user.tooltip.superAdmin")}>
                  <TbCircleLetterSFilled size={24} className="text-blue-600 dark:text-blue-400" />
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        key: "last_login_at",
        label: t("system:user.table.lastLoginAt"),
        sortable: true,
        width: "w-32",
        render: (value: unknown) => {
          if (!value) return <span className="text-gray-400">{t("system:shared.neverLoggedIn")}</span>;
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
        key: "created_at",
        label: t("system:user.table.createdAt"),
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

  const handleRowSelect = (_selectedRows: UserDetail[], selectedKeys: string[]) => {
    setSelectedKeys(selectedKeys);
  };

  const handleBulkRestore = useCallback(async () => {
    setRestoreIds(selectedKeys);
    openRestoreModal();
  }, [selectedKeys, openRestoreModal]);

  const handleRestoreConfirm = async (ids: string[]) => {
    try {
      setSubmitting(true);
      await userService.restore(ids);
      showNotification({
        variant: "success",
        title: t("system:user.feedback.restoreSuccess.title"),
        description: t("system:user.feedback.restoreSuccess.desc", { count: ids.length }),
      });
      await fetchPages();
      closeRestoreModal();
      setSelectedKeys([]);
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:user.feedback.restoreFailed.title"),
        description: t("system:user.feedback.restoreFailed.desc"),
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleRestore = useCallback(
    (row: UserDetail) => {
      setRestoreIds([row.id]);
      openRestoreModal();
    },
    [openRestoreModal]
  );

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
      <UserSearchPopover
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

    const buttons: PageButtonType[] = [
      CommonPageButton.SEARCH(searchPopoverCallback, {
        popover: { title: t("system:user.search.popoverTitle"), position: PopoverPosition.BottomLeft, width: "500px" },
      }),
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
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
  const rowActions: MenuButtonType<UserDetail>[] = useMemo(
    () => [
      CommonRowAction.VIEW((row: UserDetail) => {
        setViewing(row);
        openViewModal();
      }),
      CommonRowAction.EDIT(
        (row: UserDetail) => {
          setFormMode("edit");
          setEditing(row);
          openModal();
        },
        {
          visible: !showDeleted, // Only when not in trash mode
        }
      ),
      {
        key: "bind_role",
        text: t("system:user.row.bindRole"),
        icon: <MdGroup />,
        permission: "system:role:modify",
        onClick: (row: UserDetail) => {
          setBindingUser(row);
          setUserRoleIds([]); // Reset so UserBindRoleForm loads roles from API
          openBindRoleModal();
        },
        visible: !showDeleted, // Only when not in trash mode
      },
      CommonRowAction.RESTORE(
        async (row: UserDetail) => {
          handleSingleRestore(row);
        },
        {
          visible: showDeleted, // Only in trash mode
        }
      ),
      CommonRowAction.DELETE(
        (row: UserDetail) => {
          setEditing(row);
          openDeleteModal();
        },
        {
          text: showDeleted ? t("system:user.row.permanentDelete") : t("common:delete"),
        }
      ),
    ],
    [openModal, openDeleteModal, openViewModal, openBindRoleModal, showDeleted, handleSingleRestore, t]
  );

  // Submit handlers
  const build_display_name = (values: UserFormValues) =>
    values.preferred_name?.trim() || [values.first_name, values.last_name].filter(Boolean).join(" ").trim() || undefined;

  const handleSubmit = async (values: UserFormValues) => {
    try {
      setSubmitting(true);
      if (formMode === "create") {
        // Create flow requires password (validated before submit)
        const { password, password_confirm, ...restValues } = values;
        if (!password || !password_confirm) {
          showNotification({
            variant: "warning",
            title: t("system:user.feedback.validationNeeded.title"),
            description: t("system:user.feedback.validationNeeded.password"),
            position: "top-center",
          });
          return;
        }
        await userService.create({
          ...restValues,
          display_name: build_display_name(values),
          password,
          password_confirm,
        } as Parameters<typeof userService.create>[0]);
        showNotification({
          variant: "success",
          title: t("system:user.feedback.createSuccess.title"),
          description: t("system:user.feedback.createSuccess.desc", {
            name: format_admin_user_label(values) || values.email || "",
          }),
        });
      } else if (formMode === "edit" && editing?.id) {
        // Edit flow omits password (UserDataForm strips it)
        await userService.update(editing.id, {
          email: values.email,
          verified: values.verified,
          is_active: values.is_active,
          is_superuser: values.is_superuser,
          is_admin: values.is_admin,
          display_name: build_display_name(values),
          gender: values.gender,
          remark: values.remark,
        });
        showNotification({
          variant: "success",
          title: t("system:user.feedback.updateSuccess.title"),
          description: t("system:user.feedback.updateSuccess.desc", {
            name: format_admin_user_label(values) || values.email || "",
          }),
        });
      }
      closeModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:user.feedback.saveFailed.title"),
        description: t("system:user.feedback.saveFailed.desc"),
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
      const deletedUser = editing;
      await userService.remove(editing.id, { reason, permanent: !!permanent });
      showNotification({
        variant: "success",
        title: permanent ? t("system:user.feedback.deleteSuccessPermanent.title") : t("system:user.feedback.deleteSuccessSoft.title"),
        description: permanent
          ? t("system:user.feedback.deleteSuccessPermanent.desc", {
              name: format_admin_user_label(deletedUser) || deletedUser.email || "",
            })
          : t("system:user.feedback.deleteSuccessSoft.desc", {
              name: format_admin_user_label(deletedUser) || deletedUser.email || "",
            }),
      });
      closeDeleteModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:user.feedback.deleteFailed.title"),
        description: t("system:user.feedback.deleteFailed.desc"),
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBindRoles = async (roleIds: string[]) => {
    try {
      setSubmitting(true);
      if (!bindingUser?.id) return;
      await userService.bindRoles(bindingUser.id, roleIds);
      showNotification({
        variant: "success",
        title: t("system:user.feedback.bindSuccess.title"),
        description: t("system:user.feedback.bindSuccess.desc"),
      });
      closeBindRoleModal();
      // Refresh list by calling fetchPages directly
      await fetchPages();
    } catch (e) {
      console.error(e);
      showNotification({
        variant: "error",
        title: t("system:user.feedback.bindFailed.title"),
        description: t("system:user.feedback.bindFailed.desc"),
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
      <DataPage<UserDetail>
        data={pagedData}
        columns={columns}
        loading={loading}
        singleSelect={!showDeleted}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.SystemUser}
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
        title={formMode === "create" ? t("system:user.modal.createTitle") : t("system:user.modal.editTitle")}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[800px] w-full mx-4 p-6"
      >
        <UserDataForm
          mode={formMode}
          defaultValues={
            editing
              ? {
                  id: editing.id,
                  email: editing.email,
                  verified: editing.verified,
                  is_active: editing.is_active,
                  is_superuser: editing.is_superuser,
                  is_admin: editing.is_admin,
                  first_name: editing.first_name || "",
                  last_name: editing.last_name || "",
                  preferred_name: editing.preferred_name || "",
                  gender: editing.gender,
                }
              : null
          }
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>

      <Modal
        title={showDeleted ? t("system:user.modal.deleteConfirmPermanent.title") : t("system:user.modal.deleteConfirmSoft.title")}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <UserDeleteForm onSubmit={handleDelete} onCancel={closeDeleteModal} submitting={submitting} isPermanent={showDeleted} />
      </Modal>

      <Modal title={t("system:user.modal.restoreTitle")} isOpen={isRestoreOpen} onClose={closeRestoreModal} className="max-w-[500px] w-full mx-4 p-6">
        <RestoreForm
          ids={restoreIds}
          entityName={t("system:user.restoreForm.entityLabel")}
          onSubmit={handleRestoreConfirm}
          onCancel={closeRestoreModal}
          submitting={submitting}
        />
      </Modal>

      <Modal title={t("system:user.modal.detailTitle")} isOpen={isViewOpen} onClose={closeViewModal} className="max-w-[900px] w-full mx-4 p-6">
        {viewing && <UserDetailView userId={viewing.id} />}
      </Modal>

      <Modal
        title={
          bindingUser
            ? t("system:user.modal.bindRoleTitle.withName", {
                name: format_admin_user_label(bindingUser) || bindingUser.email || "",
              })
            : t("system:user.modal.bindRoleTitle")
        }
        isOpen={isBindRoleOpen}
        onClose={closeBindRoleModal}
        className="max-w-[600px] w-full mx-4 p-6"
      >
        {bindingUser && (
          <UserBindRoleForm
            userId={bindingUser.id}
            initialRoleIds={userRoleIds}
            onSubmit={handleBindRoles}
            onCancel={closeBindRoleModal}
            submitting={submitting}
          />
        )}
      </Modal>
    </>
  );
}
