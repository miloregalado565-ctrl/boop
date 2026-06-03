import { useState } from 'react';
import { SignalResult } from '../types/common';
import { analyzeChart } from '../services/chartAnalyzerService';

export function useChartAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SignalResult | null>(null);

  const analyze = async (
    imageBase64: string,
    mediaType: string,
    apiKey: string,
    imageDataUrl?: string
  ) => {
    setAnalyzing(true);
    setError(null);
    try {
      const signal = await analyzeChart(imageBase64, mediaType, apiKey);
      if (imageDataUrl) {
        signal.imageDataUrl = imageDataUrl;
      }
      setResult(signal);
      return signal;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { analyzing, error, result, analyze, reset };
}
