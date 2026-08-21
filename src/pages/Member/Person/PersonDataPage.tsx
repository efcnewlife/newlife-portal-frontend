import {
  orgService,
  type MemberPersonCreate,
  type MemberPersonDetail,
  type MemberPersonUpdate,
} from "@/api/services/orgService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PersonDataForm, { type PersonDataFormHandle, type PersonFormValues } from "./PersonDataForm";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";

type PersonRow = MemberPersonDetail & Record<string, unknown>;

const PersonDataPage = () => {
  const { t } = useTranslation("member");
  const [items, setItems] = useState<PersonRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PersonRow | null>(null);
  const [formValues, setFormValues] = useState<PersonFormValues | null>(null);
  const [viewing, setViewing] = useState<PersonRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);
  const formRef = useRef<PersonDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orgService.getMemberPersonPages({
        page: currentPage - 1,
        page_size: pageSize,
      });
      if (res.success) {
        setItems((res.data.items || []) as PersonRow[]);
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

  const columns: DataTableColumn<PersonRow>[] = useMemo(
    () => [
      { key: "legalName", label: t("person.table.legalName"), sortable: true, width: "w-40" },
      { key: "displayName", label: t("person.table.displayName"), width: "w-40" },
      { key: "email", label: t("person.table.email"), width: "w-48" },
      {
        key: "userId",
        label: t("person.table.userId"),
        width: "w-48",
        render: (v) => (v ? String(v) : "-"),
      },
    ],
    [t]
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.ADD(() => {
        setFormMode("create");
        setEditing(null);
        setFormValues(null);
        openModal();
      }),
      CommonPageButton.REFRESH(() => void fetchPages()),
    ],
    [fetchPages, openModal]
  );

  const rowActions: MenuButtonType<PersonRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        const res = await orgService.getMemberPersonById(row.id);
        if (res.success) {
          setViewing(res.data as PersonRow);
          openViewModal();
        }
      }),
      CommonRowAction.EDIT(async (row) => {
        const res = await orgService.getMemberPersonById(row.id);
        if (res.success) {
          const d = res.data;
          setFormMode("edit");
          setEditing(row);
          setFormValues({
            legalName: d.legalName || "",
            userId: d.userId,
          });
          openModal();
        }
      }),
    ],
    [openModal, openViewModal]
  );

  return (
    <>
      <DataPage<PersonRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        resource={Resource.MemberPerson}
        buttons={toolbarButtons}
        rowActions={rowActions}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
          setPageSize(size);
          setCurrentPage(1);
        }}
      />

      <ModalForm
        ref={modalRef}
        title={formMode === "create" ? t("person.modal.createTitle") : t("person.modal.editTitle")}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-lg w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal} disabled={submitting}>
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
              await orgService.createMemberPerson(values as MemberPersonCreate);
              notifySuccess({ title: t("common:feedback.created") });
            } else if (editing?.id) {
              await orgService.updateMemberPerson(editing.id, {
                legalName: values.legalName,
              } as MemberPersonUpdate);
              if (values.userId && values.userId !== editing.userId) {
                await orgService.linkMemberPerson(editing.id, { userId: values.userId });
              }
              notifySuccess({ title: t("common:feedback.updated") });
            }
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
        <PersonDataForm ref={formRef} mode={formMode} defaultValues={formValues} />
      </ModalForm>

      <Modal
        title={t("person.modal.detailTitle")}
        isOpen={isViewOpen}
        onClose={closeViewModal}
        className="max-w-lg w-full mx-4 p-6"
      >
        {viewing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">{t("person.table.legalName")}</dt>
            <dd>{viewing.legalName}</dd>
            <dt className="text-gray-500">{t("person.table.displayName")}</dt>
            <dd>{viewing.displayName || "-"}</dd>
            <dt className="text-gray-500">{t("person.table.email")}</dt>
            <dd>{viewing.email || "-"}</dd>
            <dt className="text-gray-500">{t("person.table.userId")}</dt>
            <dd>{viewing.userId || "-"}</dd>
          </dl>
        )}
      </Modal>
    </>
  );
};

export default PersonDataPage;
