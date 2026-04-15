// Custom hooks for scalable data management
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, StoreName } from './database';

// Debounce hook for search inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Pagination hook
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function usePagination<T>(
  storeName: StoreName,
  options: {
    pageSize?: number;
    indexName?: string;
    direction?: IDBCursorDirection;
  } = {}
) {
  const { pageSize = 20, indexName, direction = 'prev' } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize,
    total: 0,
    hasMore: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await db.getPaginated<T>(storeName, {
        page,
        pageSize,
        indexName,
        direction
      });
      
      setData(result.data);
      setPagination(prev => ({
        ...prev,
        page,
        total: result.total,
        hasMore: result.hasMore
      }));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName, pageSize, indexName, direction]);

  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      fetchPage(pagination.page + 1);
    }
  }, [pagination.hasMore, pagination.page, fetchPage]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchPage(pagination.page - 1);
    }
  }, [pagination.page, fetchPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= Math.ceil(pagination.total / pageSize)) {
      fetchPage(page);
    }
  }, [pagination.total, pageSize, fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(pagination.page);
  }, [pagination.page, fetchPage]);

  useEffect(() => {
    fetchPage(1);
  }, []);

  return {
    data,
    pagination,
    isLoading,
    error,
    nextPage,
    prevPage,
    goToPage,
    refresh
  };
}

// Infinite scroll hook
export function useInfiniteScroll<T>(
  storeName: StoreName,
  options: {
    pageSize?: number;
    indexName?: string;
    direction?: IDBCursorDirection;
  } = {}
) {
  const { pageSize = 20, indexName, direction = 'prev' } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await db.getPaginated<T>(storeName, {
        page,
        pageSize,
        indexName,
        direction
      });
      
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [storeName, page, pageSize, indexName, direction, isLoading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Intersection observer for automatic loading
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [isLoading, hasMore, loadMore]);

  useEffect(() => {
    loadMore();
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    lastElementRef
  };
}

// Search hook with debouncing
export function useSearch<T>(
  storeName: StoreName,
  searchFields: (keyof T)[],
  debounceMs: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      
      try {
        const allData = await db.getAll<T>(storeName);
        const lowerQuery = debouncedQuery.toLowerCase();
        
        const filtered = allData.filter(item => 
          searchFields.some(field => {
            const value = item[field];
            if (typeof value === 'string') {
              return value.toLowerCase().includes(lowerQuery);
            }
            if (typeof value === 'number') {
              return value.toString().includes(lowerQuery);
            }
            return false;
          })
        );
        
        setResults(filtered);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery, storeName, searchFields]);

  return {
    query,
    setQuery,
    results,
    isSearching
  };
}

// Online status hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Sync status hook
export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  const checkPending = useCallback(async () => {
    try {
      const queue = await db.getSyncQueue();
      setPendingCount(queue.length);
    } catch (err) {
      console.error('Error checking sync queue:', err);
    }
  }, []);

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [checkPending]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    setIsSyncing,
    refresh: checkPending
  };
}

// Local storage with expiry
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  expiryMs?: number
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (expiryMs && parsed.expiry && Date.now() > parsed.expiry) {
          localStorage.removeItem(key);
          return initialValue;
        }
        return parsed.value ?? parsed;
      }
      return initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      const toStore = expiryMs
        ? { value: newValue, expiry: Date.now() + expiryMs }
        : newValue;
      localStorage.setItem(key, JSON.stringify(toStore));
      return newValue;
    });
  }, [key, expiryMs]);

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// Memoized selector for derived data
export function useSelector<T, R>(
  data: T,
  selector: (data: T) => R,
  deps: any[] = []
): R {
  return useMemo(() => selector(data), [data, ...deps]);
}
