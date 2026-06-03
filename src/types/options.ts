export interface Option {
  strikePrice: number;
  expirationDate: string;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  midPrice: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  openInterest: number;
  volume: number;
  probabilityITM: number;
  intrinsicValue: number;
  timeValue: number;
  isATM: boolean;
}

export interface OptionChain {
  ticker: string;
  stockPrice: number;
  calls: Option[];
  puts: Option[];
  expirationDates: string[];
  selectedExpiration: string;
  ivRank: number;
  ivPercentile: number;
  expectedMove: number;
  expectedMovePercent: number;
  isSimulated?: boolean;
}

export interface TPSLSetup {
  takeProfit: number;
  takeProfitDollar: number;
  stopLoss: number;
  stopLossDollar: number;
  riskRewardRatio: string;
  estimatedWinRate: number;
  maxGain: number;
  maxLoss: number;
  breakeven: number;
  thetaDecayPerDay: number;
}

export interface TradeSetup {
  option: Option;
  type: 'call' | 'put';
  ticker: string;
  stockPrice: number;
  entryPrice: number;
  conservative: TPSLSetup;
  moderate: TPSLSetup;
  aggressive: TPSLSetup;
}

export type Strategy = 'conservative' | 'moderate' | 'aggressive';
export type OptionType = 'call' | 'put';
export type ExpirationFilter = 'weekly' | 'monthly' | 'all';
