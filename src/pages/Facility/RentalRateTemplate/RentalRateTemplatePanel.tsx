import { facilityService, type RentalRateTemplateItem } from "@/api/services/facilityService";
import DeleteForm from "@/components/DataPage/DeleteForm";
import { Button, Modal, ModalForm, type ModalFormHandle } from "@efcnewlife/newlife-ui";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import { useModal } from "@/hooks/useModal";
import { cn } from "@/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd, MdDelete, MdEdit, MdRefresh } from "react-icons/md";
import { formatApplicabilitySummary } from "./applicabilityFormat";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import RentalRateTemplateDataForm, {
  type RentalRateTemplateDataFormHandle,
  type RentalRateTemplateFormValues,
} from "./RentalRateTemplateDataForm";

interface RentalRateTemplatePanelProps {
  onChanged?: () => void;
}

const RentalRateTemplatePanel = ({ onChanged }: RentalRateTemplatePanelProps) => {
  const { t } = useTranslation("facility");
  const { hasPermission } = usePermissions();
  const [items, setItems] = useState<RentalRateTemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RentalRateTemplateItem | null>(null);
  const [formValues, setFormValues] = useState<RentalRateTemplateFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen, openModal, closeModal } = useModal(false);
  const { isOpen: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal(false);
  const formRef = useRef<RentalRateTemplateDataFormHandle>(null);
  const modalRef = useRef<ModalFormHandle>(null);

  const canCreate = hasPermission(`${Resource.FacilityRentalRateTemplate}:${Verb.Create}`);
  const canModify = hasPermission(`${Resource.FacilityRentalRateTemplate}:${Verb.Modify}`);
  const canDelete = hasPermission(`${Resource.FacilityRentalRateTemplate}:${Verb.Delete}`);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await facilityService.getRentalRateTemplateList();
      if (res.success) {
        setItems(res.data.items || []);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const notifyChanged = useCallback(() => {
    onChanged?.();
  }, [onChanged]);

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormValues({ name: "", billingUnit: "hourly", unitAmount: "30", currency: "CAD" });
    openModal();
  };

  const openEdit = async (item: RentalRateTemplateItem) => {
    const res = await facilityService.getRentalRateTemplateById(item.id);
    if (!res.success) return;
    const d = res.data;
    setFormMode("edit");
    setEditing(item);
    setFormValues({
      name: d.name,
      billingUnit: d.billingUnit,
      applicability: d.applicability ?? null,
      unitAmount: String(d.unitAmount),
      currency: d.currency,
      isDefault: d.isDefault,
      isActive: d.isActive,
    });
    openModal();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {canCreate && (
          <Button variant="primary" size="sm" onClick={openCreate} startIcon={<MdAdd className="size-4" />}>
            {t("rentalRateTemplate.panel.add")}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchList()}
          disabled={loading}
          startIcon={<MdRefresh className="size-4" />}
        >
          {t("rentalRateTemplate.panel.refresh")}
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("rentalRateTemplate.panel.loading")}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("rentalRateTemplate.panel.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900",
                !item.isActive && "opacity-70"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t(`rentalRateTemplate.billingUnits.${item.billingUnit}`, {
                      defaultValue: item.billingUnit,
                    })}
                    {" · "}
                    {formatApplicabilitySummary(item.applicability, t)}
                    {" · "}
                    {item.unitAmount} {item.currency || "CAD"}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.isDefault && (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        {t("rentalRateTemplate.panel.badgeDefault")}
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs",
                        item.isActive
                          ? "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      )}
                    >
                      {item.isActive
                        ? t("rentalRateTemplate.panel.badgeActive")
                        : t("rentalRateTemplate.panel.badgeInactive")}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {canModify && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void openEdit(item)}
                      aria-label={t("common:edit", { ns: "common" })}
                    >
                      <MdEdit className="size-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(item);
                        openDeleteModal();
                      }}
                      aria-label={t("common:delete", { ns: "common" })}
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400"
                    >
                      <MdDelete className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ModalForm
        ref={modalRef}
        isOpen={isOpen}
        onClose={closeModal}
        title={
          formMode === "create" ? t("rentalRateTemplate.modal.createTitle") : t("rentalRateTemplate.modal.editTitle")
        }
        className="max-w-3xl w-full mx-4 p-6"
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
          setSubmitting(true);
          try {
            if (formMode === "create") {
              await facilityService.createRentalRateTemplate(formRef.current.getValues());
              notifySuccess({ title: t("common:feedback.created") });
            } else if (editing?.id) {
              await facilityService.updateRentalRateTemplate(editing.id, formRef.current.getValues());
              notifySuccess({ title: t("common:feedback.updated") });
            }
            closeModal();
            await fetchList();
            notifyChanged();
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
        <RentalRateTemplateDataForm ref={formRef} defaultValues={formValues} isCreate={formMode === "create"} />
      </ModalForm>

      <Modal
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        title={t("rentalRateTemplate.modal.deleteSoft")}
        className="max-w-lg mx-4 p-6"
      >
        <DeleteForm
          entityName={t("rentalRateTemplate.deleteForm.entityLabel")}
          isPermanent={false}
          submitting={submitting}
          onCancel={closeDeleteModal}
          onSubmit={async ({ reason, permanent }) => {
            if (!editing?.id) return;
            setSubmitting(true);
            try {
              await facilityService.deleteRentalRateTemplate(editing.id, {
                reason,
                permanent: permanent || false,
              });
              notifySuccess({ title: t("common:feedback.deleted") });
              closeDeleteModal();
              await fetchList();
              notifyChanged();
            } catch (error) {
              notifyApiError(error, {
                title: t("common:feedback.saveFailed"),
                fallbackDescription: t("common:feedback.saveFailedDesc"),
              });
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default RentalRateTemplatePanel;
