import { ministryService, type MinistryDetail, type MinistryListItem } from "@/api/services/ministryService";
import { orgService, type AssignablePositionItem } from "@/api/services/orgService";
import { Resource, Verb } from "@/const/enums";
import { usePermissions } from "@/context/AuthContext";
import {
  ministryMembersToDraft,
  validateMinistryMembers,
  type MinistryMemberDraft,
} from "@/pages/Ministry/components/MinistryMembersEditor";
import { notifyApiError, notifySuccess } from "@/utils/operationFeedback";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useSearchParams } from "react-router";
import { formatPositionLabel } from "./formatPositionLabel";
import { parseMinistryQueryId, resolveStewardDirectorySelection, withMinistryQueryId } from "./stewardDirectorySelection";
import {
  convertStewardDirectorySortToApiParams,
  DEFAULT_STEWARD_DIRECTORY_SORT,
  toggleStewardDirectorySort,
  type StewardDirectorySortField,
  type StewardDirectorySortState,
} from "./stewardDirectorySort";

const DIRECTORY_PAGE_SIZE = 100;
const MINISTRY_STATUSES = ["draft", "pending_approval", "active", "rejected", "inactive"] as const;

const draftsEqual = (left: MinistryMemberDraft[], right: MinistryMemberDraft[]): boolean => JSON.stringify(left) === JSON.stringify(right);

