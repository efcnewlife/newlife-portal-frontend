import { ministryService, type MinistryListItem } from "@/api/services/ministryService";
import type { PageButtonType, PopoverType } from "@/components/DataPage";
import DataTableToolbar from "@/components/DataPage/DataTableToolbar";
import { CommonPageButton } from "@/components/DataPage";
import { Button } from "@efcnewlife/newlife-ui";
import { PopoverPosition, Resource } from "@/const/enums";
import MinistryMembersEditor, {
  ministryMembersToDraft,
  type MinistryMemberDraft,
  validateMinistryMembers,
} from "@/pages/Ministry/components/MinistryMembersEditor";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MinistryMemberSearchPopover, { type MinistryMemberSearchFilters } from "./MinistryMemberSearchPopover";

const MinistryMemberDataPage = () => {
  const { t } = useTranslation("ministry");
  const [ministries, setMinistries] = useState<MinistryListItem[]>([]);
  const [searchFilters, setSearchFilters] = useState<MinistryMemberSearchFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<MinistryMemberSearchFilters>({});
  const [members, setMembers] = useState<MinistryMemberDraft[]>([]);
  const [memberError, setMemberError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void ministryService.getMinistryList().then((res) => {
      if (res.success) setMinistries(res.data.items || []);
    });
  }, []);

  const loadMembers = useCallback(
    async (ministryId: string) => {
      if (!ministryId) {
        setMembers([]);
        return;
      }
      setLoading(true);
      try {
        const res = await ministryService.getMinistryById(ministryId);
        if (res.success) {
          setMembers(ministryMembersToDraft(res.data.members || []));
          setMemberError(undefined);
        }
      } catch {
        alert(t("shared.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void loadMembers(appliedFilters.ministryId || "");
  }, [appliedFilters.ministryId, loadMembers]);

  const toolbarButtons: PageButtonType[] = useMemo(() => {
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
      <MinistryMemberSearchPopover
        filters={searchFilters}
        onFiltersChange={setSearchFilters}
        ministries={ministries}
        onSearch={(filters) => {
          setAppliedFilters(filters);
          onOpenChange(false);
        }}
        onClear={() => {
          setSearchFilters({});
          setAppliedFilters({});
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
          title: t("ministryMember.search.popoverTitle"),
          position: PopoverPosition.BottomLeft,
          width: "420px",
        },
      }),
      CommonPageButton.REFRESH(() => {
        void loadMembers(appliedFilters.ministryId || "");
      }),
    ];
  }, [appliedFilters.ministryId, loadMembers, ministries, searchFilters, t]);

  const handleSave = async () => {
    const validation_error = validateMinistryMembers(members.filter((m) => m.userId), t);
    if (validation_error) {
      setMemberError(validation_error);
      return;
    }
    if (!appliedFilters.ministryId) return;
    setSaving(true);
    try {
      await ministryService.replaceMinistryMembers(appliedFilters.ministryId, {
        members: members.filter((m) => m.userId),
      });
      setMemberError(undefined);
      await loadMembers(appliedFilters.ministryId);
    } catch {
      alert(t("shared.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-resource={Resource.MinistryMember} className="h-full flex flex-col rounded-xl bg-white dark:bg-white/[0.03]">
      <DataTableToolbar buttons={toolbarButtons} resource={Resource.MinistryMember} />
      <div className="flex-1 min-h-0 p-4 border border-t-0 border-gray-100 dark:border-white/[0.05] rounded-b-xl">
        {loading ? (
          <p className="text-sm text-gray-500">{t("common:loading", { ns: "common", defaultValue: "Loading..." })}</p>
        ) : appliedFilters.ministryId ? (
          <div className="space-y-4 max-w-2xl">
            <MinistryMembersEditor value={members} onChange={setMembers} error={memberError} />
            <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
              {t("ministryMember.save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t("ministryMember.search.selectMinistryHint")}</p>
        )}
      </div>
    </div>
  );
};

export default MinistryMemberDataPage;
