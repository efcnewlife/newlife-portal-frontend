import { localeService, type LocaleItem } from "@/api/services/localeService";
import { get_default_locale_id } from "@/utils/localeResolve";
import { sortActiveLocales } from "@/utils/translationForm";
import { useCallback, useEffect, useState } from "react";

export interface UseActiveLocalesResult {
  locales: LocaleItem[];
  defaultLocaleId: string | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => Promise<void>;
}

export const useActiveLocales = (): UseActiveLocalesResult => {
  const [locales, setLocales] = useState<LocaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await localeService.list();
      if (!response.success || !response.data?.items?.length) {
        setLocales([]);
        setError("translation.loadLocalesFailed");
        return;
      }
      const active_locales = sortActiveLocales(response.data.items);
      setLocales(active_locales);
      if (active_locales.length === 0) {
        setError("translation.loadLocalesFailed");
      }
    } catch {
      setLocales([]);
      setError("translation.loadLocalesFailed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const default_locale_id = get_default_locale_id(locales);

  return {
    locales,
    defaultLocaleId: default_locale_id,
    loading,
    error,
    reload,
  };
};
