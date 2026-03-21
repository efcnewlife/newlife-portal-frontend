import type { ResourceMenuItem } from "@/types/resource";
import type { ResourceTreeNode as ResourceTreeNodeType } from "@/types/resource";
import { resolveIcon } from "@/utils/icon-resolver";
import { MdChevronRight } from "react-icons/md";

interface ResourceTreeNodeProps {
  node: ResourceTreeNodeType;
  level: number;
  expandedNodes: Set<string>;
  selectedResource: ResourceMenuItem | null;
  onToggleExpand: (nodeId: string) => void;
  onSelect: (resource: ResourceMenuItem) => void;
  onContextMenu: (e: React.MouseEvent, resource: ResourceMenuItem) => void;
}

export const ResourceTreeNode: React.FC<ResourceTreeNodeProps> = ({
  node,
  level,
  expandedNodes,
  selectedResource,
  onToggleExpand,
  onSelect,
  onContextMenu,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;

  const handleNodeClick = () => {
    // If there are child nodes, switch to the expanded state first
    if (hasChildren) {
      onToggleExpand(node.id);
    }
    // Then select the node
    onSelect(node);
  };

  return (
    <div>
      <div
        className="flex items-center gap-3 rounded-lg px-2 py-1 text-theme-sm font-medium cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        onClick={handleNodeClick}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        {/* Expand/Collapse icon + Hierarchical indentation */}
        <div className="flex-shrink-0 w-8">
          {level === 0 ? (
            // Root node: show expansion/Collapse icon
            hasChildren ? (
              <div className="p-1 flex items-center justify-center">
                <MdChevronRight
                  className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-90" : "rotate-0"}`}
                />
              </div>
            ) : (
              <div className="w-6" />
            )
          ) : (
            // Child nodes: fixed indentation
            <div className="w-9" />
          )}
        </div>

        {/* icon */}
        <div className={`flex-shrink-0 flex w-20 ${level === 0 ? "pl-6" : "pl-10"}`}>{resolveIcon(node.icon || "").icon}</div>

        {/* Resource name */}
        <div className="flex-shrink-0 w-80 min-w-0">
          <div className="p-2 font-medium text-gray-900 dark:text-white truncate">{node.name}</div>
        </div>

        {/* resource Key */}
        <div className="flex-shrink-0 w-80 min-w-0">
          <div className="p-2 text-sm text-gray-600 dark:text-gray-300 truncate">{node.key}</div>
        </div>

        {/* path */}
        <div className="flex-1 min-w-0">
          <div className="p-2 text-sm text-gray-500 dark:text-gray-400 truncate">{node.path}</div>
        </div>
      </div>

      {/* child node */}
      {hasChildren && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-1">
            {node.children.map((child) => (
              <ResourceTreeNode
                key={child.id}
                node={child}
                level={level + 1}
                expandedNodes={expandedNodes}
                selectedResource={selectedResource}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
