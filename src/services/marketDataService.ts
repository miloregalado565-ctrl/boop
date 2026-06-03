import { StockData, QuoteData } from '../types/stock';
import { getIVRank } from '../utils/optionsCalculator';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const YF_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';

const TICKER_NAMES: Record<string, string> = {
  SOXL: 'Direxion Semi Bull 3X', AVGO: 'Broadcom Inc', MRVL: 'Marvell Technology',
  MU: 'Micron Technology', AMD: 'Advanced Micro Devices', NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla Inc', AAPL: 'Apple Inc', MSFT: 'Microsoft Corporation',
  GOOGL: 'Alphabet Inc', NFLX: 'Netflix Inc', AMZN: 'Amazon.com Inc',
  UBER: 'Uber Technologies', F: 'Ford Motor', GM: 'General Motors',
  GE: 'GE Aerospace', JPM: 'JPMorgan Chase', BAC: 'Bank of America',
  V: 'Visa Inc', MA: 'Mastercard Inc', CRM: 'Salesforce Inc',
  ADBE: 'Adobe Inc', PYPL: 'PayPal Holdings', SQ: 'Block Inc',
  UPST: 'Upstart Holdings', COIN: 'Coinbase Global', RIOT: 'Riot Platforms',
  MARA: 'Marathon Digital', GME: 'GameStop Corp', AMC: 'AMC Entertainment',
  NIO: 'NIO Inc', XPEV: 'XPeng Inc', LCID: 'Lucid Group',
  RIVN: 'Rivian Automotive', PLTR: 'Palantir Technologies', SOFI: 'SoFi Technologies',
  HOOD: 'Robinhood Markets', CLSK: 'CleanSpark Inc', MSTR: 'MicroStrategy',
  ORCL: 'Oracle Corporation', INTC: 'Intel Corporation', QCOM: 'QUALCOMM Inc',
  META: 'Meta Platforms', SNAP: 'Snap Inc', TWTR: 'Twitter/X Corp',
  SHOP: 'Shopify Inc', DKNG: 'DraftKings Inc', RBLX: 'Roblox Corporation',
  SPOT: 'Spotify Technology', ZM: 'Zoom Video', ROKU: 'Roku Inc',
  SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ Trust', IWM: 'iShares Russell 2000',
};

const SIMULATED_PRICES: Record<string, { price: number; change: number }> = {
  SOXL: { price: 28.5, change: 2.1 }, AVGO: { price: 165.0, change: 1.8 },
  MRVL: { price: 68.5, change: -0.8 }, MU: { price: 108.0, change: 1.2 },
  AMD: { price: 150.0, change: 3.2 }, NVDA: { price: 118.0, change: 4.5 },
  TSLA: { price: 285.0, change: -2.3 }, AAPL: { price: 192.5, change: 0.8 },
  MSFT: { price: 415.0, change: 1.5 }, GOOGL: { price: 175.0, change: 2.1 },
  NFLX: { price: 625.0, change: -1.2 }, AMZN: { price: 195.0, change: 1.9 },
  UBER: { price: 72.0, change: 0.5 }, F: { price: 11.5, change: -0.3 },
  GM: { price: 45.0, change: 0.4 }, GE: { price: 168.0, change: 1.1 },
  JPM: { price: 218.0, change: 0.9 }, BAC: { price: 40.0, change: 0.3 },
  V: { price: 275.0, change: 1.2 }, MA: { price: 465.0, change: 2.1 },
  CRM: { price: 280.0, change: -0.5 }, ADBE: { price: 445.0, change: 1.8 },
  PYPL: { price: 65.0, change: -1.1 }, SQ: { price: 68.0, change: 2.3 },
  UPST: { price: 62.0, change: 3.5 }, COIN: { price: 225.0, change: 5.2 },
  RIOT: { price: 8.5, change: 4.1 }, MARA: { price: 18.0, change: 3.8 },
  GME: { price: 22.0, change: -1.5 }, AMC: { price: 4.5, change: 2.2 },
  NIO: { price: 4.8, change: 3.1 }, XPEV: { price: 9.5, change: 2.8 },
  LCID: { price: 2.8, change: 1.5 }, RIVN: { price: 12.5, change: -2.1 },
  PLTR: { price: 25.0, change: 1.8 }, SOFI: { price: 8.0, change: 0.9 },
  HOOD: { price: 18.5, change: 3.2 }, MSTR: { price: 1450.0, change: 8.5 },
  ORCL: { price: 145.0, change: 1.1 }, INTC: { price: 22.0, change: -0.5 },
  QCOM: { price: 158.0, change: 2.3 }, META: { price: 495.0, change: 3.1 },
  SPY: { price: 540.0, change: 0.8 }, QQQ: { price: 465.0, change: 1.1 },
  IWM: { price: 210.0, change: 0.6 },
};

