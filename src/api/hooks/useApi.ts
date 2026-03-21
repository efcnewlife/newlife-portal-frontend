// Generic API hook
import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, ApiResponse, LoadingState } from "@/types/api";

// Hook configuration options
interface UseApiOptions<T> {
  // Execute automatically
  autoExecute?: boolean;
  // Dependencies that trigger re-execution when changed
  dependencies?: any[];
  // Cache duration (ms)
  cacheTime?: number;
  // Enable cache
  enableCache?: boolean;
  // Error handler
  onError?: (error: ApiError) => void;
  // Success handler
  onSuccess?: (data: T) => void;
  // Transform response data
  transform?: (data: any) => T;
}

// Cache item type
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache storage
const cache = new Map<string, CacheItem<any>>();

// Clean up expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now - item.timestamp > item.ttl) {
      cache.delete(key);
    }
  }
};

// Periodically clean cache
setInterval(cleanupCache, 60000); // Clean once per minute

// Generic API hook
export function useApi<T = any>(apiCall: (...args: any[]) => Promise<ApiResponse<T>>, options: UseApiOptions<T> = {}) {
  const {
    autoExecute = false,
    dependencies = [],
    cacheTime = 5 * 60 * 1000, // 5 minutes
    enableCache = false,
    onError,
    onSuccess,
    transform,
  } = options;

  // State management
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
  });
  const [data, setData] = useState<T | null>(null);

  // Cache key
  const cacheKey = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiCallRef = useRef(apiCall);

  // Update apiCall reference
  apiCallRef.current = apiCall;

  // Generate cache key
  const generateCacheKey = useCallback((...args: any[]) => {
    const argsString = JSON.stringify(args);
    return `api_call_${argsString}`;
  }, []);

  // Execute API call
  const execute = useCallback(
    async (...args: any[]) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create a new AbortController
      abortControllerRef.current = new AbortController();

      // Generate cache key
      cacheKey.current = generateCacheKey(...args);

      // Check cache
      if (enableCache && cache.has(cacheKey.current)) {
        const cachedItem = cache.get(cacheKey.current)!;
        if (Date.now() - cachedItem.timestamp < cachedItem.ttl) {
          setData(cachedItem.data);
          setState({ isLoading: false, error: null });
          onSuccess?.(cachedItem.data);
          return cachedItem.data;
        }
      }

      setState({ isLoading: true, error: null });

      try {
        const response = await apiCallRef.current(...args);

        // Check whether request was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        let resultData = response.data;

        // Apply data transform
        if (transform) {
          resultData = transform(resultData);
        }

        setData(resultData);
        setState({ isLoading: false, error: null });

        // Save to cache
        if (enableCache) {
          cache.set(cacheKey.current, {
            data: resultData,
            timestamp: Date.now(),
            ttl: cacheTime,
          });
        }

        onSuccess?.(resultData);
        return resultData;
      } catch (error) {
        // Check whether request was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const apiError = error as ApiError;
        setState({ isLoading: false, error: apiError });
        onError?.(apiError);
        throw apiError;
      }
    },
    [enableCache, cacheTime, onError, onSuccess, transform, generateCacheKey]
  );

  // Re-execute
  const refetch = useCallback(
    async (...args: any[]) => {
      // Clear cache
      if (enableCache && cacheKey.current) {
        cache.delete(cacheKey.current);
      }
      return execute(...args);
    },
    [execute, enableCache]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    if (cacheKey.current) {
      cache.delete(cacheKey.current);
    }
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    cache.clear();
  }, []);

  // Auto execute
  useEffect(() => {
    if (autoExecute) {
      execute();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [autoExecute, ...dependencies]);

  return {
    data,
    isLoading: state.isLoading,
    error: state.error,
    execute,
    refetch,
    clearCache,
    clearAllCache,
  };
}
