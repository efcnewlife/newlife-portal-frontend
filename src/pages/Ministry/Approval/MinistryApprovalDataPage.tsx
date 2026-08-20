import { ministryService, type MinistryDetail } from "@/api/services/ministryService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { Button, Input, Modal, TextArea, Tooltip } from "@efcnewlife/newlife-ui";
import { Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { DateUtil } from "@/utils/dateUtil";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type ApprovalRow = MinistryDetail & Record<string, unknown>;

const MinistryApprovalDataPage = () => {
  const { t } = useTranslation("ministry");
  const [items, setItems] = useState<ApprovalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<ApprovalRow | null>(null);
  const [actionRow, setActionRow] = useState<ApprovalRow | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);
  const { isOpen: isApproveOpen, openModal: openApproveModal, closeModal: closeApproveModal } = useModal(false);
  const { isOpen: isRejectOpen, openModal: openRejectModal, closeModal: closeRejectModal } = useModal(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ministryService.getMinistryApprovalPages({
        page: currentPage - 1,
        page_size: pageSize,
      });
      if (res.success) {
        setItems((res.data.items || []) as ApprovalRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const memberRoleLabel = useCallback(
    (role: string) => t(`ministry.members.${role}`, { defaultValue: role }),
    [t],
  );

  const columns: DataTableColumn<ApprovalRow>[] = useMemo(
    () => [
      { key: "name", label: t("approval.table.name"), width: "w-40" },
      {
        key: "submittedAt",
        label: t("approval.table.submittedAt"),
        width: "w-40",
        render: (v) =>
          v ? (
            <Tooltip content={DateUtil.format(v as string)}>
              <span className="text-sm cursor-help">{DateUtil.friendlyDate(v as string)}</span>
            </Tooltip>
          ) : (
            "-"
          ),
      },
      {
        key: "status",
        label: t("approval.table.status"),
        width: "w-32",
        render: (v) => t(`ministry.status.${String(v)}`, { defaultValue: String(v) }),
      },
    ],
    [t],
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [CommonPageButton.REFRESH(() => void fetchPages())],
    [fetchPages],
  );

  const rowActions: MenuButtonType<ApprovalRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        const res = await ministryService.getMinistryById(row.id, { all_locales: true });
        if (res.success) {
          setViewing(res.data as ApprovalRow);
          openViewModal();
        }
      }),
      {
        key: "approve",
        text: t("ministry.actions.approve"),
        onClick: (row) => {
          setActionRow(row);
          setApproveComment("");
          openApproveModal();
        },
        permission: "modify",
      },
      {
        key: "reject",
        text: t("ministry.actions.reject"),
        variant: "danger",
        onClick: (row) => {
          setActionRow(row);
          setRejectReason("");
          setRejectReasonError("");
          setRejectComment("");
          openRejectModal();
        },
        permission: "modify",
      },
    ],
    [openApproveModal, openRejectModal, openViewModal, t],
  );

  return (
    <>
      <DataPage<ApprovalRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.MinistryApproval}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      <Modal isOpen={isViewOpen} onClose={closeViewModal} title={t("approval.modal.detailTitle")} className="max-w-2xl mx-4 p-6">
        {viewing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">{t("approval.table.name")}</dt>
            <dd>{viewing.name}</dd>
            <dt className="text-gray-500">{t("approval.detail.ownerPosition")}</dt>
            <dd>{viewing.ownerPositionId || "-"}</dd>
            <dt className="text-gray-500 col-span-2">{t("approval.detail.members")}</dt>
            <dd className="col-span-2">
              <ul className="space-y-1">
                {(viewing.members || []).map((m) => (
                  <li key={m.userId}>
                    {memberRoleLabel(m.memberRole)}: {m.displayName || m.email || m.userId}
                  </li>
                ))}
              </ul>
            </dd>
            <dt className="text-gray-500 col-span-2">{t("approval.detail.translations")}</dt>
            <dd className="col-span-2">
              <ul className="space-y-1">
                {(viewing.translations || []).map((tr) => (
                  <li key={tr.localeId}>{tr.name}</li>
                ))}
              </ul>
            </dd>
          </dl>
        )}
      </Modal>

      <Modal isOpen={isApproveOpen} onClose={closeApproveModal} title={t("approval.modal.approveTitle")} className="max-w-lg mx-4 p-6">
        <TextArea
          id="approval-approve-comment"
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
                notifySuccess({ title: t("common:feedback.saved") });
                closeApproveModal();
                await fetchPages();
              } catch (error) {
                notifyApiError(error, {
                  title: t("common:feedback.actionFailed"),
                  fallbackDescription: t("common:feedback.actionFailedDesc"),
                });
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {t("ministry.actions.approve")}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isRejectOpen} onClose={closeRejectModal} title={t("approval.modal.rejectTitle")} className="max-w-lg mx-4 p-6">
        <Input
          id="approval-reject-reason"
          label={t("ministry.reject.reason")}
          value={rejectReason}
          error={rejectReasonError}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (rejectReasonError) setRejectReasonError("");
          }}
        />
        <div className="mt-3">
          <TextArea
            id="approval-reject-comment"
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
                setRejectReasonError(t("ministry.reject.reasonRequired"));
                return;
              }
              setSubmitting(true);
              try {
                await ministryService.rejectMinistry(actionRow.id, {
                  rejectionReason: rejectReason.trim(),
                  comment: rejectComment || undefined,
                });
                notifySuccess({ title: t("common:feedback.saved") });
                closeRejectModal();
                await fetchPages();
              } catch (error) {
                notifyApiError(error, {
                  title: t("common:feedback.actionFailed"),
                  fallbackDescription: t("common:feedback.actionFailedDesc"),
                });
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

export default MinistryApprovalDataPage;
