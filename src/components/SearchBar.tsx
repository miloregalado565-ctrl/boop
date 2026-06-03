import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchStockData } from '../services/marketDataService';
import { fetchOptionsChain } from '../services/optionsService';
import { searchTickers, TickerSuggestion } from '../services/tickerSearchService';
import { useRecentSearches } from '../hooks/useLocalStorage';
import { LoadingSpinner } from './LoadingSpinner';

export function SearchBar() {
  const { state, dispatch } = useAppContext();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TickerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { searches, addSearch } = useRecentSearches();

  const doSearch = useCallback(
    async (ticker: string) => {
      if (!ticker.trim()) return;
      const upper = ticker.toUpperCase().trim();
      setQuery(upper);
      setShowSuggestions(false);

      dispatch({ type: 'SET_STOCK_LOADING', payload: true });
      dispatch({ type: 'SET_STOCK_ERROR', payload: null });
      dispatch({ type: 'CLEAR_STOCK' });

      try {
        const stock = await fetchStockData(upper);
        dispatch({ type: 'SET_STOCK_DATA', payload: stock });
        addSearch(upper);

        const chain = await fetchOptionsChain(upper, stock.price);
        dispatch({ type: 'SET_OPTIONS_CHAIN', payload: chain });
        dispatch({ type: 'SET_EXPIRATION', payload: chain.selectedExpiration });
      } catch (err) {
        dispatch({
          type: 'SET_STOCK_ERROR',
          payload: err instanceof Error ? err.message : `Could not fetch data for ${upper}`,
        });
      } finally {
        dispatch({ type: 'SET_STOCK_LOADING', payload: false });
      }
    },
    [dispatch, addSearch]
  );

  // Listen for programmatic search events from Top5Cards
  useEffect(() => {
    const handler = (e: Event) => {
      const ticker = (e as CustomEvent<{ ticker: string }>).detail?.ticker;
      if (ticker) doSearch(ticker);
    };
    window.addEventListener('vsp:search', handler);
    return () => window.removeEventListener('vsp:search', handler);
  }, [doSearch]);

  useEffect(() => {
    const results = searchTickers(query);
    setSuggestions(results);
    setShowSuggestions(query.length > 0 && results.length > 0);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) doSearch(query);
  };

  const handleSuggestionClick = (ticker: string) => {
    setQuery(ticker);
    doSearch(ticker);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            onFocus={() => query && setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search any ticker — AAPL, TSLA, SPY, COIN..."
            className="w-full pl-12 pr-32 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600/50 text-lg transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-28 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={state.stockLoading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-all text-sm"
          >
            {state.stockLoading ? <LoadingSpinner size="sm" /> : 'Analyze'}
          </button>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden z-50 shadow-xl">
            {suggestions.map((s) => (
              <button
                key={s.ticker}
                onMouseDown={() => handleSuggestionClick(s.ticker)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
              >
                <span className="font-bold text-white w-16">{s.ticker}</span>
                <span className="text-slate-400 text-sm">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent searches */}
      {searches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Recent:</span>
          {searches.map((ticker) => (
            <button
              key={ticker}
              onClick={() => doSearch(ticker)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            >
              {ticker}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {state.stockError && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-800/40 rounded-xl">
          <span className="text-red-400 text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-red-400/80 text-sm">{state.stockError}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_STOCK_ERROR', payload: null })}
            className="ml-auto text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
