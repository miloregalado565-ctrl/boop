import { Option, OptionChain, TPSLSetup, TradeSetup } from '../types/options';
import { blackScholes, estimateIV } from './greeksCalculator';
import { daysUntil } from './formatters';

const RISK_FREE_RATE = 0.05;

export function calculateExpectedMove(
  atmCallPrice: number,
  atmPutPrice: number,
  stockPrice: number
): number {
  return ((atmCallPrice + atmPutPrice) / stockPrice) * 100;
}

export function estimateIVFromStraddle(
  callPrice: number,
  putPrice: number,
  stockPrice: number,
  daysToExpiration: number
): number {
  const T = daysToExpiration / 365;
  if (T <= 0) return 0.3;
  return (callPrice + putPrice) / (0.4 * stockPrice * Math.sqrt(T));
}

export function calculateTPSL(
  premium: number,
  strategy: 'conservative' | 'moderate' | 'aggressive',
  theta: number
): Omit<TPSLSetup, 'breakeven'> {
  const configs = {
    conservative: { tpMultiplier: 0.6, slMultiplier: 0.2, winRate: 64 },
    moderate: { tpMultiplier: 0.85, slMultiplier: 0.3, winRate: 55 },
    aggressive: { tpMultiplier: 1.0, slMultiplier: 0.45, winRate: 40 },
  };

  const config = configs[strategy];
  const tp = premium * config.tpMultiplier;
  const sl = premium * config.slMultiplier;
  const contracts = 1;
  const multiplier = 100;

  return {
    takeProfit: premium + tp,
    takeProfitDollar: tp * multiplier * contracts,
    stopLoss: premium - sl,
    stopLossDollar: sl * multiplier * contracts,
    riskRewardRatio: `${(tp / sl).toFixed(1)}:1`,
    estimatedWinRate: config.winRate,
    maxGain: tp * multiplier * contracts,
    maxLoss: sl * multiplier * contracts,
    thetaDecayPerDay: Math.abs(theta) * multiplier,
  };
}

export function buildTradeSetup(
  option: Option,
  type: 'call' | 'put',
  ticker: string,
  stockPrice: number
): TradeSetup {
  const entry = option.midPrice;
  const strikeSign = type === 'call' ? 1 : -1;
  const breakeven = option.strikePrice + strikeSign * entry;

  const makeSetup = (strategy: 'conservative' | 'moderate' | 'aggressive'): TPSLSetup => ({
    ...calculateTPSL(entry, strategy, option.theta),
    breakeven,
  });

  return {
    option,
    type,
    ticker,
    stockPrice,
    entryPrice: entry,
    conservative: makeSetup('conservative'),
    moderate: makeSetup('moderate'),
    aggressive: makeSetup('aggressive'),
  };
}

export function generateSimulatedOptionsChain(
  ticker: string,
  stockPrice: number,
  ivRank: number
): OptionChain {
  const baseIV = getBaseIV(ticker, ivRank);
  const expirationDates = getUpcomingExpirations();
  const selectedExpiration = expirationDates[1]; // default to next weekly

  const strikes = generateStrikes(stockPrice);
  const T = daysUntil(selectedExpiration) / 365;

  const calls: Option[] = strikes.map((K) => {
    const greeks = blackScholes({
      S: stockPrice,
      K,
      T: Math.max(T, 1 / 365),
      r: RISK_FREE_RATE,
      sigma: baseIV * (1 + Math.abs(K - stockPrice) / stockPrice * 0.3),
      type: 'call',
    });
    const spread = Math.max(0.03, greeks.price * 0.05);
    const bid = Math.max(0.01, greeks.price - spread / 2);
    const ask = greeks.price + spread / 2;
    return buildOption(K, selectedExpiration, bid, ask, greeks, baseIV, stockPrice);
  });

  const puts: Option[] = strikes.map((K) => {
    const greeks = blackScholes({
      S: stockPrice,
      K,
      T: Math.max(T, 1 / 365),
      r: RISK_FREE_RATE,
      sigma: baseIV * (1 + Math.abs(K - stockPrice) / stockPrice * 0.3 + (K < stockPrice ? 0.05 : 0)),
      type: 'put',
    });
    const spread = Math.max(0.03, greeks.price * 0.05);
    const bid = Math.max(0.01, greeks.price - spread / 2);
    const ask = greeks.price + spread / 2;
    return buildOption(K, selectedExpiration, bid, ask, greeks, baseIV, stockPrice);
  });

  const atmCall = calls.find((c) => c.isATM) ?? calls[Math.floor(calls.length / 2)];
  const atmPut = puts.find((p) => p.isATM) ?? puts[Math.floor(puts.length / 2)];
  const expectedMove = calculateExpectedMove(atmCall.midPrice, atmPut.midPrice, stockPrice);

  return {
    ticker,
    stockPrice,
    calls,
    puts,
    expirationDates,
    selectedExpiration,
    ivRank,
    ivPercentile: ivRank,
    expectedMove: (expectedMove / 100) * stockPrice,
    expectedMovePercent: expectedMove,
    isSimulated: true,
  };
}