async function fetchYahooFinance(ticker: string): Promise<QuoteData | null> {
  try {
    const url = `${YF_BASE}${ticker}?interval=1d&range=1d`;
    const proxied = `${CORS_PROXY}${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(proxied, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? meta.previousClose;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose;

    return {
      ticker: ticker.toUpperCase(),
      price,
      change: price - prevClose,
      changePercent: ((price - prevClose) / prevClose) * 100,
      bidPrice: price * 0.9995,
      askPrice: price * 1.0005,
      volume: meta.regularMarketVolume ?? 0,
      week52High: meta.fiftyTwoWeekHigh ?? price * 1.3,
      week52Low: meta.fiftyTwoWeekLow ?? price * 0.7,
    };
  } catch {
    return null;
  }
}

function buildSimulatedQuote(ticker: string): QuoteData {
  const sim = SIMULATED_PRICES[ticker.toUpperCase()];
  const price = sim?.price ?? 100 + (ticker.charCodeAt(0) * 3.7) % 200;
  const change = sim?.change ?? (Math.random() - 0.5) * price * 0.03;
  const prevClose = price - change;

  return {
    ticker: ticker.toUpperCase(),
    price,
    change,
    changePercent: (change / prevClose) * 100,
    bidPrice: price * 0.9998,
    askPrice: price * 1.0002,
    volume: Math.floor(Math.random() * 50_000_000 + 1_000_000),
    week52High: price * (1.2 + Math.random() * 0.3),
    week52Low: price * (0.6 + Math.random() * 0.2),
  };
}

export async function fetchStockData(ticker: string): Promise<StockData> {
  const upper = ticker.toUpperCase();
  const quote = (await fetchYahooFinance(upper)) ?? buildSimulatedQuote(upper);
  const isSimulated = !!(await fetchYahooFinance(upper).catch(() => null)) === false;

  return {
    ticker: upper,
    name: TICKER_NAMES[upper] ?? upper,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    bidPrice: quote.bidPrice,
    askPrice: quote.askPrice,
    volume: quote.volume,
    week52High: quote.week52High,
    week52Low: quote.week52Low,
    lastUpdated: new Date(),
    isSimulated,
  };
}

export async function fetchMultipleQuotes(
  tickers: string[]
): Promise<Map<string, QuoteData>> {
  const results = new Map<string, QuoteData>();
  // Batch with small delay to avoid overwhelming the proxy
  for (let i = 0; i < tickers.length; i += 5) {
    const batch = tickers.slice(i, i + 5);
    await Promise.all(
      batch.map(async (ticker) => {
        const quote = (await fetchYahooFinance(ticker)) ?? buildSimulatedQuote(ticker);
        results.set(ticker, quote);
      })
    );
    if (i + 5 < tickers.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return results;
}

export function getTickerName(ticker: string): string {
  return TICKER_NAMES[ticker.toUpperCase()] ?? ticker;
}

export { getIVRank, SIMULATED_PRICES };
