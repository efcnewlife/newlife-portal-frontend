import type { ResourceMenuItem } from "@/types/resource";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdAdd, MdArrowDownward, MdArrowUpward, MdDelete, MdEdit, MdRestore, MdVisibility, MdSwapHoriz } from "react-icons/md";

interface ResourceContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  resource: ResourceMenuItem | null;
  onView: (resource: ResourceMenuItem) => void;
  onEdit: (resource: ResourceMenuItem) => void;
  onDelete: (resource: ResourceMenuItem) => void;
  onRestore: (resource: ResourceMenuItem) => void;
  onAddChild: (resource: ResourceMenuItem) => void;
  onMoveUp: (resource: ResourceMenuItem) => void;
  onMoveDown: (resource: ResourceMenuItem) => void;
  onChangeParent: (resource: ResourceMenuItem) => void;
  canView?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canRestore: boolean;
  canAddChild: boolean;
  canMoveUp: (id: string) => boolean;
  canMoveDown: (id: string) => boolean;
  canChangeParent?: boolean;
}

export const ResourceContextMenu: React.FC<ResourceContextMenuProps> = ({
  visible,
  x,
  y,
  resource,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onAddChild,
  onMoveUp,
  onMoveDown,
  onChangeParent,
  canView = true,
  canEdit,
  canDelete,
  canRestore,
  canAddChild,
  canMoveUp,
  canMoveDown,
  canChangeParent = true,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y });

  useEffect(() => {
    if (!visible) return;
    const padding = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;

    const rect = menuRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 200;
    const height = rect?.height ?? 260;

    if (left + width + padding > vw) {
      left = Math.max(padding, vw - width - padding);
    }
    if (top + height + padding > vh) {
      top = Math.max(padding, vh - height - padding);
    }

    setPos({ left, top });
  }, [visible, x, y]);

  if (!visible || !resource) {
    return null;
  }

  const showOnlyViewInTrashForRoot = canRestore && !resource.is_deleted && !resource.pid;

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] max-w-[90vw]"
      style={{ left: pos.left, top: pos.top }}
    >
      {canView && (
        <button
          onClick={() => onView(resource)}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <MdVisibility className="h-4 w-4" />
          {t("system:resource.menu.viewDetails")}
        </button>
      )}

      {!showOnlyViewInTrashForRoot && canEdit && !resource.is_deleted && (
        <button
          onClick={() => onEdit(resource)}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <MdEdit className="h-4 w-4" />
          {t("system:resource.menu.editResource")}
        </button>
      )}

      {!showOnlyViewInTrashForRoot && canAddChild && !resource.is_deleted && !resource.pid && (
        <button
          onClick={() => onAddChild(resource)}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <MdAdd className="h-4 w-4" />
          {t("system:resource.menu.addChild")}
        </button>
      )}

      {!showOnlyViewInTrashForRoot && canChangeParent && canEdit && !resource.is_deleted && resource.pid && (
        <button
          onClick={() => onChangeParent(resource)}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
        >
          <MdSwapHoriz className="h-4 w-4" />
          {t("system:resource.menu.changeParent")}
        </button>
      )}

      {!showOnlyViewInTrashForRoot && canEdit && !resource.is_deleted && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

          {canMoveUp(resource.id) && (
            <button
              onClick={() => onMoveUp(resource)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <MdArrowUpward className="h-4 w-4" />
              {t("system:resource.menu.moveUp")}
            </button>
          )}

          {canMoveDown(resource.id) && (
            <button
              onClick={() => onMoveDown(resource)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <MdArrowDownward className="h-4 w-4" />
              {t("system:resource.menu.moveDown")}
            </button>
          )}
        </>
      )}

      {!showOnlyViewInTrashForRoot && canRestore && resource.is_deleted && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
          <button
            onClick={() => onRestore(resource)}
            className="w-full px-3 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
          >
            <MdRestore className="h-4 w-4" />
            {t("system:resource.menu.restore")}
          </button>
        </>
      )}

      {!showOnlyViewInTrashForRoot && canDelete && (
        <>
          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
          <button
            onClick={() => onDelete(resource)}
            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <MdDelete className="h-4 w-4" />
            {canRestore && resource.is_deleted ? t("system:resource.menu.deletePermanent") : t("system:resource.menu.deleteResource")}
          </button>
        </>
      )}
    </div>
  );
};
