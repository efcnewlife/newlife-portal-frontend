import { resourceService, type ResourceMenuItem as ApiResourceMenuItem } from "@/api";
import RestoreForm from "@/components/DataPage/RestoreForm";
import { Modal } from "@efcnewlife/newlife-ui";
import { useResourceManagement } from "@/hooks/useResourceManagement";
import { useResourcePermissions } from "@/hooks/useResourcePermissions";
import type { ResourceFormData, ResourceMenuItem, ResourceTreeNode } from "@/types/resource";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ResourceChangeParentForm from "./ResourceChangeParentForm";
import { ResourceContextMenu } from "./ResourceContextMenu";
import ResourceDataForm, { type ResourceFormValues } from "./ResourceDataForm";
import ResourceDeleteForm from "./ResourceDeleteForm";
import ResourceDetailView from "./ResourceDetailView";
import { ResourceToolbar } from "./ResourceToolbar";
import { ResourceTreeView } from "./ResourceTreeView";

export default function ResourcePage() {
  const { t } = useTranslation();
  const permissions = useResourcePermissions();

  // Refactored resource management hook
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

  // Form / modal state
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

  // Expand/collapse tree nodes
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

  // Expand all nodes
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

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // Refresh resources (wraps hook fetchResources with error handling)
  const refreshResources = useCallback(async () => {
    try {
      await fetchResources();
    } catch (e) {
      console.error("refreshResources failed:", e);
      alert(t("system:resource.feedback.refreshFailedAlert"));
    }
  }, [fetchResources, t]);

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

  // Form helpers
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

  // Add root resource
  const handleAddRootResource = useCallback(() => {
    // Clear selection so save runs create flow
    selectResource(null);
    openModal("create");
  }, [openModal, selectResource]);

  // Add child resource
  const handleAddChild = useCallback(
    (resource: ResourceMenuItem) => {
      // Treat as create flow
      selectResource(null);
      openModal("create", undefined, { id: resource.id, name: resource.name });
      hideContextMenu();
    },
    [openModal, hideContextMenu, selectResource]
  );

  // Edit resource
  const handleEdit = useCallback(
    async (resource: ResourceMenuItem) => {
      try {
        // Load full detail before opening the edit form
        const resp = await resourceService.getResource(resource.id);
        if (resp.success && resp.data) {
          // Select resource so save uses update API
          const resourceData = resp.data as ApiResourceMenuItem;
          const resourceWithVisible: ResourceMenuItem = {
            ...resourceData,
            is_visible: resourceData.is_visible ?? true,
          };
          selectResource(resourceWithVisible);
          openModal("edit", resourceWithVisible);
        } else {
          // Fall back to row data if detail fetch fails
          selectResource(resource);
          openModal("edit", resource);
        }
      } catch {
        // On error, still use row data
        selectResource(resource);
        openModal("edit", resource);
      } finally {
        hideContextMenu();
      }
    },
    [openModal, hideContextMenu, selectResource]
  );

  // View detail
  const handleView = useCallback(
    (resource: ResourceMenuItem) => {
      setEditing(resource);
      setIsViewOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Delete (open confirm)
  const handleDelete = useCallback(
    (resource: ResourceMenuItem) => {
      setEditing(resource);
      setIsDeleteOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Confirm delete
  const handleDeleteConfirm = useCallback(
    async (data: { reason?: string; permanent?: boolean }) => {
      if (!editing) return;

      setSubmitting(true);
      try {
        await deleteResource(editing.id, data.reason, data.permanent);
        closeDeleteModal();
      } catch (e) {
        console.error("deleteResource failed:", e);
        alert(t("system:resource.feedback.deleteFailedAlert"));
      } finally {
        setSubmitting(false);
      }
    },
    [editing, deleteResource, closeDeleteModal, t]
  );

  // Restore (open confirm)
  const handleRestore = useCallback(
    (resource: ResourceMenuItem) => {
      setRestoreIds([resource.id]);
      setIsRestoreOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Confirm restore
  const handleRestoreConfirm = useCallback(
    async (ids: string[]) => {
      setSubmitting(true);
      try {
        for (const id of ids) {
          await restoreResource(id);
        }
        closeRestoreModal();
      } catch (e) {
        console.error("restoreResource failed:", e);
        alert(t("system:resource.feedback.restoreFailedAlert"));
      } finally {
        setSubmitting(false);
      }
    },
    [restoreResource, closeRestoreModal, t]
  );

  // Reorder (move up/down)
  const handleMoveUp = useCallback(
    async (resource: ResourceMenuItem) => {
      try {
        await moveUp(resource.id);
      } catch (e) {
        console.error("moveUp failed:", e);
        alert(t("system:resource.feedback.moveUpFailedAlert"));
      }
      hideContextMenu();
    },
    [moveUp, hideContextMenu, t]
  );

  const handleMoveDown = useCallback(
    async (resource: ResourceMenuItem) => {
      try {
        await moveDown(resource.id);
      } catch (e) {
        console.error("moveDown failed:", e);
        alert(t("system:resource.feedback.moveDownFailedAlert"));
      }
      hideContextMenu();
    },
    [moveDown, hideContextMenu, t]
  );

  // Change parent resource
  const handleChangeParent = useCallback(
    (resource: ResourceMenuItem) => {
      setEditing(resource);
      setIsChangeParentOpen(true);
      hideContextMenu();
    },
    [hideContextMenu]
  );

  // Confirm change parent
  const handleChangeParentConfirm = useCallback(
    async (parentId: string) => {
      if (!editing) return;

      setSubmitting(true);
      try {
        await resourceService.changeParent(editing.id, { pid: parentId });
        await fetchResources();
        closeChangeParentModal();
      } catch (e) {
        console.error("changeParent failed:", e);
        alert(t("system:resource.feedback.changeParentFailedAlert"));
      } finally {
        setSubmitting(false);
      }
    },
    [editing, fetchResources, closeChangeParentModal, t]
  );

  // Root resources (non-deleted, no parent)
  const rootResources = useMemo(() => {
    return resources.filter((r) => !r.pid && !r.is_deleted);
  }, [resources]);

  // Submit form
  const handleSubmit = useCallback(
    async (values: ResourceFormValues) => {
      setSubmitting(true);
      try {
        await saveResource(values as ResourceFormData);
        closeModal();
      } catch (e) {
        console.error("saveResource failed:", e);
        alert(t("system:resource.feedback.saveFailedAlert"));
      } finally {
        setSubmitting(false);
      }
    },
    [saveResource, closeModal, t]
  );

  // Click outside closes context menu
  const handleClickOutside = useCallback(() => {
    hideContextMenu();
  }, [hideContextMenu]);

  // Initial loading
  if (isLoading && resources.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("system:resource.loading.fullPageMessage")}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{t("system:resource.loading.errorTitle")}</p>
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
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t("system:resource.loading.overlayMessage")}</p>
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

      {/* Backdrop: click outside closes context menu */}
      {contextMenu.visible && <div className="fixed inset-0 z-40" onClick={handleClickOutside} />}

      {/* Create / edit modal */}
      <Modal
        title={formMode === "create" ? t("system:resource.modal.createTitle") : t("system:resource.modal.editTitle")}
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
                  // Child edit needs pid; fall back to parent.id if missing on detail
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
        title={showDeleted ? t("system:resource.modal.deleteConfirmPermanent.title") : t("system:resource.modal.deleteConfirmSoft.title")}
        isOpen={isDeleteOpen}
        onClose={closeDeleteModal}
        className="max-w-[560px] w-full mx-4 p-6"
      >
        <ResourceDeleteForm onSubmit={handleDeleteConfirm} onCancel={closeDeleteModal} submitting={submitting} isPermanent={showDeleted} />
      </Modal>

      {/* Restore modal */}
      <Modal title={t("system:resource.modal.restoreTitle")} isOpen={isRestoreOpen} onClose={closeRestoreModal} className="max-w-[500px] w-full mx-4 p-6">
        <RestoreForm
          ids={restoreIds}
          entityName={t("system:resource.restoreForm.entityLabel")}
          onSubmit={handleRestoreConfirm}
          onCancel={closeRestoreModal}
          submitting={submitting}
        />
      </Modal>

      {/* Detail modal */}
      <Modal title={t("system:resource.modal.detailTitle")} isOpen={isViewOpen} onClose={closeViewModal} className="max-w-[900px] w-full mx-4 p-6">
        {editing && <ResourceDetailView resourceId={editing.id} />}
      </Modal>

      {/* Change parent modal */}
      <Modal title={t("system:resource.modal.changeParentTitle")} isOpen={isChangeParentOpen} onClose={closeChangeParentModal} className="max-w-[500px] w-full mx-4 p-6">
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
