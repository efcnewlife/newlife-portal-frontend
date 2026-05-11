import i18n from "@/i18n";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { resourceService } from "../api/services/resourceService";
import type { ResourceMenuItem } from "../types/resource-admin";
import { useAuth } from "./AuthContext";

interface MenuContextType {
  menus: ResourceMenuItem[] | null;
  isLoading: boolean;
  error: string | null;
  refreshMenus: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export function MenuProvider({ children }: MenuProviderProps) {
  const [menus, setMenus] = useState<ResourceMenuItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Initialize as true
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const loadMenus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Do not call API when not authenticated
      if (!isAuthenticated) {
        setMenus(null);
        return;
      }

      const res = await resourceService.getAdminMenus();

      if (res.success && res.data?.items) {
        setMenus(res.data.items);
      } else {
        setMenus([]);
        setError(res.message || "Failed to load menus");
      }
    } catch (e: unknown) {
      setMenus([]);
      setError(e instanceof Error ? e.message : "Failed to load menus");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshMenus = async () => {
    await loadMenus();
  };

  // Load or clear menus based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      loadMenus();
    } else {
      // Clear menus in unauthenticated state
      setMenus(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isAuthenticated, loadMenus]);

  // Refetch menus when UI language changes (backend may localize names via Accept-Language)
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }
    const on_language_changed = () => {
      void loadMenus();
    };
    i18n.on("languageChanged", on_language_changed);
    return () => {
      i18n.off("languageChanged", on_language_changed);
    };
  }, [isAuthenticated, loadMenus]);

  const value: MenuContextType = {
    menus,
    isLoading,
    error,
    refreshMenus,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
export function useMenuData(): MenuContextType {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenuData must be used within a MenuProvider");
  }
  return context;
}
