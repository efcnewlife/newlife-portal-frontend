import type { ResourceMenuItem } from "@/types/resource";
import { AdminResourceType } from "@/api/services/resourceService";
import type { ResourceTreeNode } from "@/types/resource";
import React from "react";
import { useTranslation } from "react-i18next";
import { ResourceTreeNode as TreeNode } from "./ResourceTreeNode";

interface ResourceTreeViewProps {
  treeData: ResourceTreeNode[];
  selectedResource: ResourceMenuItem | null;
  onSelect: (resource: ResourceMenuItem) => void;
  onContextMenu: (e: React.MouseEvent, resource: ResourceMenuItem) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
}

export const ResourceTreeView: React.FC<ResourceTreeViewProps> = ({
  treeData,
  selectedResource,
  onSelect,
  onContextMenu,
  expandedNodes,
  onToggleExpand,
}) => {
  const { t } = useTranslation();

  const groupedData = React.useMemo(() => {
    const menuItems: ResourceTreeNode[] = [];
    const systemItems: ResourceTreeNode[] = [];

    treeData.forEach((node) => {
      if (node.type === AdminResourceType.GENERAL) {
        menuItems.push(node);
      } else if (node.type === AdminResourceType.SYSTEM) {
        systemItems.push(node);
      }
    });
    return { menuItems, systemItems };
  }, [treeData]);

  const tableHeader = (
    <div className="flex items-center gap-3 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-600 dark:text-gray-400">
      <div className="flex-shrink-0 w-8 p-2"></div>
      <div className="flex-shrink-0 w-20 text-center p-2">{t("system:resource.tree.columnIcon")}</div>
      <div className="flex-shrink-0 w-80 p-2">{t("system:resource.tree.columnName")}</div>
      <div className="flex-shrink-0 w-80 p-2">{t("system:resource.tree.columnKey")}</div>
      <div className="flex-1 p-2">{t("system:resource.tree.columnPath")}</div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800">
      {treeData.length === 0 ? (
        <div className="p-8 text-center text-gray-500">{t("system:resource.tree.empty")}</div>
      ) : (
        <div className="p-4 space-y-6">
          {groupedData.menuItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                {t("system:resource.tree.sectionMenuLabel")}
              </h4>
              {tableHeader}
              <div className="space-y-1">
                {groupedData.menuItems.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
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

          {groupedData.systemItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">
                {t("system:resource.tree.sectionSystemLabel")}
              </h4>
              {tableHeader}
              <div className="space-y-1">
                {groupedData.systemItems.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
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
      )}
    </div>
  );
};
