import { MdAdd, MdDelete, MdExpandMore, MdRefresh, MdUnfoldLess } from "react-icons/md";

interface ResourceToolbarProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh: () => void;
  onToggleTrashMode: () => void;
  onAddRootResource: () => void;
  isLoading?: boolean;
  isTrashMode?: boolean;
  canAdd?: boolean;
}

export const ResourceToolbar: React.FC<ResourceToolbarProps> = ({
  onExpandAll,
  onCollapseAll,
  onRefresh,
  onToggleTrashMode,
  onAddRootResource,
  isLoading = false,
  isTrashMode = false,
  canAdd = true,
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Left: Add and refresh operations */}
      <div className="flex items-center gap-2">
        {/* Add root resource button */}
        {canAdd && !isTrashMode && (
          <button
            onClick={onAddRootResource}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded transition-colors"
          >
            <MdAdd className="h-4 w-4" />
            Add root resource
          </button>
        )}

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-2 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MdRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>

        {/* Recycle bin mode switch button */}
        <button
          onClick={onToggleTrashMode}
          className={`flex items-center gap-2 px-2 py-2 text-sm rounded transition-colors ${
            isTrashMode
              ? "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300"
              : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          }`}
        >
          <MdDelete className="h-4 w-4" />
        </button>
      </div>

      {/* Right: Expand/Collapse operation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExpandAll}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
        >
          <MdExpandMore className="h-4 w-4" />
          Expand all
        </button>
        <button
          onClick={onCollapseAll}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
        >
          <MdUnfoldLess className="h-4 w-4" />
          Collapse all
        </button>
      </div>
    </div>
  );
};
