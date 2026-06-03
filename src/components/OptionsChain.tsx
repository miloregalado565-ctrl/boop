import { useState } from 'react';
import { Option, ExpirationFilter } from '../types/options';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, formatDate, daysUntil } from '../utils/formatters';

export function OptionsChain() {
  const { state, dispatch } = useAppContext();
  const { optionsChain: chain, selectedOption, selectedOptionType } = state;
  const [expirationFilter, setExpirationFilter] = useState<ExpirationFilter>('weekly');
  const [showType, setShowType] = useState<'call' | 'put'>('call');

  if (!chain) return null;

  const filteredExpirations = chain.expirationDates.filter((d) => {
    const days = daysUntil(d);
    if (expirationFilter === 'weekly') return days <= 14;
    if (expirationFilter === 'monthly') return days <= 45 && days > 14;
    return true;
  });

  const selectedExp = state.selectedExpiration || chain.selectedExpiration;
  const options = showType === 'call' ? chain.calls : chain.puts;

  const handleSelectOption = (opt: Option) => {
    dispatch({
      type: 'SELECT_OPTION',
      payload: { option: opt, optionType: showType },
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="font-bold text-white">Options Chain</h3>
        {chain.isSimulated && (
          <span className="text-xs bg-yellow-800/30 text-yellow-400 px-2 py-0.5 rounded-full">
            Simulated Data
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-3 border-b border-slate-800/60">
        {/* Call/Put toggle */}
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
          <button
            onClick={() => setShowType('call')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              showType === 'call'
                ? 'bg-green-600/30 text-green-400 border border-green-700/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📈 Calls
          </button>
          <button
            onClick={() => setShowType('put')}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
              showType === 'put'
                ? 'bg-red-600/30 text-red-400 border border-red-700/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📉 Puts
          </button>
        </div>

        {/* Expiration filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Expiry:</span>
          {(['weekly', 'monthly', 'all'] as ExpirationFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setExpirationFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                expirationFilter === f
                  ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-700/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Expiration selector */}
        <div className="flex gap-1.5 flex-wrap">
          {filteredExpirations.slice(0, 6).map((d) => (
            <button
              key={d}
              onClick={() => dispatch({ type: 'SET_EXPIRATION', payload: d })}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                selectedExp === d
                  ? 'bg-cyan-700/40 text-cyan-400 border border-cyan-600/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {formatDate(d)}
              <span className="ml-1 text-slate-500">({daysUntil(d)}d)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/40">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Strike</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Bid</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Ask</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Mid</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">Delta</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">IV</th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-500">OI</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => {
              const isSelected =
                selectedOption?.strikePrice === opt.strikePrice &&
                selectedOption?.expirationDate === opt.expirationDate &&
                selectedOptionType === showType;

              return (
                <tr
                  key={`${opt.strikePrice}-${opt.expirationDate}`}
                  className={`border-b border-slate-800/40 cursor-pointer transition-colors ${
                    opt.isATM ? 'bg-cyan-900/10' : ''
                  } ${
                    isSelected
                      ? 'bg-cyan-800/20 border-l-2 border-l-cyan-500'
                      : 'hover:bg-slate-800/30'
                  }`}
                  onClick={() => handleSelectOption(opt)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${
                        showType === 'call'
                          ? opt.isATM ? 'text-cyan-400' : opt.delta > 0.5 ? 'text-green-400' : 'text-white'
                          : opt.isATM ? 'text-cyan-400' : opt.delta < -0.5 ? 'text-red-400' : 'text-white'
                      }`}>
                        ${opt.strikePrice.toFixed(2)}
                      </span>
                      {opt.isATM && (
                        <span className="text-xs bg-cyan-900/50 text-cyan-400 px-1 rounded">ATM</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-400">{formatCurrency(opt.bidPrice)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">{formatCurrency(opt.askPrice)}</td>
                  <td className={`px-3 py-2.5 text-right font-medium ${showType === 'call' ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(opt.midPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-300">
                    {opt.delta.toFixed(2)}
                  </td>
                  <td className={`px-3 py-2.5 text-right ${
                    opt.impliedVolatility > 1 ? 'text-orange-400' : opt.impliedVolatility > 0.5 ? 'text-yellow-400' : 'text-slate-300'
                  }`}>
                    {(opt.impliedVolatility * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500 text-xs">
                    {opt.openInterest.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSelectOption(opt); }}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        isSelected
                          ? showType === 'call'
                            ? 'bg-green-600/30 text-green-400'
                            : 'bg-red-600/30 text-red-400'
                          : 'bg-slate-700/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
