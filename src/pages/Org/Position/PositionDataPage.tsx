import { orgService, type PositionDetail } from "@/api/services/orgService";
import { userService } from "@/api/services/userService";
import type { DataTableColumn, MenuButtonType, PageButtonType } from "@/components/DataPage";
import { CommonPageButton, CommonRowAction, DataPage } from "@/components/DataPage";
import { dayjsToApiUtcIso, getLocalTimezone } from "@/utils/dayjsApi";
import { Button, DateTimePicker, Modal, ModalForm, Select } from "@efcnewlife/newlife-ui";
import { Resource, Verb } from "@/const/enums";
import { useModal } from "@/hooks/useModal";
import { usePickerLabels } from "@/hooks/usePickerLabels";
import type { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MdSettings } from "react-icons/md";
import { useTranslation } from "react-i18next";
import PositionCatalogModal from "./PositionCatalogModal";

type PositionRow = PositionDetail & Record<string, unknown>;

const PositionDataPage = () => {
  const { t } = useTranslation("org");
  const [items, setItems] = useState<PositionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string | undefined>();
  const [descending, setDescending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState<PositionRow | null>(null);
  const [assigning, setAssigning] = useState<PositionRow | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignStartAt, setAssignStartAt] = useState<Dayjs | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; label: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const { isOpen: isViewOpen, openModal: openViewModal, closeModal: closeViewModal } = useModal(false);
  const { isOpen: isAssignOpen, openModal: openAssignModal, closeModal: closeAssignModal } = useModal(false);
  const { isOpen: isSettingsOpen, openModal: openSettingsModal, closeModal: closeSettingsModal } = useModal(false);
  const clearSelectionRef = useRef<() => void>(() => {});

  const fetchPages = useCallback(async () => {
    clearSelectionRef.current?.();
    setLoading(true);
    try {
      const res = await orgService.getPositionPages({
        page: currentPage - 1,
        page_size: pageSize,
        order_by: orderBy,
        descending,
      });
      if (res.success) {
        setItems((res.data.items || []) as PositionRow[]);
        setTotal(res.data.total);
        setCurrentPage((res.data.page ?? 0) + 1);
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      alert(t("shared.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, orderBy, descending, t]);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    void userService.getList({}).then((res) => {
      if (!res.success) return;
      const list = res.data?.items || [];
      setUsers(
        list.map((u) => ({
          id: u.id,
          label: u.displayName ? `${u.displayName} (${u.email || u.id})` : u.email || u.id,
        })),
      );
    });
  }, []);

  const displayTimezone = useMemo(() => getLocalTimezone(), []);
  const pickerLabels = usePickerLabels();

  const userOptions = useMemo(
    () => [{ value: "", label: t("position.assign.selectUser") }, ...users.map((u) => ({ value: u.id, label: u.label }))],
    [users, t],
  );

  const positionTeamLabel = useCallback(
    (value?: string) => (value ? t(`position.enums.team.${value}`) : ""),
    [t],
  );

  const positionOfficeLabel = useCallback(
    (value?: string) => (value ? t(`position.enums.office.${value}`) : ""),
    [t],
  );

  const columns: DataTableColumn<PositionRow>[] = useMemo(
    () => [
      {
        key: "team",
        label: t("position.table.team"),
        sortable: true,
        width: "w-40",
        render: (value) => positionTeamLabel(String(value || "")),
      },
      {
        key: "office",
        label: t("position.table.office"),
        sortable: true,
        width: "w-32",
        render: (value) => positionOfficeLabel(String(value || "")),
      },
      { key: "name", label: t("position.table.name"), sortable: true, width: "w-48" },
      {
        key: "currentUserDisplayName",
        label: t("position.table.incumbent"),
        width: "w-48",
        render: (value) => (value ? String(value) : t("position.detail.noIncumbent")),
      },
    ],
    [t, positionTeamLabel, positionOfficeLabel],
  );

  const toolbarButtons: PageButtonType[] = useMemo(
    () => [
      CommonPageButton.REFRESH(() => {
        clearSelectionRef.current?.();
        void fetchPages();
      }),
      {
        key: "settings",
        text: t("position.actions.settings"),
        icon: <MdSettings />,
        onClick: openSettingsModal,
        permission: Verb.Read,
        variant: "secondary",
      },
    ],
    [fetchPages, openSettingsModal, t],
  );

  const rowActions: MenuButtonType<PositionRow>[] = useMemo(
    () => [
      CommonRowAction.VIEW(async (row) => {
        const res = await orgService.getPositionById(row.id);
        if (res.success) {
          setViewing(res.data as PositionRow);
          openViewModal();
        }
      }),
      {
        key: "assign",
        text: t("position.actions.assign"),
        onClick: (row) => {
          setAssigning(row);
          setAssignUserId(row.currentUserId || "");
          setAssignStartAt(null);
          openAssignModal();
        },
        permission: Verb.Modify,
      },
    ],
    [openAssignModal, openViewModal, t],
  );

  return (
    <>
      <DataPage<PositionRow>
        data={{ page: currentPage, pageSize, total, items }}
        columns={columns}
        loading={loading}
        orderBy={orderBy}
        descending={descending}
        resource={Resource.OrgPosition}
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

      <Modal
        title={t("position.modal.detailTitle")}
        isOpen={isViewOpen}
        onClose={closeViewModal}
        className="max-w-2xl w-full mx-4 p-6"
      >
        {viewing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">{t("position.table.code")}</dt>
            <dd>{viewing.code}</dd>
            <dt className="text-gray-500">{t("position.table.team")}</dt>
            <dd>{positionTeamLabel(viewing.team)}</dd>
            <dt className="text-gray-500">{t("position.table.office")}</dt>
            <dd>{positionOfficeLabel(viewing.office)}</dd>
            <dt className="text-gray-500">{t("position.table.name")}</dt>
            <dd>{viewing.name}</dd>
            <dt className="text-gray-500">{t("position.table.canOwnMinistry")}</dt>
            <dd>{viewing.canOwnMinistry ? t("shared.yes") : t("shared.no")}</dd>
            <dt className="text-gray-500">{t("position.detail.currentIncumbent")}</dt>
            <dd>{viewing.currentUserDisplayName || t("position.detail.noIncumbent")}</dd>
          </dl>
        )}
      </Modal>

      <ModalForm
        title={t("position.modal.assignTitle")}
        isOpen={isAssignOpen}
        onClose={closeAssignModal}
        className="max-w-lg w-full mx-4 p-6"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeAssignModal} disabled={submitting}>
              {t("common:cancel", { ns: "common" })}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submitting || !assignUserId}
              onClick={async () => {
                if (!assigning?.id || !assignUserId) return;
                setSubmitting(true);
                try {
                  await orgService.assignPosition(assigning.id, {
                    userId: assignUserId,
                    startAt: dayjsToApiUtcIso(assignStartAt),
                  });
                  closeAssignModal();
                  await fetchPages();
                } catch {
                  alert(t("shared.saveFailed"));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {t("position.actions.assign")}
            </Button>
          </>
        }
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="space-y-4">
          <Select
            id="position-assign-user"
            label={t("position.assign.user")}
            options={userOptions}
            value={assignUserId}
            onChange={(v) => setAssignUserId(String(v))}
          />
          <DateTimePicker
            id="position-assign-start"
            label={t("position.assign.startAt")}
            value={assignStartAt}
            onChange={(value) => setAssignStartAt(value)}
            timezone={displayTimezone}
            ampm
            showSubmitButton={false}
            labels={pickerLabels}
          />
        </div>
      </ModalForm>

      <PositionCatalogModal
        isOpen={isSettingsOpen}
        onClose={closeSettingsModal}
        onCatalogChanged={() => {
          void fetchPages();
        }}
      />
    </>
  );
};

export default PositionDataPage;