function buildOption(
  K: number,
  expiration: string,
  bid: number,
  ask: number,
  greeks: ReturnType<typeof blackScholes>,
  _baseIV: number,
  stockPrice: number
): Option {
  const mid = (bid + ask) / 2;
  const intrinsic = Math.max(0, greeks.price - Math.max(0, stockPrice - K));
  return {
    strikePrice: K,
    expirationDate: expiration,
    bidPrice: parseFloat(bid.toFixed(2)),
    askPrice: parseFloat(ask.toFixed(2)),
    lastPrice: parseFloat(mid.toFixed(2)),
    midPrice: parseFloat(mid.toFixed(2)),
    impliedVolatility: greeks.impliedVolatility,
    delta: parseFloat(greeks.delta.toFixed(4)),
    gamma: parseFloat(greeks.gamma.toFixed(4)),
    theta: parseFloat(greeks.theta.toFixed(4)),
    vega: parseFloat(greeks.vega.toFixed(4)),
    openInterest: Math.floor(Math.random() * 5000 + 100),
    volume: Math.floor(Math.random() * 1000 + 10),
    probabilityITM: parseFloat(greeks.probabilityITM.toFixed(4)),
    intrinsicValue: parseFloat(intrinsic.toFixed(2)),
    timeValue: parseFloat(Math.max(0, mid - intrinsic).toFixed(2)),
    isATM: Math.abs(K - stockPrice) / stockPrice < 0.01,
  };
}

function generateStrikes(stockPrice: number): number[] {
  const strikeStep = stockPrice < 50 ? 1 : stockPrice < 200 ? 5 : stockPrice < 500 ? 10 : 25;
  const atm = Math.round(stockPrice / strikeStep) * strikeStep;
  const strikes: number[] = [];
  for (let i = -7; i <= 7; i++) {
    strikes.push(atm + i * strikeStep);
  }
  return strikes.filter((s) => s > 0);
}

function getUpcomingExpirations(): string[] {
  const dates: string[] = [];
  const now = new Date();
  // Find next Friday
  const day = now.getDay();
  const daysToFriday = (5 - day + 7) % 7 || 7;
  for (let week = 0; week < 8; week++) {
    const d = new Date(now);
    d.setDate(now.getDate() + daysToFriday + week * 7);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function getBaseIV(ticker: string, ivRank: number): number {
  const ivProfiles: Record<string, number> = {
    SOXL: 1.2, NVDA: 0.65, TSLA: 0.75, AMD: 0.65, COIN: 0.9,
    GME: 1.1, AMC: 1.2, RIOT: 1.1, MARA: 1.0, MSTR: 0.95,
    PLTR: 0.7, SOFI: 0.75, HOOD: 0.85, UPST: 1.0, SQ: 0.65,
    AAPL: 0.28, MSFT: 0.3, GOOGL: 0.32, AMZN: 0.38, META: 0.4,
    NFLX: 0.45, UBER: 0.5, JPM: 0.28, BAC: 0.32, V: 0.25,
    SPY: 0.18, QQQ: 0.22, IWM: 0.25,
  };
  const base = ivProfiles[ticker.toUpperCase()] ?? 0.45;
  // Scale by IV rank
  return base * (0.7 + ivRank / 100 * 0.6);
}

export function getIVRank(ticker: string): number {
  // Simulate IV rank 0-100 based on ticker characteristics
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Math.floor((seed % 70) + 20);
}

export { estimateIV };
