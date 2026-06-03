import { SignalResult } from '../types/common';
import { formatCurrency, formatTime } from '../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  signal: SignalResult;
  compact?: boolean;
}

export function SignalCard({ signal, compact = false }: Props) {
  const isCall = signal.signal === 'CALL';
  const isPut = signal.signal === 'PUT';
  const isHold = signal.signal === 'HOLD';

  const borderClass = isCall
    ? 'border-green-800/40'
    : isPut
    ? 'border-red-800/40'
    : 'border-yellow-800/40';
  const bgClass = isCall
    ? 'bg-green-900/15'
    : isPut
    ? 'bg-red-900/15'
    : 'bg-yellow-900/15';

  const confidenceColor =
    signal.confidence >= 80
      ? 'text-green-400'
      : signal.confidence >= 60
      ? 'text-yellow-400'
      : 'text-orange-400';

  return (
    <div className={`border rounded-xl overflow-hidden ${borderClass}`}>
      {/* Signal header */}
      <div className={`p-4 ${bgClass}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isCall && <TrendingUp className={`w-6 h-6 text-green-400`} />}
            {isPut && <TrendingDown className={`w-6 h-6 text-red-400`} />}
            {isHold && <Minus className={`w-6 h-6 text-yellow-400`} />}
            <span
              className={`text-2xl font-black ${
                isCall ? 'text-green-400' : isPut ? 'text-red-400' : 'text-yellow-400'
              }`}
            >
              {signal.signal}
            </span>
            {signal.ticker && (
              <span className="text-white font-bold text-lg">{signal.ticker}</span>
            )}
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${confidenceColor}`}>{signal.confidence}%</p>
            <p className="text-xs text-slate-500">confidence</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              signal.confidence >= 80
                ? 'bg-green-500'
                : signal.confidence >= 60
                ? 'bg-yellow-500'
                : 'bg-orange-500'
            }`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3 bg-slate-900/80">
        {/* Patterns detected */}
        {signal.patterns && signal.patterns.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Patterns Detected</p>
            <div className="flex flex-wrap gap-1.5">
              {signal.patterns.map((p) => (
                <span
                  key={p}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    isCall
                      ? 'bg-green-900/30 text-green-400 border border-green-800/30'
                      : isPut
                      ? 'bg-red-900/30 text-red-400 border border-red-800/30'
                      : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/30'
                  }`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Indicators */}
        {signal.indicators && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Indicators</p>
            <p className="text-slate-300 text-sm">{signal.indicators}</p>
          </div>
        )}

        {/* Trend */}
        {signal.trend && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Trend:</span>
            <span
              className={`text-sm font-medium capitalize ${
                signal.trend === 'uptrend'
                  ? 'text-green-400'
                  : signal.trend === 'downtrend'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}
            >
              {signal.trend === 'uptrend' ? '↑' : signal.trend === 'downtrend' ? '↓' : '→'}{' '}
              {signal.trend}
            </span>
          </div>
        )}

        {/* Entry / SL / TP */}
        {!compact && (signal.entry || signal.stopLoss || signal.takeProfit) && (
          <div className="grid grid-cols-3 gap-2">
            {signal.entry && (
              <div className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                <p className="text-xs text-slate-500 mb-0.5">Entry</p>
                <p className="text-white font-semibold text-sm">
                  {formatCurrency(signal.entry)}
                </p>
              </div>
            )}
            {signal.stopLoss && (
              <div className="bg-red-900/15 border border-red-800/20 rounded-lg p-2.5 text-center">
                <p className="text-xs text-red-500 mb-0.5">Stop Loss</p>
                <p className="text-red-400 font-semibold text-sm">
                  {formatCurrency(signal.stopLoss)}
                </p>
              </div>
            )}
            {signal.takeProfit && (
              <div className="bg-green-900/15 border border-green-800/20 rounded-lg p-2.5 text-center">
                <p className="text-xs text-green-500 mb-0.5">Take Profit</p>
                <p className="text-green-400 font-semibold text-sm">
                  {formatCurrency(signal.takeProfit)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Risk/Reward */}
        {signal.riskReward && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Risk:Reward</span>
            <span className="text-white font-semibold text-sm">{signal.riskReward}</span>
          </div>
        )}

        {/* Reasoning */}
        {signal.reasoning && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Reasoning</p>
            <p className="text-slate-300 text-sm leading-relaxed">{signal.reasoning}</p>
          </div>
        )}

        {/* Support / Resistance */}
        {!compact && (signal.supportLevel || signal.resistanceLevel) && (
          <div className="flex items-center gap-3">
            {signal.supportLevel && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-slate-400">
                  Support: <span className="text-green-400">{formatCurrency(signal.supportLevel)}</span>
                </span>
              </div>
            )}
            {signal.resistanceLevel && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">
                  Resistance: <span className="text-red-400">{formatCurrency(signal.resistanceLevel)}</span>
                </span>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-600">{formatTime(signal.timestamp)}</p>
      </div>
    </div>
  );
}
