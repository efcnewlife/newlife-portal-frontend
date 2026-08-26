import {
  legalDocumentService,
  type LegalDocumentDetail,
  type LegalDocumentItem,
} from "@/api/services/legalDocumentService";
import type { DataTableColumn, MenuButtonType, PageButtonType, PopoverType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { Button, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { PopoverPosition, Resource } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import LegalDocumentDataForm, {
  type LegalDocumentDataFormHandle,
} from "@/pages/Content/LegalDocument/LegalDocumentDataForm";
import { isLegalDocumentKind, isLegalDocumentProduct } from "@/pages/Content/LegalDocument/legalDocumentForm";
import LegalDocumentSearchPopover, {
  type LegalDocumentSearchFilters,
} from "@/pages/Content/LegalDocument/LegalDocumentSearchPopover";
import type { ApiError } from "@/types/api";
import { DateUtil } from "@/utils/dateUtil";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type LegalDocumentRow = LegalDocumentItem & Record<string, unknown>;

const LegalDocumentDataPage = () => {
  const { t } = useTranslation("content");
  const [items, setItems] = useState<LegalDocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [descending, setDescending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<LegalDocumentSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<LegalDocumentSearchFilters>({});
  const [editing, setEditing] = useState<LegalDocumentDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal(false);
  const formRef = useRef<LegalDocumentDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);
  const clearSelectionRef = useRef<() => void>(() => {});

  const productLabel = useCallback(
    (value: string) => t(`legalDocument.product.${value}`, { defaultValue: value }),
    [t]
  );
  const kindLabel = useCallback((value: string) => t(`legalDocument.kind.${value}`, { defaultValue: value }), [t]);

  const fetchPages = useCallback(async () => {
    clearSelectionRef.current?.();
    setLoading(true);
    try {
      const res = await legalDocumentService.getPages({
        page: currentPage - 1,
        page_size: pageSize,
        order_by: orderBy,
        descending,
        product: appliedFilters.product || undefined,
        kind: appliedFilters.kind || undefined,
      });
      if (res.success) {
        setItems((res.data.items || []) as LegalDocumentRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, descending, orderBy, pageSize, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const columns: DataTableColumn<LegalDocumentRow>[] = useMemo(
    () => [
      {
        key: "product",
        label: t("legalDocument.table.product"),
        sortable: true,
        width: "w-48",
        render: (value) => productLabel(String(value || "")),
      },
      {
        key: "kind",
        label: t("legalDocument.table.kind"),
        sortable: true,
        width: "w-48",
        render: (value) => kindLabel(String(value || "")),
      },
      {
        key: "updateAt",
        label: t("legalDocument.table.updatedAt"),
        sortable: true,
        width: "w-40",
        render: (value) => (value ? DateUtil.format(value as string) : "—"),
      },
    ],
    [kindLabel, productLabel, t]
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
      <LegalDocumentSearchPopover
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        onSearch={(filters) => {
          setAppliedFilters({
            product: filters.product && isLegalDocumentProduct(filters.product) ? filters.product : "",
            kind: filters.kind && isLegalDocumentKind(filters.kind) ? filters.kind : "",
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
          title: t("legalDocument.search.popoverTitle"),
          position: PopoverPosition.BottomLeft,
          width: "420px",
        },
      }),
      CommonPageButton.REFRESH(() => {
        clearSelectionRef.current?.();
        void fetchPages();
      }),
    ];
  }, [fetchPages, searchFilters, t]);

  const rowActions: MenuButtonType<LegalDocumentRow>[] = useMemo(
    () => [
      CommonRowAction.EDIT(async (row) => {
        try {
          const res = await legalDocumentService.getById(row.id);
          if (res.success) {
            setEditing(res.data);
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
      }),
    ],
    [openFormModal, t]
  );

  return (
    <>
      <DataPage<LegalDocumentRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.ContentLegalDocument}
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
        title={t("legalDocument.modal.editTitle")}
        isOpen={isFormOpen}
        onClose={() => {
          closeFormModal();
          setEditing(null);
        }}
        className="max-w-3xl w-full mx-4 p-6"
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
          if (!editing?.id || !formRef.current?.validate()) return;
          const values = formRef.current.getValues();
          setSubmitting(true);
          try {
            await legalDocumentService.update(editing.id, values);
            notifySuccess({ title: t("common:feedback.updated") });
            closeFormModal();
            setEditing(null);
            await fetchPages();
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
        {editing ? <LegalDocumentDataForm ref={formRef} document={editing} /> : null}
      </ModalForm>
    </>
  );
};

export default LegalDocumentDataPage;
