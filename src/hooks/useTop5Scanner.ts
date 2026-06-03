import { useState, useEffect, useCallback, useRef } from 'react';
import { Top5Stock } from '../types/stock';
import { fetchMultipleQuotes } from '../services/marketDataService';
import { generateSimulatedOptionsChain, getIVRank } from '../utils/optionsCalculator';
import { WATCHLIST_STOCKS } from '../services/tickerSearchService';
import { getTickerName } from '../services/marketDataService';

const SCAN_TICKERS = WATCHLIST_STOCKS;
const REFRESH_INTERVAL = 300; // 5 minutes in seconds

export function useTop5Scanner(autoRefresh: boolean) {
  const [top5, setTop5] = useState<Top5Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const quotes = await fetchMultipleQuotes(SCAN_TICKERS);
      const candidates: Top5Stock[] = [];

      for (const [ticker, quote] of quotes.entries()) {
        const ivRank = getIVRank(ticker);
        const chain = generateSimulatedOptionsChain(ticker, quote.price, ivRank);
        const atmCall = chain.calls.find((c) => c.isATM) ?? chain.calls[Math.floor(chain.calls.length / 2)];
        const atmPut = chain.puts.find((p) => p.isATM) ?? chain.puts[Math.floor(chain.puts.length / 2)];
        if (!atmCall || !atmPut) continue;

        const expectedMovePercent =
          ((atmCall.midPrice + atmPut.midPrice) / quote.price) * 100;

        candidates.push({
          ticker,
          name: getTickerName(ticker),
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent,
          expectedMovePercent,
          callPremium: atmCall.midPrice,
          putPremium: atmPut.midPrice,
          ivRank,
          isHot: expectedMovePercent > 8,
          isBestCall: false,
          isBestPut: false,
        });
      }

      candidates.sort((a, b) => b.expectedMovePercent - a.expectedMovePercent);
      const top = candidates.slice(0, 5);

      // Mark best call (most positive change %) and best put (most negative change %)
      if (top.length > 0) {
        const bestCallIdx = top.reduce(
          (best, s, i) => (s.changePercent > top[best].changePercent ? i : best),
          0
        );
        const bestPutIdx = top.reduce(
          (best, s, i) => (s.changePercent < top[best].changePercent ? i : best),
          0
        );
        top[bestCallIdx].isBestCall = true;
        top[bestPutIdx].isBestPut = true;
      }

      setTop5(top);
      setLastUpdated(new Date());
    } catch {
      // keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial scan
  useEffect(() => {
    scan();
  }, [scan]);

  // Countdown timer
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(REFRESH_INTERVAL);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (autoRefresh) {
            scan();
          }
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, scan, lastUpdated]);

  return { top5, loading, lastUpdated, countdown, refresh: scan };
}
