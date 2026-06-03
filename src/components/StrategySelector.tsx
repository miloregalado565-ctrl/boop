import { Strategy } from '../types/options';
import { useAppContext } from '../context/AppContext';

const STRATEGIES: {
  id: Strategy;
  label: string;
  desc: string;
  winRate: string;
  color: string;
}[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    desc: 'Exit early — small gain, preserve premium',
    winRate: '64% win rate',
    color: 'blue',
  },
  {
    id: 'moderate',
    label: 'Moderate',
    desc: 'Balanced risk/reward',
    winRate: '55% win rate',
    color: 'cyan',
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    desc: 'Hold for max gain — higher risk',
    winRate: '40% win rate',
    color: 'orange',
  },
];

const colorMap = {
  blue: 'bg-blue-600/20 text-blue-400 border-blue-700/40',
  cyan: 'bg-cyan-600/20 text-cyan-400 border-cyan-700/40',
  orange: 'bg-orange-600/20 text-orange-400 border-orange-700/40',
};

const inactiveStyle = 'bg-slate-800/60 text-slate-400 border-slate-700/40 hover:border-slate-600';

export function StrategySelector() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="grid grid-cols-3 gap-2">
      {STRATEGIES.map((s) => {
        const active = state.selectedStrategy === s.id;
        return (
          <button
            key={s.id}
            onClick={() => dispatch({ type: 'SET_STRATEGY', payload: s.id })}
            className={`p-3 rounded-xl border text-left transition-all ${
              active ? colorMap[s.color as keyof typeof colorMap] : inactiveStyle
            }`}
          >
            <p className="font-semibold text-sm">{s.label}</p>
            <p className="text-xs opacity-70 mt-0.5 hidden sm:block">{s.desc}</p>
            <p className={`text-xs font-medium mt-1 ${active ? 'opacity-100' : 'opacity-50'}`}>
              {s.winRate}
            </p>
          </button>
        );
      })}
    </div>
  );
}
