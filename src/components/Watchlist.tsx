import { useState } from 'react';
import { Plus, X, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useWatchlist } from '../hooks/useLocalStorage';
import { useAppContext } from '../context/AppContext';
import { WATCHLIST_STOCKS } from '../services/tickerSearchService';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { SIMULATED_PRICES } from '../services/marketDataService';

export function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { dispatch } = useAppContext();
  const [newTicker, setNewTicker] = useState('');

  const handleAdd = () => {
    const t = newTicker.toUpperCase().trim();
    if (t && /^[A-Z]{1,5}$/.test(t)) {
      addToWatchlist(t);
      setNewTicker('');
    }
  };

  const handleAnalyze = (ticker: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'search' });
    window.dispatchEvent(new CustomEvent('vsp:search', { detail: { ticker } }));
  };

  const displayList = watchlist.length > 0 ? watchlist : WATCHLIST_STOCKS.slice(0, 15);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
            Watchlist
          </h2>
          <p className="text-slate-400 text-sm">
            {watchlist.length} saved · Click any stock to analyze
          </p>
        </div>
      </div>

      {/* Add ticker */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add ticker (e.g. AAPL)"
          maxLength={5}
          className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-cyan-700/30 hover:bg-cyan-700/50 text-cyan-400 border border-cyan-700/40 rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Watchlist grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayList.map((ticker) => {
          const sim = SIMULATED_PRICES[ticker];
          const price = sim?.price ?? 100;
          const change = sim?.change ?? 0;
          const changePercent = price > 0 ? (change / (price - change)) * 100 : 0;
          const isUp = changePercent >= 0;

          return (
            <div
              key={ticker}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3 hover:border-cyan-800/40 transition-all group cursor-pointer"
              onClick={() => handleAnalyze(ticker)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">{ticker}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-white text-sm">{formatCurrency(price)}</span>
                  <span className={`text-xs flex items-center gap-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(changePercent)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAnalyze(ticker);
                  }}
                  className="px-2.5 py-1 bg-cyan-700/20 hover:bg-cyan-700/40 text-cyan-400 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-all"
                >
                  Analyze
                </button>
                {watchlist.includes(ticker) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(ticker);
                    }}
                    className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
