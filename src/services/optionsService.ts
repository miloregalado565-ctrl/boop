import { OptionChain, Option } from '../types/options';
import { generateSimulatedOptionsChain, getIVRank } from '../utils/optionsCalculator';
import { daysUntil } from '../utils/formatters';
import { blackScholes } from '../utils/greeksCalculator';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const YF_OPTIONS = 'https://query1.finance.yahoo.com/v7/finance/options/';

async function fetchYahooOptions(
  ticker: string,
  stockPrice: number
): Promise<OptionChain | null> {
  try {
    const url = `${YF_OPTIONS}${ticker}`;
    const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(proxied, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.optionChain?.result?.[0];
    if (!result) return null;

    const expirationDates: string[] = (result.expirationDates ?? []).map(
      (ts: number) => new Date(ts * 1000).toISOString().split('T')[0]
    );
    if (expirationDates.length === 0) return null;

    const selectedExpiration = expirationDates[0];
    const optData = result.options?.[0];
    if (!optData) return null;

    const ivRank = getIVRank(ticker);

    const mapOption = (opt: Record<string, unknown>, type: 'call' | 'put'): Option => {
      const K = opt.strike as number;
      const bid = (opt.bid as number) ?? 0;
      const ask = (opt.ask as number) ?? 0;
      const last = (opt.lastPrice as number) ?? (bid + ask) / 2;
      const mid = (bid + ask) / 2 || last;
      const iv = (opt.impliedVolatility as number) ?? 0.3;
      const T = Math.max(daysUntil(selectedExpiration), 1) / 365;

      const greeks = blackScholes({ S: stockPrice, K, T, r: 0.05, sigma: iv, type });

      return {
        strikePrice: K,
        expirationDate: selectedExpiration,
        bidPrice: bid,
        askPrice: ask,
        lastPrice: last,
        midPrice: mid,
        impliedVolatility: iv,
        delta: greeks.delta,
        gamma: greeks.gamma,
        theta: greeks.theta,
        vega: greeks.vega,
        openInterest: (opt.openInterest as number) ?? 0,
        volume: (opt.volume as number) ?? 0,
        probabilityITM: greeks.probabilityITM,
        intrinsicValue: Math.max(0, type === 'call' ? stockPrice - K : K - stockPrice),
        timeValue: Math.max(0, mid - Math.max(0, type === 'call' ? stockPrice - K : K - stockPrice)),
        isATM: Math.abs(K - stockPrice) / stockPrice < 0.015,
      };
    };

    const calls = ((optData.calls as Record<string, unknown>[]) ?? []).map((c) => mapOption(c, 'call'));
    const puts = ((optData.puts as Record<string, unknown>[]) ?? []).map((p) => mapOption(p, 'put'));

    if (calls.length === 0 || puts.length === 0) return null;

    const atmCall = calls.find((c) => c.isATM) ?? calls[Math.floor(calls.length / 2)];
    const atmPut = puts.find((p) => p.isATM) ?? puts[Math.floor(puts.length / 2)];
    const expectedMovePct =
      ((atmCall.midPrice + atmPut.midPrice) / stockPrice) * 100;

    return {
      ticker,
      stockPrice,
      calls: calls.slice(0, 15),
      puts: puts.slice(0, 15),
      expirationDates,
      selectedExpiration,
      ivRank,
      ivPercentile: ivRank,
      expectedMove: (expectedMovePct / 100) * stockPrice,
      expectedMovePercent: expectedMovePct,
      isSimulated: false,
    };
  } catch {
    return null;
  }
}

export async function fetchOptionsChain(
  ticker: string,
  stockPrice: number
): Promise<OptionChain> {
  const real = await fetchYahooOptions(ticker, stockPrice);
  if (real) return real;

  const ivRank = getIVRank(ticker);
  return generateSimulatedOptionsChain(ticker, stockPrice, ivRank);
}

export async function refreshOptionsForExpiration(
  chain: OptionChain,
  expiration: string,
  stockPrice: number
): Promise<OptionChain> {
  const ivRank = chain.ivRank;
  const newChain = generateSimulatedOptionsChain(chain.ticker, stockPrice, ivRank);
  return { ...newChain, selectedExpiration: expiration };
}
