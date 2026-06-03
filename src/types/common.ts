export interface SignalResult {
  id: string;
  timestamp: Date;
  ticker?: string;
  imageDataUrl?: string;
  currentPrice?: number;
  supportLevel?: number;
  resistanceLevel?: number;
  trend?: 'uptrend' | 'downtrend' | 'sideways';
  patterns?: string[];
  indicators?: string;
  signal: 'CALL' | 'PUT' | 'HOLD';
  confidence: number;
  entry?: number;
  stopLoss?: number;
  takeProfit?: number;
  reasoning?: string;
  riskReward?: string;
}

export interface ApiKeys {
  anthropic: string;
  alphaVantage: string;
}

export interface AppSettings {
  apiKeys: ApiKeys;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultStrategy: 'conservative' | 'moderate' | 'aggressive';
}

export type ActiveTab = 'scanner' | 'search' | 'screenshot' | 'history' | 'watchlist';
