import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // ignore write errors
    }
  };

  return [storedValue, setValue] as const;
}

export function useRecentSearches() {
  const [searches, setSearches] = useLocalStorage<string[]>('vsp_recent_searches', []);

  const addSearch = (ticker: string) => {
    setSearches((prev) => {
      const filtered = prev.filter((t) => t !== ticker.toUpperCase());
      return [ticker.toUpperCase(), ...filtered].slice(0, 10);
    });
  };

  const removeSearch = (ticker: string) => {
    setSearches((prev) => prev.filter((t) => t !== ticker));
  };

  const clearSearches = () => setSearches([]);

  return { searches, addSearch, removeSearch, clearSearches };
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useLocalStorage<string[]>('vsp_watchlist', []);

  const addToWatchlist = (ticker: string) => {
    setWatchlist((prev) => {
      if (prev.includes(ticker.toUpperCase())) return prev;
      return [...prev, ticker.toUpperCase()];
    });
  };

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist((prev) => prev.filter((t) => t !== ticker.toUpperCase()));
  };

  const isInWatchlist = (ticker: string) => watchlist.includes(ticker.toUpperCase());

  return { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
