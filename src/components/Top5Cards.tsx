import { RefreshCw, Flame, TrendingUp, TrendingDown } from 'lucide-react';
import { Top5Stock } from '../types/stock';
import { useTop5Scanner } from '../hooks/useTop5Scanner';
import { useAppContext } from '../context/AppContext';
import { LoadingSpinner } from './LoadingSpinner';
import { LiveBadge } from './LiveBadge';
import { formatCurrency, formatPercent, formatCountdown, formatTime } from '../utils/formatters';

export function Top5Cards() {
  const { state, dispatch } = useAppContext();
  const { top5, loading, lastUpdated, countdown, refresh } = useTop5Scanner(
    state.settings.autoRefresh
  );

  const handleAnalyze = async (ticker: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'search' });
    dispatch({ type: 'SET_SEARCH_QUERY', payload: ticker });
    // Trigger search via custom event
    window.dispatchEvent(new CustomEvent('vsp:search', { detail: { ticker } }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Top 5 Opportunities
          </h2>
          <LiveBadge isLive={!loading} text={loading ? 'SCANNING' : 'LIVE'} />
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {formatTime(lastUpdated)} · Next: {formatCountdown(countdown)}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <div className="flex items-center gap-2 text-sm">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={state.settings.autoRefresh}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_SETTINGS',
                payload: { autoRefresh: e.target.checked },
              })
            }
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-700 peer-checked:bg-cyan-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
        </label>
        <span className="text-slate-400">Auto-refresh every 5 min</span>
      </div>

      {/* Cards grid */}
      {loading && top5.length === 0 ? (
        <div className="flex items-center justify-center h-48 bg-slate-900/50 rounded-xl border border-slate-800">
          <LoadingSpinner size="lg" text="Scanning 40+ stocks for highest volatility..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {top5.map((stock) => (
            <Top5Card key={stock.ticker} stock={stock} onAnalyze={handleAnalyze} />
          ))}
        </div>
      )}

      {top5.length > 0 && (
        <p className="text-xs text-slate-600 text-center">
          * Expected move calculated from ATM straddle price · Options data is simulated
        </p>
      )}
    </div>
  );
}

function Top5Card({
  stock,
  onAnalyze,
}: {
  stock: Top5Stock;
  onAnalyze: (ticker: string) => void;
}) {
  const isUp = stock.changePercent >= 0;

  return (
    <div
      className={`relative bg-slate-900/80 border rounded-xl p-4 flex flex-col gap-3 hover:border-cyan-800/60 transition-all group cursor-pointer ${
        stock.isHot
          ? 'border-orange-700/60 shadow-orange-900/20 shadow-lg'
          : 'border-slate-800'
      }`}
      onClick={() => onAnalyze(stock.ticker)}
    >
      {/* HOT badge */}
      {stock.isHot && (
        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Flame className="w-3 h-3" />
          HOT
        </div>
      )}

      {/* Ticker + price */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-lg">{stock.ticker}</span>
            {stock.isBestCall && (
              <span className="bg-green-500/20 text-green-400 text-xs px-1.5 py-0.5 rounded font-bold">
                CALL↑
              </span>
            )}
            {stock.isBestPut && (
              <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded font-bold">
                PUT↓
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs truncate max-w-[120px]">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{formatCurrency(stock.price)}</p>
          <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(stock.changePercent)}
          </p>
        </div>
      </div>

      {/* Expected move highlight */}
      <div className="bg-cyan-500/10 border border-cyan-800/40 rounded-lg p-2 text-center">
        <p className="text-xs text-cyan-500 mb-0.5">Expected Move</p>
        <p className="text-2xl font-bold text-cyan-400">
          ±{stock.expectedMovePercent.toFixed(1)}%
        </p>
      </div>

      {/* Call / Put premiums */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2 text-center">
          <p className="text-xs text-green-500">Call ATM</p>
          <p className="text-green-400 font-semibold">{formatCurrency(stock.callPremium)}</p>
        </div>
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-2 text-center">
          <p className="text-xs text-red-400">Put ATM</p>
          <p className="text-red-400 font-semibold">{formatCurrency(stock.putPremium)}</p>
        </div>
      </div>

      {/* IV Rank */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">IV Rank</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                stock.ivRank > 70 ? 'bg-orange-500' : stock.ivRank > 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${stock.ivRank}%` }}
            />
          </div>
          <span className={`text-xs font-bold ${
            stock.ivRank > 70 ? 'text-orange-400' : stock.ivRank > 40 ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {stock.ivRank}
          </span>
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={(e) => { e.stopPropagation(); onAnalyze(stock.ticker); }}
        className="w-full py-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 hover:text-cyan-300 rounded-lg text-sm font-semibold transition-all border border-cyan-700/30 group-hover:border-cyan-600/60"
      >
        Analyze →
      </button>
    </div>
  );
}
