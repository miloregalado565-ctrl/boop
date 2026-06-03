const ALL_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH',
  'XOM', 'JNJ', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'ABBV', 'LLY',
  'MRK', 'AVGO', 'PEP', 'KO', 'COST', 'BAC', 'TMO', 'CRM', 'ORCL', 'MCD',
  'ABT', 'DHR', 'ACN', 'CSCO', 'NKE', 'LIN', 'AMD', 'ADBE', 'TXN', 'CMCSA',
  'NEE', 'VZ', 'NFLX', 'INTC', 'WMT', 'DIS', 'PM', 'QCOM', 'IBM', 'RTX',
  'SPGI', 'UPS', 'HON', 'AMGN', 'T', 'GE', 'CAT', 'SBUX', 'MS', 'GS',
  'NOW', 'BKNG', 'BLK', 'ELV', 'LOW', 'AXP', 'INTU', 'PLD', 'SYK', 'DE',
  'ADI', 'CI', 'GILD', 'MDLZ', 'TJX', 'REGN', 'VRTX', 'PANW', 'C', 'BSX',
  'MU', 'LRCX', 'KLAC', 'AMAT', 'MRVL', 'NXPI', 'ON', 'TER', 'MPWR', 'WOLF',
  'UBER', 'LYFT', 'SNAP', 'PINS', 'TWTR', 'SPOT', 'ROKU', 'ZM', 'DOCU', 'DKNG',
  'RBLX', 'COIN', 'HOOD', 'SQ', 'PYPL', 'SOFI', 'UPST', 'AFRM', 'LC', 'OPFI',
  'GME', 'AMC', 'BBBY', 'NOK', 'BB', 'SNDL', 'CLOV', 'EXPR', 'WISH', 'KOSS',
  'TSLA', 'NIO', 'XPEV', 'LI', 'LCID', 'RIVN', 'FSR', 'NKLA', 'GOEV', 'HYLN',
  'RIOT', 'MARA', 'HUT', 'CIFR', 'BTBT', 'MSTR', 'CLSK', 'SOS', 'BTCM', 'CAN',
  'PLTR', 'SOXL', 'SOXS', 'TQQQ', 'SQQQ', 'UVXY', 'VXX', 'SPXL', 'LABU', 'LABD',
  'SPY', 'QQQ', 'IWM', 'DIA', 'GLD', 'SLV', 'TLT', 'HYG', 'VIX', 'USO',
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BX', 'KKR', 'APO', 'ARES',
  'F', 'GM', 'STLA', 'TM', 'HMC', 'VWAGY', 'BMWYY', 'RACE', 'POAHY', 'MBGYY',
  'META', 'SNAP', 'PINS', 'TWTR', 'MTCH', 'BMBL', 'MSGS', 'IAC', 'ANGI', 'CARS',
];

const COMPANY_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc', MSFT: 'Microsoft Corp', GOOGL: 'Alphabet Inc', AMZN: 'Amazon.com',
  NVDA: 'NVIDIA Corp', META: 'Meta Platforms', TSLA: 'Tesla Inc', BRK_B: 'Berkshire Hathaway',
  JPM: 'JPMorgan Chase', V: 'Visa Inc', MA: 'Mastercard', BAC: 'Bank of America',
  AMD: 'Advanced Micro Devices', NFLX: 'Netflix Inc', COIN: 'Coinbase Global',
  PLTR: 'Palantir Technologies', GME: 'GameStop Corp', AMC: 'AMC Entertainment',
  SPY: 'SPDR S&P 500 ETF', QQQ: 'Invesco QQQ Trust', IWM: 'iShares Russell 2000',
};

export interface TickerSuggestion {
  ticker: string;
  name: string;
}

export function searchTickers(query: string): TickerSuggestion[] {
  if (!query || query.length < 1) return [];
  const q = query.toUpperCase();

  return ALL_TICKERS
    .filter((t) => t.startsWith(q) || t.includes(q))
    .slice(0, 8)
    .map((t) => ({
      ticker: t,
      name: COMPANY_NAMES[t] ?? t,
    }));
}

export function validateTicker(ticker: string): boolean {
  return /^[A-Z]{1,5}(\.[A-Z])?$/.test(ticker.toUpperCase());
}

export const WATCHLIST_STOCKS = [
  'SOXL', 'AVGO', 'MRVL', 'MU', 'AMD', 'NVDA', 'TSLA', 'AAPL', 'MSFT', 'GOOGL',
  'NFLX', 'AMZN', 'UBER', 'F', 'GM', 'GE', 'JPM', 'BAC', 'V', 'MA',
  'CRM', 'ADBE', 'PYPL', 'SQ', 'UPST', 'COIN', 'RIOT', 'MARA', 'GME', 'AMC',
  'NIO', 'XPEV', 'LCID', 'RIVN', 'PLTR', 'SOFI', 'HOOD', 'CLSK', 'MSTR', 'META',
];
