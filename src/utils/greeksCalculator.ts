// Standard normal cumulative distribution function
function normCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  return 0.5 * (1 + sign * (1 - poly * Math.exp(-absX * absX)));
}

// Standard normal probability density function
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BlackScholesInput {
  S: number;    // Stock price
  K: number;    // Strike price
  T: number;    // Time to expiration (years)
  r: number;    // Risk-free rate
  sigma: number; // Implied volatility
  type: 'call' | 'put';
}

export interface Greeks {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  impliedVolatility: number;
  probabilityITM: number;
}

export function blackScholes(input: BlackScholesInput): Greeks {
  const { S, K, T, r, sigma, type } = input;

  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      price: intrinsic,
      delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0),
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      impliedVolatility: sigma,
      probabilityITM: type === 'call' ? (S > K ? 1 : 0) : (S < K ? 1 : 0),
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  let price: number;
  let delta: number;
  let probabilityITM: number;

  if (type === 'call') {
    price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    delta = normCDF(d1);
    probabilityITM = normCDF(d2);
  } else {
    price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    delta = normCDF(d1) - 1;
    probabilityITM = normCDF(-d2);
  }

  const gamma = normPDF(d1) / (S * sigma * sqrtT);
  // Theta in per-day terms
  const theta = (
    (-S * normPDF(d1) * sigma / (2 * sqrtT) -
      r * K * Math.exp(-r * T) * (type === 'call' ? normCDF(d2) : normCDF(-d2))) /
    365
  );
  const vega = S * normPDF(d1) * sqrtT / 100; // per 1% change in IV
  const rho = type === 'call'
    ? K * T * Math.exp(-r * T) * normCDF(d2) / 100
    : -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;

  return {
    price: Math.max(0, price),
    delta,
    gamma,
    theta,
    vega,
    rho,
    impliedVolatility: sigma,
    probabilityITM,
  };
}

export function estimateIV(
  optionPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  type: 'call' | 'put'
): number {
  // Newton-Raphson IV estimation
  let sigma = 0.3;
  for (let i = 0; i < 100; i++) {
    const result = blackScholes({ S, K, T, r, sigma, type });
    const price = result.price;
    const vega = result.vega * 100; // restore from per-1%

    if (Math.abs(vega) < 1e-10) break;
    const diff = price - optionPrice;
    if (Math.abs(diff) < 0.001) break;
    sigma = sigma - diff / vega;
    sigma = Math.max(0.01, Math.min(5.0, sigma));
  }
  return sigma;
}
