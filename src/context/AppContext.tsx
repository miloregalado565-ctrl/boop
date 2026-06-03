import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { StockData } from '../types/stock';
import { OptionChain, Option, Strategy, OptionType } from '../types/options';
import { SignalResult, AppSettings, ActiveTab } from '../types/common';

interface AppState {
  searchQuery: string;
  currentStock: StockData | null;
  optionsChain: OptionChain | null;
  stockLoading: boolean;
  stockError: string | null;
  selectedOption: Option | null;
  selectedOptionType: OptionType | null;
  selectedStrategy: Strategy;
  selectedExpiration: string;
  signalHistory: SignalResult[];
  currentSignal: SignalResult | null;
  activeTab: ActiveTab;
  showSettings: boolean;
  settings: AppSettings;
}

type Action =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_STOCK_LOADING'; payload: boolean }
  | { type: 'SET_STOCK_DATA'; payload: StockData }
  | { type: 'SET_OPTIONS_CHAIN'; payload: OptionChain }
  | { type: 'SET_STOCK_ERROR'; payload: string | null }
  | { type: 'SELECT_OPTION'; payload: { option: Option; optionType: OptionType } }
  | { type: 'SET_STRATEGY'; payload: Strategy }
  | { type: 'SET_EXPIRATION'; payload: string }
  | { type: 'ADD_SIGNAL'; payload: SignalResult }
  | { type: 'SET_CURRENT_SIGNAL'; payload: SignalResult | null }
  | { type: 'SET_ACTIVE_TAB'; payload: ActiveTab }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'CLEAR_STOCK' };

const defaultSettings: AppSettings = {
  apiKeys: { anthropic: '', alphaVantage: '' },
  autoRefresh: true,
  refreshInterval: 300,
  defaultStrategy: 'moderate',
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem('vsp_settings');
    if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return defaultSettings;
}

const initialState: AppState = {
  searchQuery: '',
  currentStock: null,
  optionsChain: null,
  stockLoading: false,
  stockError: null,
  selectedOption: null,
  selectedOptionType: null,
  selectedStrategy: 'moderate',
  selectedExpiration: '',
  signalHistory: [],
  currentSignal: null,
  activeTab: 'scanner',
  showSettings: false,
  settings: loadSettings(),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_STOCK_LOADING':
      return { ...state, stockLoading: action.payload };
    case 'SET_STOCK_DATA':
      return { ...state, currentStock: action.payload, stockError: null };
    case 'SET_OPTIONS_CHAIN':
      return { ...state, optionsChain: action.payload };
    case 'SET_STOCK_ERROR':
      return { ...state, stockError: action.payload, stockLoading: false };
    case 'SELECT_OPTION':
      return {
        ...state,
        selectedOption: action.payload.option,
        selectedOptionType: action.payload.optionType,
      };
    case 'SET_STRATEGY':
      return { ...state, selectedStrategy: action.payload };
    case 'SET_EXPIRATION':
      return { ...state, selectedExpiration: action.payload };
    case 'ADD_SIGNAL':
      return {
        ...state,
        signalHistory: [action.payload, ...state.signalHistory].slice(0, 50),
        currentSignal: action.payload,
      };
    case 'SET_CURRENT_SIGNAL':
      return { ...state, currentSignal: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'UPDATE_SETTINGS': {
      const updated = { ...state.settings, ...action.payload };
      try { localStorage.setItem('vsp_settings', JSON.stringify(updated)); } catch { /* ignore */ }
      return { ...state, settings: updated };
    }
    case 'CLEAR_STOCK':
      return {
        ...state,
        currentStock: null,
        optionsChain: null,
        selectedOption: null,
        selectedOptionType: null,
        stockError: null,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
