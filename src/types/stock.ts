export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  week52High: number;
  week52Low: number;
  lastUpdated: Date;
  isSimulated?: boolean;
}

export interface Top5Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  expectedMovePercent: number;
  callPremium: number;
  putPremium: number;
  ivRank: number;
  isHot: boolean;
  isBestCall: boolean;
  isBestPut: boolean;
}

export interface QuoteData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  bidPrice: number;
  askPrice: number;
  volume: number;
  week52High: number;
  week52Low: number;
}
