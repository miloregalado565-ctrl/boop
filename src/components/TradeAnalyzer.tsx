import { Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { buildTradeSetup } from '../utils/optionsCalculator';
import { StrategySelector } from './StrategySelector';
import { formatCurrency, formatDate, daysUntil } from '../utils/formatters';
import { TPSLSetup } from '../types/options';

export function TradeAnalyzer() {
  const { state, dispatch } = useAppContext();
  const { selectedOption, selectedOptionType, selectedStrategy, currentStock } = state;

  if (!selectedOption || !selectedOptionType || !currentStock) return null;

  const setup = buildTradeSetup(
    selectedOption,
    selectedOptionType,
    currentStock.ticker,
    currentStock.price
  );

  const strategyData = setup[selectedStrategy];
  const isCall = selectedOptionType === 'call';
  const daysToExp = daysUntil(selectedOption.expirationDate);

  const copyToClipboard = () => {
    const text = [
      `${currentStock.ticker} ${isCall ? 'CALL' : 'PUT'} $${selectedOption.strikePrice}`,
      `Exp: ${formatDate(selectedOption.expirationDate)} (${daysToExp}d)`,
      `Entry: ${formatCurrency(setup.entryPrice)}`,
      `Take Profit: ${formatCurrency(strategyData.takeProfit)} (+${formatCurrency(strategyData.takeProfitDollar)})`,
      `Stop Loss: ${formatCurrency(strategyData.stopLoss)} (-${formatCurrency(strategyData.stopLossDollar)})`,
      `R:R ${strategyData.riskRewardRatio} | Win Rate ~${strategyData.estimatedWinRate}%`,
    ].join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const rbOptionsLink = `https://robinhood.com/options/${currentStock.ticker}`;

  return (
    <div className={`bg-slate-900/80 border rounded-xl overflow-hidden ${
      isCall ? 'border-green-800/40' : 'border-red-800/40'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        isCall ? 'bg-green-900/20 border-green-800/30' : 'bg-red-900/20 border-red-800/30'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'SELECT_OPTION', payload: { option: selectedOption, optionType: selectedOptionType } })}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className={`font-bold text-lg ${isCall ? 'text-green-400' : 'text-red-400'}`}>
              {isCall ? '📈' : '📉'} {currentStock.ticker} ${selectedOption.strikePrice}{' '}
              {isCall ? 'CALL' : 'PUT'}
            </h3>
            <p className="text-slate-400 text-sm">
              Expires {formatDate(selectedOption.expirationDate)} · {daysToExp} days
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold text-xl">{formatCurrency(setup.entryPrice)}</p>
          <p className="text-slate-400 text-xs">mid-price entry</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Option details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <MiniStat label="Bid" value={formatCurrency(selectedOption.bidPrice)} />
          <MiniStat label="Ask" value={formatCurrency(selectedOption.askPrice)} />
          <MiniStat label="Delta" value={selectedOption.delta.toFixed(3)} />
          <MiniStat label="Theta/day" value={`-${formatCurrency(Math.abs(strategyData.thetaDecayPerDay))}`} highlight="red" />
          <MiniStat label="IV" value={`${(selectedOption.impliedVolatility * 100).toFixed(0)}%`}
            highlight={selectedOption.impliedVolatility > 0.7 ? 'orange' : undefined} />
          <MiniStat label="Gamma" value={selectedOption.gamma.toFixed(4)} />
          <MiniStat label="Vega" value={selectedOption.vega.toFixed(3)} />
          <MiniStat label="Prob ITM" value={`${(selectedOption.probabilityITM * 100).toFixed(0)}%`}
            highlight={selectedOption.probabilityITM > 0.5 ? 'green' : undefined} />
        </div>

        {/* Strategy selector */}
        <div>
          <p className="text-sm text-slate-400 mb-2">Strategy</p>
          <StrategySelector />
        </div>

        {/* TP/SL breakdown */}
        <TPSLBreakdown setup={strategyData} isCall={isCall} entryPrice={setup.entryPrice} />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-all"
          >
            <Copy className="w-4 h-4" />
            Copy Trade Setup
          </button>
          <a
            href={rbOptionsLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
              isCall
                ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800/40'
                : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/40'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Trade on Robinhood
          </a>
        </div>
      </div>
    </div>
  );
}

function TPSLBreakdown({
  setup,
  entryPrice,
}: {
  setup: TPSLSetup;
  isCall: boolean;
  entryPrice: number;
}) {
  return (
    <div className="space-y-3">
      {/* TP */}
      <div className="bg-green-900/15 border border-green-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-green-400 font-semibold flex items-center gap-1.5">
            🎯 Take Profit
          </span>
          <span className="text-green-400 font-bold text-xl">
            {formatCurrency(setup.takeProfit)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">Gain per contract</p>
            <p className="text-green-400 font-semibold">+{formatCurrency(setup.takeProfitDollar)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">From entry</p>
            <p className="text-green-400 font-semibold">
              +{(((setup.takeProfit - entryPrice) / entryPrice) * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Win rate est.</p>
            <p className="text-green-400 font-semibold">{setup.estimatedWinRate}%</p>
          </div>
        </div>
      </div>

      {/* SL */}
      <div className="bg-red-900/15 border border-red-800/30 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-red-400 font-semibold flex items-center gap-1.5">
            🛑 Stop Loss
          </span>
          <span className="text-red-400 font-bold text-xl">
            {formatCurrency(setup.stopLoss)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">Loss per contract</p>
            <p className="text-red-400 font-semibold">-{formatCurrency(setup.stopLossDollar)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">From entry</p>
            <p className="text-red-400 font-semibold">
              -{(((entryPrice - setup.stopLoss) / entryPrice) * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">R:R Ratio</p>
            <p className="text-white font-semibold">{setup.riskRewardRatio}</p>
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Breakeven</p>
          <p className="text-white font-semibold text-sm">{formatCurrency(setup.breakeven)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Max Gain</p>
          <p className="text-green-400 font-semibold text-sm">+{formatCurrency(setup.maxGain)}</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Max Loss</p>
          <p className="text-red-400 font-semibold text-sm">-{formatCurrency(setup.maxLoss)}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'green' | 'red' | 'orange';
}) {
  const colors = { green: 'text-green-400', red: 'text-red-400', orange: 'text-orange-400' };
  return (
    <div className="bg-slate-800/50 rounded-lg p-2.5">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`font-semibold text-sm ${highlight ? colors[highlight] : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
