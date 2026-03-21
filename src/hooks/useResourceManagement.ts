import { resourceService } from "@/api";
import type {
  DeleteResourceData,
  ResourceChangeSequenceData,
  ResourceCreateData,
  ResourceUpdateData,
} from "@/types/resource-admin";
import type { ResourceFormData, ResourceMenuItem, ResourceTreeNode } from "@/types/resource";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useResourceManagement = () => {
  // Core state
  const [resources, setResources] = useState<ResourceMenuItem[]>([]);
  const [selectedResource, setSelectedResource] = useState<ResourceMenuItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  // Use useRef to avoid unnecessary re-creation
  const fetchResourcesRef = useRef({
    showDeleted,
  });

  // Update ref when dependencies change
  fetchResourcesRef.current = {
    showDeleted,
  };

  const treeData: ResourceTreeNode[] = useMemo(() => {
    const idToNode = new Map<string, ResourceTreeNode>();
    const roots: ResourceTreeNode[] = [];
    resources.forEach((r) => {
      idToNode.set(r.id, {
        id: r.id,
        pid: r.pid,
        name: r.name,
        key: r.key,
        code: r.code,
        icon: r.icon,
        path: r.path,
        type: r.type,
        description: r.description,
        sequence: r.sequence ?? 0,
        is_deleted: r.is_deleted ?? false,
        children: [],
        level: 1,
        is_group: false,
        group_type: undefined,
      });
    });
    idToNode.forEach((node) => {
      if (node.pid && idToNode.has(node.pid)) {
        const parent = idToNode.get(node.pid)!;
        node.level = (parent.level || 1) + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [resources]);

  // Unified API call function
  const fetchResources = useCallback(async () => {
    const { showDeleted } = fetchResourcesRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const res = await resourceService.getResources(showDeleted);

      if (res.success) {
        setResources(res.data.items as ResourceMenuItem[]);
      } else {
        setError(res.message || "Failed to load resources");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies; use ref for latest state

  // Toggle recycle mode
  const toggleTrashMode = useCallback(() => {
    setShowDeleted((prev) => !prev);
  }, []);

  // Initial load and auto-refresh when showDeleted changes
  useEffect(() => {
    fetchResources();
  }, [showDeleted, fetchResources]);

  const selectResource = useCallback((r: ResourceMenuItem | null) => {
    setSelectedResource(r);
  }, []);

  const startEdit = useCallback(() => setIsEditing(true), []);
  const cancelEdit = useCallback(() => setIsEditing(false), []);

  const saveResource = useCallback(
    async (data: ResourceFormData) => {
      try {
        if (selectedResource) {
          // Update resource
          const updateData: ResourceUpdateData = {
            name: data.name,
            key: data.key,
            code: data.code,
            path: data.path,
            icon: data.icon,
            type: data.type,
            is_visible: data.is_visible,
            description: data.description,
            remark: data.remark,
            pid: data.pid,
          };
          await resourceService.updateResource(selectedResource.id, updateData);
        } else {
          // Create resource (backend handles sorting automatically)
          const createData: ResourceCreateData = {
            name: data.name,
            key: data.key,
            code: data.code,
            path: data.path,
            icon: data.icon,
            type: data.type,
            is_visible: data.is_visible,
            description: data.description,
            remark: data.remark,
            pid: data.pid,
          };
          await resourceService.createResource(createData);
        }
        await fetchResources();
        setIsEditing(false);
      } catch (e) {
        console.error("Failed to save resource:", e);
        throw e; // Let caller handle the error
      }
    },
    [selectedResource, fetchResources]
  );

  const deleteResource = useCallback(
    async (id: string, reason?: string, permanent?: boolean) => {
      try {
        const deleteData: DeleteResourceData | undefined =
          reason !== undefined || permanent !== undefined ? { reason, permanent } : undefined;
        await resourceService.deleteResource(id, deleteData);
        await fetchResources();
      } catch (e) {
        console.error("Failed to delete resource:", e);
        throw e; // Let caller handle the error
      }
    },
    [fetchResources]
  );

  const restoreResource = useCallback(
    async (id: string) => {
      try {
        await resourceService.restoreResource(id);
        await fetchResources();
      } catch (e) {
        console.error("Failed to restore resource:", e);
        throw e; // Let caller handle the error
      }
    },
    [fetchResources]
  );

  // Move up one position (handle MENU and SYSTEM root nodes separately)
  const moveUp = useCallback(
    async (id: string) => {
      try {
        const resource = resources.find((r) => r.id === id);
        if (!resource) return;

        let siblings: ResourceMenuItem[];

        // For root nodes (pid is null), handle MENU and SYSTEM separately
        if (!resource.pid) {
          siblings = resources.filter((r) => !r.pid && r.type === resource.type);
        } else {
          siblings = resources.filter((r) => r.pid === resource.pid);
        }

        const sortedSiblings = siblings.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        const currentIndex = sortedSiblings.findIndex((r) => r.id === id);

        if (currentIndex > 0) {
          const prevResource = sortedSiblings[currentIndex - 1];
          const changeData: ResourceChangeSequenceData = {
            id: id,
            sequence: resource.sequence ?? 0,
            another_id: prevResource.id,
            another_sequence: prevResource.sequence ?? 0,
          };
          await resourceService.changeSequence(changeData);
          await fetchResources();
        }
      } catch (e) {
        console.error("Failed to move resource up:", e);
        throw e; // Let caller handle the error
      }
    },
    [resources, fetchResources]
  );

  // Move down one position (handle MENU and SYSTEM root nodes separately)
  const moveDown = useCallback(
    async (id: string) => {
      try {
        const resource = resources.find((r) => r.id === id);
        if (!resource) return;

        let siblings: ResourceMenuItem[];

        // For root nodes (pid is null), handle MENU and SYSTEM separately
        if (!resource.pid) {
          siblings = resources.filter((r) => !r.pid && r.type === resource.type);
        } else {
          siblings = resources.filter((r) => r.pid === resource.pid);
        }

        const sortedSiblings = siblings.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        const currentIndex = sortedSiblings.findIndex((r) => r.id === id);

        if (currentIndex < sortedSiblings.length - 1) {
          const nextResource = sortedSiblings[currentIndex + 1];
          const changeData: ResourceChangeSequenceData = {
            id: id,
            sequence: resource.sequence ?? 0,
            another_id: nextResource.id,
            another_sequence: nextResource.sequence ?? 0,
          };
          await resourceService.changeSequence(changeData);
          await fetchResources();
        }
      } catch (e) {
        console.error("Failed to move resource down:", e);
        throw e; // Let caller handle the error
      }
    },
    [resources, fetchResources]
  );

  // Check whether resource can move (MENU and SYSTEM root nodes are evaluated separately)
  const canMoveUp = useCallback(
    (id: string) => {
      const resource = resources.find((r) => r.id === id);
      if (!resource) return false;

      // For root nodes (pid is null), evaluate MENU and SYSTEM separately
      if (!resource.pid) {
        const sameTypeRoots = resources.filter((r) => !r.pid && r.type === resource.type);
        const sortedRoots = sameTypeRoots.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        const currentIndex = sortedRoots.findIndex((r) => r.id === id);
        return currentIndex > 0;
      }

      // Non-root nodes follow original logic
      const siblings = resources.filter((r) => r.pid === resource.pid);
      const sortedSiblings = siblings.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      const currentIndex = sortedSiblings.findIndex((r) => r.id === id);
      return currentIndex > 0;
    },
    [resources]
  );

  const canMoveDown = useCallback(
    (id: string) => {
      const resource = resources.find((r) => r.id === id);
      if (!resource) return false;

      // For root nodes (pid is null), evaluate MENU and SYSTEM separately
      if (!resource.pid) {
        const sameTypeRoots = resources.filter((r) => !r.pid && r.type === resource.type);
        const sortedRoots = sameTypeRoots.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        const currentIndex = sortedRoots.findIndex((r) => r.id === id);
        return currentIndex < sortedRoots.length - 1;
      }

      // Non-root nodes follow original logic
      const siblings = resources.filter((r) => r.pid === resource.pid);
      const sortedSiblings = siblings.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
      const currentIndex = sortedSiblings.findIndex((r) => r.id === id);
      return currentIndex < sortedSiblings.length - 1;
    },
    [resources]
  );

  return {
    // State
    resources,
    treeData,
    selectedResource,
    isLoading,
    error,
    isEditing,
    showDeleted,

    // Basic actions
    selectResource,
    startEdit,
    cancelEdit,

    // CRUD actions
    saveResource,
    deleteResource,
    restoreResource,

    // Sort actions
    moveUp,
    moveDown,
    canMoveUp,
    canMoveDown,

    // Mode controls
    toggleTrashMode,

    // API calls
    fetchResources,
  } as const;
};
