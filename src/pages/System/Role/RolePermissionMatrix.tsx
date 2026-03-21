import { permissionService } from "@/api/services/permissionService";
import { resourceService } from "@/api/services/resourceService";
import { verbService, type VerbItem } from "@/api/services/verbService";
import { Checkbox, Tooltip } from "newlife-ui";
import { AdminResourceType } from "@/const/resource";
import type { PermissionListItem } from "@/types/api";
import type { ResourceMenuItem } from "@/types/resource-admin";
import { resolveIcon } from "@/utils/icon-resolver";
import { useCallback, useEffect, useMemo, useState } from "react";

type PermissionMatrixProps = {
  value: string[]; // selected permission IDs
  onChange: (ids: string[]) => void;
  className?: string;
};

type PermissionMap = Record<string, Record<string, string | undefined>>; // resourceId -> verbId -> permissionId

export default function RolePermissionMatrix({ value, onChange, className = "" }: PermissionMatrixProps) {
  const [resources, setResources] = useState<ResourceMenuItem[]>([]);
  const [verbs, setVerbs] = useState<VerbItem[]>([]);
  const [permMap, setPermMap] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(false);
  const [permInfoById, setPermInfoById] = useState<Record<string, { code: string }>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [vr, rr, pr] = await Promise.all([verbService.list(), resourceService.getResources(false), permissionService.list()]);
      if (vr.success) setVerbs(vr.data.items || []);
      if (rr.success) setResources(rr.data.items || []);
      if (pr.success) {
        const items: PermissionListItem[] = Array.isArray(pr.data) ? pr.data : pr.data?.items || [];
        const map: PermissionMap = {};
        const info: Record<string, { code: string }> = {};
        // Build helper indexes: resource code/key -> id, verb action -> id
        const resourceIndexByCode: Record<string, string> = {};
        const resourceIndexByName: Record<string, string> = {};
        (rr.success ? rr.data.items : []).forEach((r: ResourceMenuItem) => {
          if (r?.code) resourceIndexByCode[String(r.code).toLowerCase()] = r.id;
          if (r?.key) resourceIndexByCode[String(r.key).toLowerCase()] ||= r.id;
          if (r?.name) resourceIndexByName[String(r.name).toLowerCase()] = r.id;
        });
        const verbIndexByAction: Record<string, string> = {};
        const verbIndexByName: Record<string, string> = {};
        (vr.success ? vr.data.items : []).forEach((v: VerbItem) => {
          if (v?.action) verbIndexByAction[String(v.action).toLowerCase()] = v.id;
          if (v?.displayName) verbIndexByName[String(v.displayName).toLowerCase()] = v.id;
        });

        items.forEach((p) => {
          // PermissionListItem guarantees resourceId and verbId
          let resourceId: string | undefined = p.resourceId;
          let verbId: string | undefined = p.verbId;

          // Fallback: parse resource/verb from code if data is incomplete
          if ((!resourceId || !verbId) && p.code.includes(":")) {
            const [codePrefixRaw, actionRaw] = p.code.split(":");
            const codePrefix = codePrefixRaw.toLowerCase();
            const action = actionRaw.toLowerCase();
            if (!resourceId) resourceId = resourceIndexByCode[codePrefix];
            if (!verbId) verbId = verbIndexByAction[action];
          }

          if (!resourceId || !verbId) {
            console.warn(`Permission skipped: code=${p.code}, resourceId=${resourceId}, verbId=${verbId}`, p);
            return;
          }

          if (!map[resourceId]) map[resourceId] = {};
          map[resourceId][verbId] = p.id;
          info[p.id] = { code: p.code || p.displayName || "" };
        });
        setPermMap(map);
        setPermInfoById(info);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const togglePermission = (permissionId?: string) => {
    if (!permissionId) return;
    const set = new Set(value);
    if (set.has(permissionId)) set.delete(permissionId);
    else set.add(permissionId);
    onChange([...set]);
  };

  // Build tree structure and flattened rows (grouped by type)
  type TreeNode = ResourceMenuItem & { children: TreeNode[] };

  // Helper function to build tree structure
  const buildTree = useCallback((resourceList: ResourceMenuItem[]): TreeNode[] => {
    const byId: Record<string, TreeNode> = {};
    resourceList.forEach((r) => (byId[r.id] = { ...r, children: [] }));
    const roots: TreeNode[] = [];
    resourceList.forEach((r) => {
      const node = byId[r.id];
      const pid = r.pid || r.parent?.id;
      if (pid && byId[pid]) byId[pid].children.push(node);
      else roots.push(node);
    });
    // Sort by resource management order: sequence first, then name
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const sa = a.sequence ?? 0;
        const sb = b.sequence ?? 0;
        if (sa !== sb) return sa - sb;
        return (a.name || "").localeCompare(b.name || "");
      });
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }, []);

  // Group resources by type
  const { systemResources, generalResources } = useMemo(() => {
    const system: ResourceMenuItem[] = [];
    const general: ResourceMenuItem[] = [];
    resources.forEach((r) => {
      if (r.type === AdminResourceType.SYSTEM) {
        system.push(r);
      } else {
        general.push(r);
      }
    });
    return {
      systemResources: system,
      generalResources: general,
    };
  }, [resources]);

  // System resource tree
  const systemTree: TreeNode[] = useMemo(() => {
    return buildTree(systemResources);
  }, [systemResources, buildTree]);

  // General resource tree
  const generalTree: TreeNode[] = useMemo(() => {
    return buildTree(generalResources);
  }, [generalResources, buildTree]);

  // Build resource map (for fast lookup) - includes all resources
  const resourceMap = useMemo(() => {
    const map: Record<string, TreeNode> = {};
    const buildMap = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        map[n.id] = n;
        if (n.children && n.children.length > 0) buildMap(n.children);
      });
    };
    buildMap(systemTree);
    buildMap(generalTree);
    return map;
  }, [systemTree, generalTree]);

  // Get IDs for resource and all descendants (recursive)
  const getResourceAndChildrenIds = useCallback((resourceId: string, resourceMap: Record<string, TreeNode>): string[] => {
    const ids: string[] = [resourceId];
    const resource = resourceMap[resourceId];
    if (resource && resource.children) {
      resource.children.forEach((child) => {
        ids.push(...getResourceAndChildrenIds(child.id, resourceMap));
      });
    }
    return ids;
  }, []);

  // Get permission IDs for a specific verb across all children of a root resource
  const getChildResourcePermissionsForVerb = useCallback(
    (rootResourceId: string, verbId: string, resourceMap: Record<string, TreeNode>): string[] => {
      const childResourceIds = getResourceAndChildrenIds(rootResourceId, resourceMap).slice(1); // Remove root resource itself
      const permIds: string[] = [];
      childResourceIds.forEach((childId) => {
        const permId = permMap[childId]?.[verbId];
        if (permId) permIds.push(permId);
      });
      return permIds;
    },
    [permMap, getResourceAndChildrenIds],
  );

  // Get all permission IDs across all children of a root resource
  const getChildResourceAllPermissions = useCallback(
    (rootResourceId: string, resourceMap: Record<string, TreeNode>): string[] => {
      const childResourceIds = getResourceAndChildrenIds(rootResourceId, resourceMap).slice(1); // Remove root resource itself
      const permIds: string[] = [];
      childResourceIds.forEach((childId) => {
        verbs.forEach((v) => {
          const permId = permMap[childId]?.[v.id];
          if (permId) permIds.push(permId);
        });
      });
      return permIds;
    },
    [permMap, verbs, getResourceAndChildrenIds],
  );

  const toggleAllForResource = useCallback(
    (resourceId: string) => {
      const set = new Set(value);
      const verbToPerm = permMap[resourceId] || {};
      const allPermIds = verbs.map((v) => verbToPerm[v.id]).filter(Boolean) as string[];
      const allSelected = allPermIds.length > 0 && allPermIds.every((id) => set.has(id));

      // For root resources (without direct permission items), control all child permissions
      if (allPermIds.length === 0) {
        const childPermIds = getChildResourceAllPermissions(resourceId, resourceMap);
        const allChildSelected = childPermIds.length > 0 && childPermIds.every((id) => set.has(id));

        if (allChildSelected) {
          childPermIds.forEach((id) => set.delete(id));
        } else {
          childPermIds.forEach((id) => set.add(id));
        }
      } else {
        // Standard logic for non-root resources
        if (allSelected) {
          allPermIds.forEach((id) => set.delete(id));
        } else {
          allPermIds.forEach((id) => set.add(id));
        }
      }
      onChange([...set]);
    },
    [value, permMap, verbs, getChildResourceAllPermissions, resourceMap, onChange],
  );

  // Toggle child permissions of a root resource for a specific verb
  const toggleVerbForRootResource = useCallback(
    (rootResourceId: string, verbId: string) => {
      const childPermIds = getChildResourcePermissionsForVerb(rootResourceId, verbId, resourceMap);
      if (childPermIds.length === 0) return;

      const set = new Set(value);
      const allSelected = childPermIds.every((id) => set.has(id));

      if (allSelected) {
        childPermIds.forEach((id) => set.delete(id));
      } else {
        childPermIds.forEach((id) => set.add(id));
      }
      onChange([...set]);
    },
    [value, getChildResourcePermissionsForVerb, resourceMap, onChange],
  );

  // Toggle all resource permissions for one verb (within the given resource list)
  const toggleAllForVerb = (verbId: string, resourceList: ResourceMenuItem[]) => {
    const set = new Set(value);
    const permIds: string[] = resourceList.map((r) => permMap[r.id]?.[verbId]).filter(Boolean) as string[];
    if (permIds.length === 0) return;
    const allSelected = permIds.every((id) => set.has(id));
    if (allSelected) permIds.forEach((id) => set.delete(id));
    else permIds.forEach((id) => set.add(id));
    onChange([...set]);
  };

  // Toggle "All" checkbox (all verbs within the given resource list)
  const toggleAllGlobal = (resourceList: ResourceMenuItem[]) => {
    const set = new Set(value);
    const permIds: string[] = resourceList.flatMap((r) => verbs.map((v) => permMap[r.id]?.[v.id])).filter(Boolean) as string[];
    if (permIds.length === 0) return;
    const allSelected = permIds.every((id) => set.has(id));
    if (allSelected) permIds.forEach((id) => set.delete(id));
    else permIds.forEach((id) => set.add(id));
    onChange([...set]);
  };

  // Flatten tree into rows (for a specific tree)
  const flattenTree = useCallback((nodes: TreeNode[], depth: number = 0): Array<{ node: TreeNode; depth: number }> => {
    const rows: Array<{ node: TreeNode; depth: number }> = [];
    const walk = (ns: TreeNode[], d: number) => {
      ns.forEach((n) => {
        rows.push({ node: n, depth: d });
        if (n.children && n.children.length > 0) walk(n.children, d + 1);
      });
    };
    walk(nodes, depth);
    return rows;
  }, []);

  const systemFlatRows = useMemo(() => flattenTree(systemTree, 0), [systemTree, flattenTree]);
  const generalFlatRows = useMemo(() => flattenTree(generalTree, 0), [generalTree, flattenTree]);

  // Helper function to render permission matrix table
  const renderPermissionTable = (
    title: string,
    resourceList: ResourceMenuItem[],
    tree: TreeNode[],
    flatRows: Array<{ node: TreeNode; depth: number }>,
  ) => {
    if (tree.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <div className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] rounded-t-lg border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        </div>
        <div className="border rounded-b-xl overflow-hidden">
          {/* Header (flex layout) */}
          <div className="flex items-center bg-gray-50 dark:bg-white/[0.03] border-b px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            <div className="shrink-0 w-50">Name</div>
            <div className="shrink-0 w-20">
              <Checkbox
                checked={(() => {
                  const allIds = resourceList.flatMap((r) => verbs.map((v) => permMap[r.id]?.[v.id])).filter(Boolean) as string[];
                  return allIds.length > 0 && allIds.every((id) => value.includes(id));
                })()}
                onChange={() => toggleAllGlobal(resourceList)}
                label="All"
              />
            </div>
            {verbs.map((v) => (
              <div key={v.id} className="flex-1 w-full">
                <Checkbox
                  checked={(() => {
                    const ids = resourceList.map((r) => permMap[r.id]?.[v.id]).filter(Boolean) as string[];
                    return ids.length > 0 && ids.every((id) => value.includes(id));
                  })()}
                  onChange={() => toggleAllForVerb(v.id, resourceList)}
                  label={`${v.displayName} (${v.action})`}
                />
              </div>
            ))}
          </div>
          {/* Body (flex rows) */}
          <div className="divide-y overflow-auto max-h-[420px]">
            {flatRows.map(({ node, depth }) => {
              const isRootResource = depth === 0; // Root resources are nodes with depth === 0
              const verbToPerm = permMap[node.id] || {};
              const allPermIds = verbs.map((v) => verbToPerm[v.id]).filter(Boolean) as string[];

              // Root resources: check permission state across all child resources
              const allSelected = isRootResource
                ? (() => {
                    const childPermIds = getChildResourceAllPermissions(node.id, resourceMap);
                    return childPermIds.length > 0 && childPermIds.every((id) => value.includes(id));
                  })()
                : allPermIds.length > 0 && allPermIds.every((id) => value.includes(id));

              return (
                <div key={node.id} className="flex items-center justify-start px-4 py-3 text-sm">
                  <div className={`flex shrink-0 items-center w-50 ${depth > 0 ? "pl-4" : ""}`}>
                    {resolveIcon(node.icon || "", { className: "size-4" }).icon}
                    <Tooltip content={node.code} placement="bottom">
                      <span className="pl-2">{node.name}</span>
                    </Tooltip>
                  </div>
                  <div className="shrink-0 items-center justify-start w-20">
                    <Checkbox checked={allSelected} onChange={() => toggleAllForResource(node.id)} />
                  </div>
                  {verbs.map((v) => {
                    if (isRootResource) {
                      // Root resources: checkbox controls this verb across all child resources
                      const childPermIds = getChildResourcePermissionsForVerb(node.id, v.id, resourceMap);
                      const checked = childPermIds.length > 0 && childPermIds.every((id) => value.includes(id));

                      return (
                        <div key={v.id} className="flex-1 items-center justify-start w-60">
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleVerbForRootResource(node.id, v.id)}
                            disabled={childPermIds.length === 0}
                            label={childPermIds.length > 0 ? `${v.displayName} permission for all child resources` : ""}
                            tooltip
                            tooltipPlacement="bottom"
                            className="max-w-50 truncate"
                          />
                        </div>
                      );
                    } else {
                      // Child resources: show specific permission checkbox
                      const pid = verbToPerm[v.id];
                      const checked = !!pid && value.includes(pid);
                      const fallbackCode = `${node.code || node.key || ""}:${v.action}`;
                      const codeText = pid ? permInfoById[pid]?.code || "" : fallbackCode;
                      return (
                        <div key={v.id} className="flex-1 items-center justify-start shrink-0 w-60">
                          <Checkbox
                            checked={checked}
                            onChange={() => togglePermission(pid)}
                            disabled={!pid}
                            label={codeText}
                            tooltip
                            tooltipPlacement="bottom"
                            className="max-w-50 truncate"
                          />
                        </div>
                      );
                    }
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-sm text-gray-500">Loading permissions...</div>;

  return (
    <div className={`space-y-0 ${className}`}>
      {renderPermissionTable("General Resources", generalResources, generalTree, generalFlatRows)}
      {renderPermissionTable("System Resources", systemResources, systemTree, systemFlatRows)}
    </div>
  );
}
