import { IS_DEV } from "@/config/env";
import { DEMO_NAV } from "@/const/demo";
import { AdminResourceType } from "@/const/resource";
import { useMemo } from "react";
import type { ResourceMenuItem } from "../types/resource-admin";
import { useMenuData } from "../context/MenuContext";
import { resolveIcon } from "../utils/icon-resolver";

export interface NavigationItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
  order?: number;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export function useNavigationItems(): {
  mainNavItems: NavigationItem[];
  systemNavItems: NavigationItem[];
  isLoading: boolean;
  error: string | null;
} {
  const { menus, isLoading, error } = useMenuData();

  const { mainNavItems, systemNavItems } = useMemo(() => {
    const main: NavigationItem[] = [];
    const system: NavigationItem[] = [];

    if (!menus) {
      return { mainNavItems: main, systemNavItems: system };
    }

    // Establish a tree structure of parent-child relationship
    const buildHierarchy = (items: ResourceMenuItem[]): NavigationItem[] => {
      // Create mappings for all projects (including path and no path of)
      const itemMap = new Map<string, NavigationItem>();
      const itemDataMap = new Map<string, ResourceMenuItem>(); // Save original data to get parent information
      const rootItems: NavigationItem[] = [];
      const childrenMap = new Map<string, NavigationItem[]>();

      // Step 1: Work on all projects (including those with path and no path of)
      items.forEach((it) => {
        // Save original data
        itemDataMap.set(it.id, it);

        // create NavigationItem（whether there is path）
        const item: NavigationItem = {
          name: it.name,
          icon: resolveIcon(it.icon || "").icon,
          order: it.sequence ? Math.floor(it.sequence) : 999,
        };

        // if there is path，set up path
        if (it.path) {
          item.path = it.path;
        }

        itemMap.set(it.id, item);

        // If there is a parent project, add it children mapping
        if (it.pid) {
          if (!childrenMap.has(it.pid)) {
            childrenMap.set(it.pid, []);
          }
          // There will only be path items added to children（Because there is only path items can be clicked)
          if (it.path) {
            childrenMap.get(it.pid)!.push(item);
          }
          // have pid items are not added to rootItems（even if not path，Because they are children, not root items)
        } else {
          // There is no parent project, it is the root project (regardless of whether there is path）
          rootItems.push(item);
        }
      });

      // Step 2: Identify the missing parent and extract it from the child's parent Field creates virtual parent
      childrenMap.forEach((children, parentId) => {
        if (!itemMap.has(parentId)) {
          // Try to get the parent information from the child's raw data
          // Find all child data belonging to this parent
          const childDataList = Array.from(itemDataMap.values()).filter((it) => it.pid === parentId);

          // from the first one there parent Information's children get parent data
          // Prioritize search parent.id match parentId , if not then use any parent children of
          const childWithParent = childDataList.find((it) => it.parent?.id === parentId) || childDataList.find((it) => it.parent);
          const parentData = childWithParent?.parent;

          if (parentData) {
            // from child parent Field creation parent
            // try to start from items Find if there is complete data for the parent (maybe not path）
            const parentItemData = items.find((it) => it.id === parentId);

            const virtualParent: NavigationItem = {
              name: parentData.name,
              icon: resolveIcon(parentData.icon || parentItemData?.icon || "").icon,
              // The parent may not have path，So don't set path（This way it can only be used as a group)
              order: parentItemData?.sequence ? Math.floor(parentItemData.sequence) : 999,
            };

            itemMap.set(parentId, virtualParent);
            rootItems.push(virtualParent);
          } else {
            // if not parent information, check items Is there parent data in (maybe not path）
            const parentItemData = items.find((it) => it.id === parentId);

            if (parentItemData) {
              // if items There is parent data in (even if there is not path），use it
              const parentFromItems: NavigationItem = {
                name: parentItemData.name,
                icon: resolveIcon(parentItemData.icon || "").icon,
                order: parentItemData.sequence ? Math.floor(parentItemData.sequence) : 999,
                // No path It doesn't matter, use it as a group
              };

              itemMap.set(parentId, parentFromItems);
              rootItems.push(parentFromItems);
            } else {
              // If there is no parent information at all, create a placeholder
              const firstChildOrder = children[0]?.order || 999;

              // Create a placeholder parent
              const placeholderParent: NavigationItem = {
                name: `Group ${parentId.substring(0, 8)}`, // Temporary name, should be obtained from the backend
                icon: resolveIcon("MdFolder").icon,
                order: firstChildOrder,
              };

              itemMap.set(parentId, placeholderParent);
              rootItems.push(placeholderParent);
            }
          }
        }
      });

      // Step 3: Establish sub-project relationships
      childrenMap.forEach((children, parentId) => {
        const parent = itemMap.get(parentId);
        if (parent) {
          parent.subItems = children
            .map((child) => ({
              name: child.name,
              path: child.path!,
              icon: child.icon,
            }))
            .sort((a, b) => {
              const aItem = Array.from(itemMap.values()).find((item) => item.path === a.path);
              const bItem = Array.from(itemMap.values()).find((item) => item.path === b.path);
              return (aItem?.order || 999) - (bItem?.order || 999);
            });
        }
      });

      // Sort root item
      const sortedRootItems = rootItems.sort((a, b) => (a.order || 999) - (b.order || 999));
      return sortedRootItems;
    };

    // Handle system and general projects separately
    const systemItems = menus.filter((it) => it.type === AdminResourceType.SYSTEM);
    const generalItems = menus.filter((it) => it.type === AdminResourceType.GENERAL);

    const systemHierarchy = buildHierarchy(systemItems);
    const generalHierarchy = buildHierarchy(generalItems);

    system.push(...systemHierarchy);
    main.push(...generalHierarchy);

    // Join in development environment Demo option to main menu
    if (IS_DEV && DEMO_NAV.length > 0) {
      // will all Demo Parent the navigation package (put it in System block)
      const parentOrder = Math.min(...DEMO_NAV.map((n) => n.order ?? 999));
      system.push({
        name: "Demo",
        icon: resolveIcon("MdScience").icon,
        order: parentOrder,
        subItems: DEMO_NAV.map((n) => ({ name: n.name, path: n.path, icon: resolveIcon(n.icon).icon })),
      });
    }

    return { mainNavItems: main, systemNavItems: system };
  }, [menus]);

  return { mainNavItems, systemNavItems, isLoading, error };
}
