import { TrendingUp, TrendingDown, Star, ExternalLink, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useWatchlist } from '../hooks/useLocalStorage';
import { LoadingSpinner } from './LoadingSpinner';
import { LiveBadge } from './LiveBadge';
import { formatCurrency, formatPercent, formatVolume, formatTime } from '../utils/formatters';

export function StockOverview() {
  const { state } = useAppContext();
  const { stock, chain } = { stock: state.currentStock, chain: state.optionsChain };
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  if (state.stockLoading) {
    return (
      <div className="flex items-center justify-center h-32 bg-slate-900/50 rounded-xl border border-slate-800">
        <LoadingSpinner size="md" text="Fetching market data..." />
      </div>
    );
  }

  if (!stock) return null;

  const isUp = stock.changePercent >= 0;
  const inWatchlist = isInWatchlist(stock.ticker);
  const rangePercent = stock.week52High > stock.week52Low
    ? ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
    : 50;

  const rbLink = `https://robinhood.com/stocks/${stock.ticker}`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">{stock.ticker}</h2>
            <LiveBadge isLive />
            {stock.isSimulated && (
              <span className="text-xs bg-yellow-800/40 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-700/30">
                Simulated
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{formatCurrency(stock.price)}</p>
          <p className={`flex items-center gap-1 justify-end font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Bid" value={formatCurrency(stock.bidPrice)} />
        <StatBox label="Ask" value={formatCurrency(stock.askPrice)} />
        <StatBox label="Volume" value={formatVolume(stock.volume)} />
        {chain && (
          <>
            <StatBox
              label="IV Rank"
              value={`${chain.ivRank}%`}
              highlight={chain.ivRank > 70 ? 'orange' : chain.ivRank > 40 ? 'yellow' : 'green'}
            />
          </>
        )}
      </div>

      {/* Expected move */}
      {chain && (
        <div className="bg-cyan-950/40 border border-cyan-800/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-cyan-400 font-semibold">Expected Move</span>
            <span className="text-slate-400 text-xs">(ATM Straddle)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-slate-400 text-xs">Down Target</p>
              <p className="text-red-400 font-bold text-lg">
                {formatCurrency(stock.price - chain.expectedMove)}
              </p>
              <p className="text-red-400/70 text-xs">-{chain.expectedMovePercent.toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-cyan-400">
                ±{chain.expectedMovePercent.toFixed(1)}%
              </p>
              <p className="text-slate-500 text-xs">±{formatCurrency(chain.expectedMove)}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-xs">Up Target</p>
              <p className="text-green-400 font-bold text-lg">
                {formatCurrency(stock.price + chain.expectedMove)}
              </p>
              <p className="text-green-400/70 text-xs">+{chain.expectedMovePercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* 52-week range */}
      <div>
        <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
          <span>52-Week Range</span>
          <span>{formatCurrency(stock.week52Low)} — {formatCurrency(stock.week52High)}</span>
        </div>
        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-yellow-500 to-green-500"
            style={{ width: '100%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-slate-900 shadow-lg"
            style={{ left: `calc(${rangePercent}% - 6px)` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => inWatchlist ? removeFromWatchlist(stock.ticker) : addToWatchlist(stock.ticker)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
            inWatchlist
              ? 'bg-yellow-800/30 text-yellow-400 border border-yellow-700/40'
              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
          }`}
        >
          <Star className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
          {inWatchlist ? 'Watchlisted' : 'Add to Watchlist'}
        </button>
        <a
          href={rbLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800/40 rounded-lg text-sm transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Open on Robinhood
        </a>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          {formatTime(stock.lastUpdated)}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'green' | 'yellow' | 'orange';
}) {
  const colors = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    orange: 'text-orange-400',
  };

  return (
    <div className="bg-slate-800/60 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`font-semibold ${highlight ? colors[highlight] : 'text-white'}`}>{value}</p>
    </div>
  );
}