export const useStewardDirectoryPage = () => {
  const { t, i18n } = useTranslation("ministry");
  const { t: tOrg } = useTranslation("org");
  const { hasPermission } = usePermissions();
  const canModify = hasPermission(`${Resource.MinistryMember}:${Verb.Modify}`);
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<StewardDirectorySortState>(DEFAULT_STEWARD_DIRECTORY_SORT);
  const [railItems, setRailItems] = useState<MinistryListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<MinistryDetail | null>(null);
  const [members, setMembers] = useState<MinistryMemberDraft[]>([]);
  const [savedMembers, setSavedMembers] = useState<MinistryMemberDraft[]>([]);
  const [ownerPositionId, setOwnerPositionId] = useState<string | null>(null);
  const [positions, setPositions] = useState<AssignablePositionItem[]>([]);
  const [memberError, setMemberError] = useState<string>();
  const [loadingRail, setLoadingRail] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [pendingMinistryId, setPendingMinistryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const selectedIdRef = useRef<string | null>(null);
  const isDirtyRef = useRef(false);
  const didInitializeRef = useRef(false);
  const railItemsRef = useRef<MinistryListItem[]>([]);
  const applySelectRef = useRef<(ministryId: string, shouldSyncUrl: boolean) => void>(() => undefined);
  selectedIdRef.current = selectedId;
  railItemsRef.current = railItems;
  const isDirty = isEditing && !draftsEqual(members, savedMembers);
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

  const ownerPosition = useMemo(
    () => (ownerPositionId ? positions.find((item) => item.id === ownerPositionId) : undefined),
    [ownerPositionId, positions],
  );

  const ownerPositionLabel = useMemo(() => {
    if (!ownerPositionId) return null;
    if (!ownerPosition) return ownerPositionId;
    return formatPositionLabel(ownerPosition, tOrg);
  }, [ownerPosition, ownerPositionId, tOrg]);

  const ownerPositionIncumbent = ownerPosition?.incumbentDisplayName || null;

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
        setOwnerPositionId(null);
        setSelectedMinistry(null);
        setIsEditing(false);
        setLoadingRoster(false);
        return;
      }
      setLoadingRoster(true);
      try {
        const res = await ministryService.getMinistryById(ministryId);
        if (selectedIdRef.current !== ministryId) return;
        if (res.success) {
          const draft = ministryMembersToDraft(res.data.members || []);
          setMembers(draft);
          setSavedMembers(draft);
          setOwnerPositionId(res.data.ownerPositionId || null);
          setSelectedMinistry(res.data);
          setMemberError(undefined);
        }
      } catch (error) {
        if (selectedIdRef.current === ministryId) {
          notifyApiError(error, {
            title: t("common:feedback.loadFailed"),
            fallbackDescription: t("common:feedback.loadFailedDesc"),
          });
        }
      } finally {
        if (selectedIdRef.current === ministryId) {
          setLoadingRoster(false);
        }
      }
    },
    [t],
  );

  const applySelect = useCallback(
    (ministryId: string, shouldSyncUrl: boolean) => {
      selectedIdRef.current = ministryId;
      setSelectedId(ministryId);
      setIsEditing(false);
      setSelectedMinistry(null);
      setMembers([]);
      setSavedMembers([]);
      setOwnerPositionId(null);
      setMemberError(undefined);
      if (shouldSyncUrl) syncUrl(ministryId);
      void loadRoster(ministryId);
    },
    [loadRoster, syncUrl],
  );
  applySelectRef.current = applySelect;

  const loadDirectory = useCallback(async () => {
    setLoadingRail(true);
    try {
      const items: MinistryListItem[] = [];
      let page = 0;
      let total = Number.POSITIVE_INFINITY;
      while (items.length < total) {
        const sortParams = convertStewardDirectorySortToApiParams(sort);
        const res = await ministryService.getStewardDirectory({
          page,
          page_size: DIRECTORY_PAGE_SIZE,
          q: query.trim() || undefined,
          status: statusFilter || undefined,
          order_by: sortParams.order_by,
          descending: sortParams.descending,
        });
        if (!res.success) {
          notifyApiError(undefined, {
            title: t("common:feedback.loadFailed"),
            fallbackDescription: t("common:feedback.loadFailedDesc"),
          });
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
        applySelectRef.current(decision.ministryId, decision.syncUrl);
      } else if (decision.action === "clear") {
        selectedIdRef.current = null;
        setSelectedId(null);
        setIsEditing(false);
        setMembers([]);
        setSavedMembers([]);
        setOwnerPositionId(null);
        setSelectedMinistry(null);
      }
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.loadFailed"),
        fallbackDescription: t("common:feedback.loadFailedDesc"),
      });
    } finally {
      setLoadingRail(false);
    }
  }, [query, sort, statusFilter, t]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    void orgService.getAssignablePositions().then((res) => {
      if (res.success) setPositions(res.data.items || []);
    });
  }, []);

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

  const handleSortFieldClick = useCallback((field: StewardDirectorySortField) => {
    setSort((current) => toggleStewardDirectorySort(current, field));
  }, []);

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
    if (decision.action === "reload") {
      void loadRoster(decision.ministryId);
      return;
    }
    if (decision.action === "select") {
      applySelect(decision.ministryId, decision.syncUrl);
    }
  };

  const save = useCallback(async (): Promise<boolean> => {
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
      notifySuccess({ title: t("common:feedback.saved") });
      setMemberError(undefined);
      await loadRoster(selectedId);
      setIsEditing(false);
      return true;
    } catch (error) {
      notifyApiError(error, {
        title: t("common:feedback.saveFailed"),
        fallbackDescription: t("common:feedback.saveFailedDesc"),
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [canModify, loadRoster, members, selectedId, t]);

  const cancelEdit = useCallback(() => {
    setMembers(savedMembers);
    setMemberError(undefined);
    setIsEditing(false);
  }, [savedMembers]);

  const enterEdit = useCallback(() => {
    setMembers(savedMembers);
    setMemberError(undefined);
    setIsEditing(true);
  }, [savedMembers]);

  const closeUnsaved = useCallback(() => {
    setUnsavedOpen(false);
    setPendingMinistryId(null);
    if (blocker.state === "blocked") blocker.reset();
  }, [blocker]);

  const discardUnsaved = useCallback(async () => {
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
    setIsEditing(false);
  }, [applySelect, blocker, loadRoster, pendingMinistryId, selectedId]);

  const saveUnsaved = useCallback(async () => {
    const saved = await save();
    if (!saved) return;
    const nextId = pendingMinistryId;
    setUnsavedOpen(false);
    setPendingMinistryId(null);
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    if (nextId) applySelect(nextId, true);
  }, [applySelect, blocker, pendingMinistryId, save]);

  return {
    canModify,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    statusOptions,
    sort,
    handleSortFieldClick,
    railItems,
    loadingRail,
    selectedId,
    selectedMinistry,
    handleRailClick,
    members,
    setMembers,
    memberError,
    isEditing,
    isDirty,
    loadingRoster,
    saving,
    ownerPositionId,
    ownerPositionLabel,
    ownerPositionIncumbent,
    enterEdit,
    cancelEdit,
    save,
    unsavedOpen,
    closeUnsaved,
    discardUnsaved,
    saveUnsaved,
  };
};
