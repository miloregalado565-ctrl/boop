import { Settings, TrendingUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ActiveTab } from '../types/common';

const TABS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: 'scanner', label: 'Top 5 Scanner', icon: '🔥' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'screenshot', label: 'Chart Analysis', icon: '📷' },
  { id: 'history', label: 'Signal History', icon: '📊' },
  { id: 'watchlist', label: 'Watchlist', icon: '⭐' },
];

export function Header() {
  const { state, dispatch } = useAppContext();

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-cyan-400" />
              <div>
                <h1 className="text-lg font-bold text-white leading-none">
                  Volatility Scanner <span className="text-cyan-400">Pro</span>
                </h1>
                <p className="text-xs text-slate-500">Universal Options Scanner</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1 pb-2 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                state.activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
