import { ministryService, type MinistryListItem } from "@/api/services/ministryService";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import MinistryMembersEditor, {
  ministryMembersToDraft,
  type MinistryMemberDraft,
  validateMinistryMembers,
} from "@/pages/Ministry/components/MinistryMembersEditor";
import { cn } from "@/utils";
import { Button, Input, Modal, Select } from "@efcnewlife/newlife-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useSearchParams } from "react-router";
import {
  parseMinistryQueryId,
  resolveStewardDirectorySelection,
  withMinistryQueryId,
} from "./stewardDirectorySelection";

const DIRECTORY_PAGE_SIZE = 100;
const MINISTRY_STATUSES = ["draft", "pending_approval", "active", "rejected", "inactive"] as const;

const draftsEqual = (left: MinistryMemberDraft[], right: MinistryMemberDraft[]): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const MinistryMemberDataPage = () => {
  const { t, i18n } = useTranslation("ministry");
  const { hasPermission } = usePermissions();
  const canModify = hasPermission(`${Resource.MinistryMember}:${Verb.Modify}`);
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [railItems, setRailItems] = useState<MinistryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<MinistryMemberDraft[]>([]);
  const [savedMembers, setSavedMembers] = useState<MinistryMemberDraft[]>([]);
  const [memberError, setMemberError] = useState<string>();
  const [loadingRail, setLoadingRail] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingMinistryId, setPendingMinistryId] = useState<string | null>(null);

  const selectedIdRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);
  const didInitializeRef = useRef(false);
  const railItemsRef = useRef<MinistryListItem[]>([]);
  selectedIdRef.current = selectedId;
  railItemsRef.current = railItems;
  const isDirty = !draftsEqual(members, savedMembers);
  isDirtyRef.current = isDirty;

  const blocker = useBlocker(isDirty);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("ministryMember.filter.allStatuses") },
      ...MINISTRY_STATUSES.map((status) => ({
        value: status,
        label: t(`ministry.status.${status}`, { defaultValue: status }),
      })),
    ],
    [t],
  );

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const syncUrl = useCallback(
    (ministryId: string | null) => {
      setSearchParams(
        (prev) => {
          const next = withMinistryQueryId(`?${prev.toString()}`, ministryId);
          return new URLSearchParams(next.startsWith("?") ? next.slice(1) : next);
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const loadRoster = useCallback(
    async (ministryId: string | null) => {
      if (!ministryId) {
        setMembers([]);
        setSavedMembers([]);
        return;
      }
      setLoadingRoster(true);
      try {
        const res = await ministryService.getMinistryById(ministryId);
        if (res.success) {
          const draft = ministryMembersToDraft(res.data.members || []);
          setMembers(draft);
          setSavedMembers(draft);
          setMemberError(undefined);
        }
      } catch {
        alert(t("shared.loadFailed"));
      } finally {
        setLoadingRoster(false);
      }
    },
    [t],
  );

  const applySelect = useCallback(
    (ministryId: string, shouldSyncUrl: boolean) => {
      setSelectedId(ministryId);
      if (shouldSyncUrl) syncUrl(ministryId);
      void loadRoster(ministryId);
    },
    [loadRoster, syncUrl],
  );

  const loadDirectory = useCallback(async () => {
    setLoadingRail(true);
    try {
      const items: MinistryListItem[] = [];
      let page = 0;
      let total = Number.POSITIVE_INFINITY;
      while (items.length < total) {
        const res = await ministryService.getStewardDirectory({
          page,
          page_size: DIRECTORY_PAGE_SIZE,
          q: query.trim() || undefined,
          status: statusFilter || undefined,
        });
        if (!res.success) {
          alert(t("shared.loadFailed"));
          break;
        }
        const batch = res.data.items || [];
        total = res.data.total ?? batch.length;
        items.push(...batch);
        if (batch.length === 0) break;
        page += 1;
      }
      setRailItems(items);
      const decision = resolveStewardDirectorySelection({
        reason: didInitializeRef.current ? "filter" : "load",
        urlMinistryId: parseMinistryQueryId(`?${searchParamsRef.current.toString()}`),
        railIds: items.map((item) => item.id),
        currentSelectedId: selectedIdRef.current,
        isDirty: isDirtyRef.current,
      });
      didInitializeRef.current = true;
      if (decision.action === "select") {
        applySelect(decision.ministryId, decision.syncUrl);
      } else if (decision.action === "clear") {
        setSelectedId(null);
        setMembers([]);
        setSavedMembers([]);
      }
    } catch {
      alert(t("shared.loadFailed"));
    } finally {
      setLoadingRail(false);
    }
  }, [applySelect, query, statusFilter, t]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  const urlMinistryId = parseMinistryQueryId(`?${searchParams.toString()}`);
  useEffect(() => {
    if (!didInitializeRef.current) return;
    const decision = resolveStewardDirectorySelection({
      reason: "url-change",
      urlMinistryId,
      railIds: railItemsRef.current.map((item) => item.id),
      currentSelectedId: selectedIdRef.current,
      isDirty: isDirtyRef.current,
    });
    if (decision.action === "block") {
      syncUrl(selectedIdRef.current);
      setUnsavedOpen(true);
      return;
    }
    if (decision.action === "select") {
      applySelect(decision.ministryId, false);
    }
  }, [applySelect, syncUrl, urlMinistryId]);

  useEffect(() => {
    const onLanguageChanged = () => {
      void loadDirectory();
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => {
      i18n.off("languageChanged", onLanguageChanged);
    };
  }, [i18n, loadDirectory]);

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    setPendingMinistryId(null);
    setUnsavedOpen(true);
  }, [blocker.state]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const handleRailClick = (ministryId: string) => {
    const decision = resolveStewardDirectorySelection({
      reason: "rail-click",
      urlMinistryId: parseMinistryQueryId(`?${searchParams.toString()}`),
      railIds: railItems.map((item) => item.id),
      currentSelectedId: selectedId,
      isDirty,
      requestedId: ministryId,
    });
    if (decision.action === "block") {
      setPendingMinistryId(ministryId);
      setUnsavedOpen(true);
      return;
    }
    if (decision.action === "select") {
      applySelect(decision.ministryId, decision.syncUrl);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!selectedId || !canModify) return false;
    const validationError = validateMinistryMembers(
      members.filter((member) => member.userId),
      t,
    );
    if (validationError) {
      setMemberError(validationError);
      return false;
    }
    setSaving(true);
    try {
      await ministryService.replaceMinistryMembers(selectedId, {
        members: members.filter((member) => member.userId),
      });
      setMemberError(undefined);
      await loadRoster(selectedId);
      return true;
    } catch {
      alert(t("shared.saveFailed"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const closeUnsaved = () => {
    setUnsavedOpen(false);
    setPendingMinistryId(null);
    if (blocker.state === "blocked") blocker.reset();
  };

  const discardUnsaved = async () => {
    const nextId = pendingMinistryId;
    setUnsavedOpen(false);
    setPendingMinistryId(null);
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    if (nextId) {
      applySelect(nextId, true);
      return;
    }
    await loadRoster(selectedId);
  };

  const saveUnsaved = async () => {
    const saved = await handleSave();
    if (!saved) return;
    const nextId = pendingMinistryId;
    setUnsavedOpen(false);
    setPendingMinistryId(null);
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    if (nextId) applySelect(nextId, true);
  };

  return (
    <div data-resource={Resource.MinistryMember} className="h-full flex flex-col rounded-xl bg-white dark:bg-white/[0.03]">
      <div className="flex-1 min-h-0 flex border border-gray-100 dark:border-white/[0.05] rounded-xl overflow-hidden">
        <aside className="w-72 shrink-0 border-r border-gray-100 dark:border-white/[0.05] flex flex-col">
          <div className="p-3 space-y-3">
            <Input
              id="steward-directory-q"
              label={t("ministryMember.search.queryLabel")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("ministryMember.search.queryPlaceholder")}
              clearable
            />
            <Select
              id="steward-directory-status"
              label={t("ministryMember.filter.status")}
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(String(value ?? ""))}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loadingRail ? (
              <p className="px-3 py-2 text-sm text-gray-500">{t("common:loading", { ns: "common", defaultValue: "Loading..." })}</p>
            ) : railItems.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">{t("ministryMember.emptyRail")}</p>
            ) : (
              <ul>
                {railItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm border-b border-gray-50 dark:border-white/[0.04]",
                        selectedId === item.id ? "bg-gray-100 dark:bg-white/[0.08]" : "hover:bg-gray-50 dark:hover:bg-white/[0.04]",
                      )}
                      onClick={() => handleRailClick(item.id)}
                    >
                      <span className="block font-medium text-gray-800 dark:text-gray-100">{item.name || item.id}</span>
                      <span className="block text-xs text-gray-500">
                        {t(`ministry.status.${item.status}`, { defaultValue: item.status })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        <section className="flex-1 min-h-0 overflow-y-auto p-4">
          {loadingRoster ? (
            <p className="text-sm text-gray-500">{t("common:loading", { ns: "common", defaultValue: "Loading..." })}</p>
          ) : selectedId ? (
            <div className="space-y-4 max-w-2xl">
              <MinistryMembersEditor value={members} onChange={setMembers} error={memberError} disabled={!canModify} />
              <div className="flex gap-2">
                {canModify ? (
                  <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={saving}>
                    {t("ministryMember.save")}
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => void loadRoster(selectedId)} disabled={saving}>
                  {t("ministryMember.refresh")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("ministryMember.emptyDetail")}</p>
          )}
        </section>
      </div>
      <Modal isOpen={unsavedOpen} onClose={closeUnsaved} title={t("ministryMember.unsaved.title")} className="max-w-md mx-4 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t("ministryMember.unsaved.body")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={closeUnsaved}>
            {t("common:cancel", { ns: "common" })}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void discardUnsaved()}>
            {t("ministryMember.unsaved.discard")}
          </Button>
          {canModify ? (
            <Button variant="primary" size="sm" onClick={() => void saveUnsaved()}>
              {t("ministryMember.save")}
            </Button>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default MinistryMemberDataPage;
