import {
  ministryService,
  type MinistryCreate,
  type MinistryDetail,
  type MinistryUpdate,
} from "@/api/services/ministryService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import DeleteForm from "@/components/DataPage/DeleteForm";
import { getRecycleButtonClassName } from "@/components/DataPage/PageButtonTypes";
import { Button, Input, Modal, ModalForm, type ModalFormHandle, TextArea, Tooltip } from "@efcnewlife/newlife-ui";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import MinistryDataForm, {
  type MinistryDataFormHandle,
  type MinistryFormValues,
} from "./MinistryDataForm";
import { ministryMembersToDraft } from "@/pages/Ministry/components/MinistryMembersEditor";

type MinistryRow = MinistryDetail & Record<string, unknown>;

const MinistryDataPage = () => {
  const { t } = useTranslation("ministry");
  const { hasPermission } = usePermissions();
  const canApprove = hasPermission(`${Resource.MinistryApproval}:${Verb.Modify}`);
  const canEditMembers = hasPermission(`${Resource.MinistryMember}:${Verb.Modify}`);

  const [items, setItems] = useState<MinistryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<MinistryRow | null>(null);
  const [formValues, setFormValues] = useState<MinistryFormValues | null>(null);
  const [viewing, setViewing] = useState<MinistryRow | null>(null);
  const [actionRow, setActionRow] = useState<MinistryRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);
  const { isOpen: isApproveOpen, openModal: openApproveModal, closeModal: closeApproveModal } = useModal(false);
  const { isOpen: isRejectOpen, openModal: openRejectModal, closeModal: closeRejectModal } = useModal(false);
  const formRef = useRef<MinistryDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ministryService.getMinistryPages({
        page: currentPage - 1,
        page_size: pageSize,
        deleted: showDeleted || undefined,
      });
      if (res.success) {
        setItems((res.data.items || []) as MinistryRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      }
    } catch {
      alert(t("shared.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, showDeleted, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const statusLabel = useCallback(
    (status: unknown) => {
      const key = String(status || "");
      return t(`ministry.status.${key}`, { defaultValue: key });
    },
    [t],
  );

  const memberRoleLabel = useCallback(
    (role: string) => t(`ministry.members.${role}`, { defaultValue: role }),
    [t],
  );

  const columns: DataTableColumn<MinistryRow>[] = useMemo(
    () => [
      { key: "name", label: t("ministry.table.name"), sortable: true, width: "w-40" },
      {
        key: "ministryType",
        label: t("ministry.table.ministryType"),
        width: "w-32",
        render: (_, row) => row.ministryType?.name || row.ministryType?.code || "—",
      },
      {
        key: "targetAudiences",
        label: t("ministry.table.targetAudiences"),
        width: "w-40",
        render: (_, row) =>
          (row.targetAudiences || []).map((item) => item.name || item.code).join(", ") || "—",
      },
      {
        key: "status",
        label: t("ministry.table.status"),
        width: "w-32",
        render: (v) => statusLabel(v),
      },
      {
        key: "hasPriorityBooking",
        label: t("ministry.table.hasPriorityBooking"),
        width: "w-28",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
      {
        key: "isActive",
        label: t("ministry.table.isActive"),
        width: "w-20",
        render: (v) => (v ? t("shared.yes") : t("shared.no")),
      },
      {
        key: "createAt",
        label: t("ministry.table.createdAt"),
        width: "w-40",
        render: (v) =>
          v ? (
            <Tooltip content={DateUtil.format(v as string)}>
              <span className="text-sm cursor-help">{DateUtil.friendlyDate(v as string)}</span>
            </Tooltip>
          ) : null,
      },
    ],
    [statusLabel, t],
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.ADD(
        () => {
          setFormMode("create");
          setEditing(null);
          setFormValues(null);
          openModal();
        },
        { visible: !showDeleted },
      ),
      CommonPageButton.REFRESH(() => void fetchPages()),
      CommonPageButton.RECYCLE(
        () => {
          setShowDeleted((v) => !v);
          setCurrentPage(1);
        },
        { className: getRecycleButtonClassName(showDeleted) },
      ),
    ],
    [fetchPages, showDeleted, openModal],
  );

  const rowActions: MenuButtonType<MinistryRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        const res = await ministryService.getMinistryById(row.id, { all_locales: true });
        if (res.success) {
          setViewing(res.data as MinistryRow);
          openViewModal();
        }
      }),
      CommonRowAction.EDIT(
        async (row) => {
          const res = await ministryService.getMinistryById(row.id, { all_locales: true });
          if (res.success) {
            const d = res.data;
            setFormMode("edit");
            setEditing(row);
            setFormValues({
              name: d.name || "",
              ownerPositionId: d.ownerPositionId,
              ministryTypeId: d.ministryTypeId,
              targetAudienceIds: (d.targetAudiences || []).map((item) => item.id),
              schedules: d.schedules || [],
              hasPriorityBooking: d.hasPriorityBooking,
              isActive: d.isActive,
              translations: d.translations,
              members: ministryMembersToDraft(d.members || []),
            });
            openModal();
          }
        },
        { visible: !showDeleted },
      ),
      {
        key: "submit",
        text: t("ministry.actions.submit"),
        onClick: async (row) => {
          try {
            await ministryService.submitMinistry(row.id);
            await fetchPages();
          } catch {
            alert(t("shared.actionFailed"));
          }
        },
        visible: (row) => !showDeleted && (row.status === "draft" || row.status === "rejected"),
        permission: Verb.Modify,
      },
      {
        key: "approve",
        text: t("ministry.actions.approve"),
        onClick: (row) => {
          setActionRow(row);
          setApproveComment("");
          openApproveModal();
        },
        visible: (row) => !showDeleted && row.status === "pending_approval" && canApprove,
        permission: undefined,
      },
      {
        key: "reject",
        text: t("ministry.actions.reject"),
        onClick: (row) => {
          setActionRow(row);
          setRejectReason("");
          setRejectComment("");
          openRejectModal();
        },
        visible: (row) => !showDeleted && row.status === "pending_approval" && canApprove,
        variant: "danger",
        permission: undefined,
      },
      CommonRowAction.RESTORE(
        async (row) => {
          await ministryService.restoreMinistries({ ids: [row.id] });
          await fetchPages();
        },
        { visible: showDeleted },
      ),
      CommonRowAction.DELETE((row) => {
        setEditing(row);
        openDeleteModal();
      }),
    ],
    [canApprove, fetchPages, openApproveModal, openDeleteModal, openModal, openRejectModal, openViewModal, showDeleted, t],
  );

  return (
    <>
      <DataPage<MinistryRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.MinistryMinistry}
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
        title={formMode === "create" ? t("ministry.modal.createTitle") : t("ministry.modal.editTitle")}
        className="max-w-3xl mx-4 p-6"
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
          const { members, ...ministryPayload } = values;
          setSubmitting(true);
          try {
            if (formMode === "create") {
              await ministryService.createMinistry(ministryPayload as MinistryCreate);
            } else if (editing?.id) {
              await ministryService.updateMinistry(editing.id, ministryPayload as MinistryUpdate);
              if (canEditMembers && members) {
                await ministryService.replaceMinistryMembers(editing.id, {
                  members: members.map((m) => ({
                    userId: m.userId,
                    memberRole: m.memberRole,
                    contactEmail: m.contactEmail,
                  })),
                });
              }
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
        <MinistryDataForm
          ref={formRef}
          mode={formMode}
          defaultValues={formValues}
          showMembers={canEditMembers}
          validateMembers={false}
        />
      </ModalForm>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} title={t("ministry.modal.deleteSoft")} className="max-w-lg mx-4 p-6">
        <DeleteForm
          entityName={t("ministry.deleteForm.entityLabel")}
          isPermanent={showDeleted}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            await ministryService.deleteMinistry(editing.id, { reason, permanent });
            closeDeleteModal();
            await fetchPages();
          }}
        />
      </Modal>

      <Modal isOpen={isViewOpen} onClose={closeViewModal} title={t("ministry.modal.detailTitle")} className="max-w-lg mx-4 p-6">
        {viewing && (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">{t("ministry.table.name")}</dt>
            <dd>{viewing.name}</dd>
            <dt className="text-gray-500">{t("ministry.table.status")}</dt>
            <dd>{statusLabel(viewing.status)}</dd>
            <dt className="text-gray-500">{t("ministry.table.hasPriorityBooking")}</dt>
            <dd>{viewing.hasPriorityBooking ? t("shared.yes") : t("shared.no")}</dd>
            <dt className="text-gray-500 col-span-2">{t("ministry.detail.members")}</dt>
            <dd className="col-span-2">
              {(viewing.members || []).length === 0 ? (
                t("ministry.detail.noMembers")
              ) : (
                <ul className="space-y-1">
                  {viewing.members.map((m) => (
                    <li key={m.userId}>
                      {memberRoleLabel(m.memberRole)}: {m.displayName || m.email || m.userId}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </dl>
        )}
      </Modal>

      <Modal
        isOpen={isApproveOpen}
        onClose={closeApproveModal}
        title={t("ministry.modal.approveTitle")}
        className="max-w-lg mx-4 p-6"
      >
        <TextArea
          id="ministry-approve-comment"
          label={t("ministry.approve.comment")}
          value={approveComment}
          onChange={setApproveComment}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeApproveModal}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={submitting}
            onClick={async () => {
              if (!actionRow?.id) return;
              setSubmitting(true);
              try {
                await ministryService.approveMinistry(actionRow.id, { comment: approveComment || undefined });
                closeApproveModal();
                await fetchPages();
              } catch {
                alert(t("shared.actionFailed"));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {t("ministry.actions.approve")}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isRejectOpen}
        onClose={closeRejectModal}
        title={t("ministry.modal.rejectTitle")}
        className="max-w-lg mx-4 p-6"
      >
        <Input
          id="ministry-reject-reason"
          label={t("ministry.reject.reason")}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="mt-3">
          <TextArea
            id="ministry-reject-comment"
            label={t("ministry.reject.comment")}
            value={rejectComment}
            onChange={setRejectComment}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeRejectModal}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={submitting}
            className="text-red-600 border-red-300"
            onClick={async () => {
              if (!actionRow?.id) return;
              if (!rejectReason.trim()) {
                alert(t("ministry.reject.reasonRequired"));
                return;
              }
              setSubmitting(true);
              try {
                await ministryService.rejectMinistry(actionRow.id, {
                  rejectionReason: rejectReason.trim(),
                  comment: rejectComment || undefined,
                });
                closeRejectModal();
                await fetchPages();
              } catch {
                alert(t("shared.actionFailed"));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {t("ministry.actions.reject")}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default MinistryDataPage;
