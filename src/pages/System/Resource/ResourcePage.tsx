import { resourceService } from "@/api";
import RestoreForm from "@/components/DataPage/RestoreForm";
import { Modal } from "@efcnewlife/newlife-ui";
import { useResourceManagement } from "@/hooks/useResourceManagement";
import { useResourcePermissions } from "@/hooks/useResourcePermissions";
import type { ResourceMenuItem as ApiResourceMenuItem } from "@/types/resource-admin";
import type { ResourceFormData, ResourceMenuItem, ResourceTreeNode } from "@/types/resource";
import { useCallback, useMemo, useState } from "react";
import ResourceChangeParentForm from "./ResourceChangeParentForm";
import { ResourceContextMenu } from "./ResourceContextMenu";
import ResourceDataForm, { type ResourceFormValues } from "./ResourceDataForm";
import ResourceDeleteForm from "./ResourceDeleteForm";
import ResourceDetailView from "./ResourceDetailView";
import { ResourceToolbar } from "./ResourceToolbar";
import { ResourceTreeView } from "./ResourceTreeView";

export default function ResourcePage() {
  const permissions = useResourcePermissions();

  // Use the refactored hook
  const {
    resources,
    treeData,
    selectedResource,
    isLoading,
    error,
    showDeleted,
    selectResource,
    saveResource,
    deleteResource,
    restoreResource,
    moveUp,
    moveDown,
    canMoveUp,
    canMoveDown,
    toggleTrashMode,
    fetchResources,
  } = useResourceManagement();

  // UI state
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    resource: ResourceMenuItem | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    resource: null,
  });

  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isChangeParentOpen, setIsChangeParentOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<ResourceMenuItem | null>(null);
  const [parentResource, setParentResource] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restoreIds, setRestoreIds] = useState<string[]>([]);

  // Expand/collapse nodes
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Expand all
  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    const collectIds = (nodes: ResourceTreeNode[]) => {
      nodes.forEach((node) => {
        allNodeIds.add(node.id);
        collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpandedNodes(allNodeIds);
  }, [treeData]);

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Refresh resources (wrap hook fetchResources for error handling)
  const refreshResources = useCallback(async () => {
    try {
      await fetchResources();
    } catch (e) {
      console.error("Failed to refresh resources:", e);
      alert("Refresh failed. Please try again later.");
    }
  }, [fetchResources]);

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, resource: ResourceMenuItem) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      resource,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Form handlers
  const openModal = useCallback((mode: "create" | "edit", resource?: ResourceMenuItem, parent?: { id: string; name: string }) => {
    setFormMode(mode);
    setEditing(resource || null);
    setParentResource(parent || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setEditing(null);
    setParentResource(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteOpen(false);
    setEditing(null);
  }, []);

  const closeRestoreModal = useCallback(() => {
    setIsRestoreOpen(false);
    setRestoreIds([]);
  }, []);

  const closeViewModal = useCallback(() => {
    setIsViewOpen(false);
    setEditing(null);
  }, []);

  const closeChangeParentModal = useCallback(() => {
    setIsChangeParentOpen(false);
    setEditing(null);
  }, []);

  // Handle add root resource
  const handleAddRootResource = useCallback(() => {
    // Clear selection to ensure create flow
    selectResource(null);
    openModal("create");
  }, [openModal, selectResource]);

  // Handle add child resource
  const handleAddChild = useCallback(
    (resource: ResourceMenuItem) => {
      // Adding child resources also uses create flow
      selectResource(null);
      openModal("create", undefined, { id: resource.id, name: resource.name });
      hideContextMenu();
    },
    [openModal, hideContextMenu, selectResource]
  );

  // Handle edit
  const handleEdit = useCallback(
    async (resource: ResourceMenuItem) => {
      try {
        // Fetch detailed resource data before opening edit form
        const resp = await resourceService.getResource(resource.id);
        if (resp.success && resp.data) {
          // Set selected resource so save uses update API
          const resourceData = resp.data as ApiResourceMenuItem;
          const resourceWithVisible: ResourceMenuItem = {
            ...resourceData,
            is_visible: resourceData.is_visible ?? true,
          };
          selectResource(resourceWithVisible);
          openModal("edit", resourceWithVisible);
        } else {
          // Fallback to existing resource data when request fails
          selectResource(resource);
          openModal("edit", resource);
        }
      } catch {
        // On error, also fallback to existing resource data
        selectResource(resource);
        openModal("edit", resource);
      } finally {
        hideContextMenu();
      }
    },
    [openModal, hideContextMenu, selectResource]
  );

  // Handle view
  const handleView = useCallback(
    (resource: ResourceMenuItem) => {
      setEditing(resource);
      setIsViewOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Handle delete
  const handleDelete = useCallback(
    (resource: ResourceMenuItem) => {
      setEditing(resource);
      setIsDeleteOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(
    async (data: { reason?: string; permanent?: boolean }) => {
      if (!editing) return;

      setSubmitting(true);
      try {
        await deleteResource(editing.id, data.reason, data.permanent);
        closeDeleteModal();
      } catch (e) {
        console.error("Failed to delete resource:", e);
        alert("Delete failed. Please try again later.");
      } finally {
        setSubmitting(false);
      }
    },
    [editing, deleteResource, closeDeleteModal]
  );

  // Handle restore
  const handleRestore = useCallback(
    (resource: ResourceMenuItem) => {
      setRestoreIds([resource.id]);
      setIsRestoreOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Handle restore confirmation
  const handleRestoreConfirm = useCallback(
    async (ids: string[]) => {
      setSubmitting(true);
      try {
        for (const id of ids) {
          await restoreResource(id);
        }
        closeRestoreModal();
      } catch (e) {
        console.error("Failed to restore resource:", e);
        alert("Restore failed. Please try again later.");
      } finally {
        setSubmitting(false);
      }
    },
    [restoreResource, closeRestoreModal]
  );

  // Handle sorting
  const handleMoveUp = useCallback(
    async (resource: ResourceMenuItem) => {
      try {
        await moveUp(resource.id);
      } catch (e) {
        console.error("Failed to move resource up:", e);
        alert("Move up failed. Please try again later.");
      }
      hideContextMenu();
    },
    [moveUp, hideContextMenu]
  );

  const handleMoveDown = useCallback(
    async (resource: ResourceMenuItem) => {
      try {
        await moveDown(resource.id);
      } catch (e) {
        console.error("Failed to move resource down:", e);
        alert("Move down failed. Please try again later.");
      }
      hideContextMenu();
    },
    [moveDown, hideContextMenu]
  );

  // Handle changing parent resource
  const handleChangeParent = useCallback(
    (resource: ResourceMenuItem) => {
      setEditing(resource);
      setIsChangeParentOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Handle parent switch confirmation
  const handleChangeParentConfirm = useCallback(
    async (parentId: string) => {
      if (!editing) return;

      setSubmitting(true);
      try {
        await resourceService.changeParent(editing.id, { pid: parentId });
        await fetchResources();
        closeChangeParentModal();
      } catch (e) {
        console.error("Failed to change parent resource:", e);
        alert("Failed to change parent resource. Please try again later.");
      } finally {
        setSubmitting(false);
      }
    },
    [editing, fetchResources, closeChangeParentModal]
  );

  // Get root resources (non-deleted root nodes)
  const rootResources = useMemo(() => {
    return resources.filter((r) => !r.pid && !r.is_deleted);
  }, [resources]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (values: ResourceFormValues) => {
      setSubmitting(true);
      try {
        await saveResource(values as ResourceFormData);
        closeModal();
      } catch (e) {
        console.error("Failed to save resource:", e);
        alert("Save failed. Please try again later.");
      } finally {
        setSubmitting(false);
      }
    },
    [saveResource, closeModal]
  );

  // Close context menu when clicking outside
  const handleClickOutside = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  // Loading state
  if (isLoading && resources.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading resource data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Failed to load resource data</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 relative">
      {/* Resource Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <ResourceToolbar
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          onRefresh={refreshResources}
          onToggleTrashMode={toggleTrashMode}
          onAddRootResource={handleAddRootResource}
          isLoading={isLoading}
          isTrashMode={showDeleted}
          canAdd={permissions.canModify}
        />
      </div>

      {/* Resource tree */}
      <div className="flex-1 relative max-w-full overflow-x-auto overflow-y-auto custom-scrollbar rounded-xl">
        <ResourceTreeView
          treeData={treeData}
          selectedResource={selectedResource}
          onSelect={(resource) => selectResource(resource as ResourceMenuItem)}
          onContextMenu={handleContextMenu}
          expandedNodes={expandedNodes}
          onToggleExpand={toggleExpand}
        />

        {/* Loading overlay while refreshing */}
        {isLoading && resources.length > 0 && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Refreshing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ResourceContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        resource={contextMenu.resource}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onAddChild={handleAddChild}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onChangeParent={handleChangeParent}
        canView
        canEdit={permissions.canModify}
        canDelete={permissions.canDelete}
        canRestore={showDeleted}
        canAddChild={permissions.canModify}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        canChangeParent={permissions.canModify}
      />

      {/* Click outside to close context menu */}
      {contextMenu.visible && <div className="fixed inset-0 z-40" onClick={handleClickOutside} />}

      {/* Create/Edit modal */}
      <Modal
        title={formMode === "create" ? "Create Resource" : "Edit Resource"}
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[800px] w-full mx-4 p-6"
      >
        <ResourceDataForm
          mode={formMode}
          defaultValues={
            editing
              ? {
                  id: editing.id,
                  name: editing.name,
                  key: editing.key,
                  code: editing.code,
                  icon: editing.icon || "",
                  path: editing.path || "",
                  type: editing.type,
                  is_visible: editing.is_visible ?? true,
                  description: editing.description || "",
                  remark: editing.remark || "",
                  // Editing child resources requires pid; fallback to parent.id when missing
                  pid: editing.pid ?? (editing as ApiResourceMenuItem).parent?.id ?? undefined,
                }
              : null
          }
          parentResource={parentResource}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
        />
      </Modal>

      {/* Delete modal */}
      <Modal
        title={showDeleted ? "Confirm Permanent Resource Deletion" : "Confirm Resource Deletion"}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <ResourceDeleteForm onSubmit={handleDeleteConfirm} onCancel={closeDeleteModal} submitting={submitting} isPermanent={showDeleted} />
      </Modal>

      {/* Restore modal */}
      <Modal title="Restore Resource" isOpen={isRestoreOpen} onClose={closeRestoreModal} className="max-w-[500px] w-full mx-4 p-6">
        <RestoreForm
          ids={restoreIds}
          entityName="resource"
          onSubmit={handleRestoreConfirm}
          onCancel={closeRestoreModal}
          submitting={submitting}
        />
      </Modal>

      {/* View modal */}
      <Modal title="Resource Details" isOpen={isViewOpen} onClose={closeViewModal} className="max-w-[900px] w-full mx-4 p-6">
        {editing && <ResourceDetailView resourceId={editing.id} />}
      </Modal>

      {/* Change parent modal */}
      <Modal title="Change Parent Resource" isOpen={isChangeParentOpen} onClose={closeChangeParentModal} className="max-w-[500px] w-full mx-4 p-6">
        {editing && (
          <ResourceChangeParentForm
            rootResources={rootResources}
            currentResource={editing}
            onSubmit={handleChangeParentConfirm}
            onCancel={closeChangeParentModal}
            submitting={submitting}
          />
        )}
      </Modal>
    </div>
  );
}
