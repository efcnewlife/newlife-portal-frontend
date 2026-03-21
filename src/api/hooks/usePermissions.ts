import { permissionService } from "@/api";
import type { PermissionListItem } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await permissionService.list();
      if (res.success) {
        setPermissions(res.data.items || []);
      } else {
        setError(res.message || "Load failed");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { permissions, isLoading, error, refresh };
};

export default usePermissions;
