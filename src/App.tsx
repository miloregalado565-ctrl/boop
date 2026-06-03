import { useAppContext } from './context/AppContext';
import { Header } from './components/Header';
import { Top5Cards } from './components/Top5Cards';
import { SearchBar } from './components/SearchBar';
import { StockOverview } from './components/StockOverview';
import { OptionsChain } from './components/OptionsChain';
import { TradeAnalyzer } from './components/TradeAnalyzer';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { SignalHistory } from './components/SignalHistory';
import { Watchlist } from './components/Watchlist';
import { SettingsModal } from './components/SettingsModal';

function ScannerTab() {
  return (
    <div className="space-y-6">
      <Top5Cards />
      <div className="border-t border-slate-800/60 pt-6">
        <p className="text-slate-500 text-sm mb-4 text-center">
          ── Or search any ticker ──
        </p>
        <SearchBar />
      </div>
    </div>
  );
}

function SearchTab() {
  const { state } = useAppContext();

  return (
    <div className="space-y-5">
      <SearchBar />
      {(state.currentStock || state.stockLoading) && (
        <>
          <StockOverview />
          {state.optionsChain && !state.selectedOption && <OptionsChain />}
          {state.selectedOption && <TradeAnalyzer />}
        </>
      )}
    </div>
  );
}

export default function App() {
  const { state } = useAppContext();

  const renderTab = () => {
    switch (state.activeTab) {
      case 'scanner':
        return <ScannerTab />;
      case 'search':
        return <SearchTab />;
      case 'screenshot':
        return <ScreenshotUpload />;
      case 'history':
        return <SignalHistory />;
      case 'watchlist':
        return <Watchlist />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderTab()}
      </main>
      <SettingsModal />

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-600">
          Volatility Scanner Pro · Options data uses Black-Scholes simulation · Not financial advice
        </div>
      </footer>
    </div>
  );
}
