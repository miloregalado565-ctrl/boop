import { useAppContext } from '../context/AppContext';
import { SignalCard } from './SignalCard';
import { Trash2 } from 'lucide-react';

export function SignalHistory() {
  const { state } = useAppContext();
  const { signalHistory } = state;

  const callSignals = signalHistory.filter((s) => s.signal === 'CALL');
  const putSignals = signalHistory.filter((s) => s.signal === 'PUT');

  if (signalHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-white font-semibold mb-1">No signal history yet</p>
        <p className="text-slate-500 text-sm">
          Analyze chart screenshots to build your signal history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Signal History</h2>
          <p className="text-slate-400 text-sm">
            {signalHistory.length} signals · {callSignals.length} CALL · {putSignals.length} PUT
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm('Clear all signal history?')) {
              // We don't have a clear action, so we'll dispatch a fake one handled by resetting
              window.dispatchEvent(new CustomEvent('vsp:clearHistory'));
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg text-sm transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signalHistory.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}
