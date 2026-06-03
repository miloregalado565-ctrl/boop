import { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function SettingsModal() {
  const { state, dispatch } = useAppContext();
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState(state.settings.apiKeys.anthropic);
  const [avKey, setAvKey] = useState(state.settings.apiKeys.alphaVantage);

  if (!state.showSettings) return null;

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        apiKeys: { anthropic: anthropicKey.trim(), alphaVantage: avKey.trim() },
      },
    });
    dispatch({ type: 'TOGGLE_SETTINGS' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* API Keys */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">API Keys</h3>
            <div className="space-y-4">
              {/* Anthropic */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Anthropic API Key{' '}
                  <span className="text-cyan-400">(required for chart analysis)</span>
                </label>
                <div className="relative">
                  <input
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full px-4 py-2.5 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Used only for chart analysis. Stored locally in your browser.{' '}
                  <a
                    href="https://console.anthropic.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-400 inline-flex items-center gap-0.5"
                  >
                    Get API key <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {/* Alpha Vantage */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Alpha Vantage API Key{' '}
                  <span className="text-slate-500">(optional, for stock quotes)</span>
                </label>
                <input
                  type="text"
                  value={avKey}
                  onChange={(e) => setAvKey(e.target.value)}
                  placeholder="Your Alpha Vantage key..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-600 text-sm font-mono"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Free tier: 25 calls/day.{' '}
                  <a
                    href="https://www.alphavantage.co/support/#api-key"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-400 inline-flex items-center gap-0.5"
                  >
                    Get free key <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Auto-refresh */}
          <section>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Preferences</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={state.settings.autoRefresh}
                  onChange={(e) =>
                    dispatch({ type: 'UPDATE_SETTINGS', payload: { autoRefresh: e.target.checked } })
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-700 peer-checked:bg-cyan-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
              </div>
              <span className="text-sm text-slate-300">Auto-refresh Top 5 scanner every 5 minutes</span>
            </label>
          </section>

          {/* Data note */}
          <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
            <p className="font-semibold text-slate-400">About Market Data</p>
            <p>Stock quotes are fetched from Yahoo Finance via a CORS proxy. Options data uses Black-Scholes simulations based on typical IV profiles per ticker.</p>
            <p>Real-time options data requires a paid API subscription. Data marked "Simulated" uses realistic but estimated values.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t border-slate-800">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 bg-cyan-700/40 hover:bg-cyan-700/60 text-cyan-400 border border-cyan-700/40 rounded-xl text-sm font-semibold transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
