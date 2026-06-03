import { SignalResult } from '../types/common';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const ANALYSIS_PROMPT = `Analyze this trading chart image and provide a detailed technical analysis. Return ONLY a valid JSON object with NO extra text, markdown, or explanation.

Required JSON format:
{
  "currentPrice": number or null,
  "supportLevel": number or null,
  "resistanceLevel": number or null,
  "trend": "uptrend" | "downtrend" | "sideways",
  "patterns": ["pattern1", "pattern2"],
  "indicators": "description of visible indicators",
  "signal": "CALL" | "PUT" | "HOLD",
  "confidence": number (0-100),
  "entry": number or null,
  "stopLoss": number or null,
  "takeProfit": number or null,
  "reasoning": "brief explanation of the trading signal"
}

Analysis guidelines:
- Identify candlestick patterns: Hammer, Engulfing, Morning/Evening Star, Doji, etc.
- Check trend direction based on higher highs/lows or lower highs/lows
- Identify support and resistance from price congestion zones
- Look for moving averages, RSI, MACD, Bollinger Bands if visible
- CALL = bullish signal (price likely to go up)
- PUT = bearish signal (price likely to go down)
- HOLD = no clear directional bias
- Confidence: 40-50% single pattern, 60-70% multiple patterns, 75-85% + indicators, 85-95% all signals aligned`;

export async function analyzeChart(
  imageBase64: string,
  mediaType: string,
  apiKey: string
): Promise<SignalResult> {
  if (!apiKey) {
    throw new Error('Anthropic API key required. Add it in Settings.');
  }

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ?? `API error: ${response.status}`
    );
  }

  const data = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };
  const text = data.content?.[0]?.text ?? '';

  let parsed: Record<string, unknown>;
  try {
    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse chart analysis response. Please try again.');
  }

  const riskReward =
    parsed.entry && parsed.stopLoss && parsed.takeProfit
      ? (
          Math.abs((parsed.takeProfit as number) - (parsed.entry as number)) /
          Math.abs((parsed.entry as number) - (parsed.stopLoss as number))
        ).toFixed(1) + ':1'
      : undefined;

  return {
    id: Date.now().toString(),
    timestamp: new Date(),
    currentPrice: (parsed.currentPrice as number | undefined) ?? undefined,
    supportLevel: (parsed.supportLevel as number | undefined) ?? undefined,
    resistanceLevel: (parsed.resistanceLevel as number | undefined) ?? undefined,
    trend: (parsed.trend as SignalResult['trend']) ?? 'sideways',
    patterns: (parsed.patterns as string[] | undefined) ?? [],
    indicators: (parsed.indicators as string | undefined) ?? '',
    signal: (parsed.signal as SignalResult['signal']) ?? 'HOLD',
    confidence: Math.min(100, Math.max(0, (parsed.confidence as number | undefined) ?? 50)),
    entry: (parsed.entry as number | undefined) ?? undefined,
    stopLoss: (parsed.stopLoss as number | undefined) ?? undefined,
    takeProfit: (parsed.takeProfit as number | undefined) ?? undefined,
    reasoning: (parsed.reasoning as string | undefined) ?? '',
    riskReward,
  };
}
