/**
 * Statistical Engine for Lignoquim Efficacy Trials
 *
 * Implements: Descriptive Statistics, One-way ANOVA (DCA), Two-way ANOVA (DBCA),
 * Tukey HSD, Fisher LSD, Compact Letter Display, and economic analysis.
 * Suitable for agricultural field trials following INIA/FAO standards.
 */

import type {
  DescriptiveStat, AnovaResult, AnovaSource, MeanComparison,
  StatisticalAnalysis, Trial, PostHocMethod, SignificanceLevel
} from './types'

// ─── Mathematical Utilities ──────────────────────────────────────────────────

/** Lanczos approximation for ln(Gamma(z)), accurate to ~15 significant figures */
function lgamma(z: number): number {
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z)
  z -= 1
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x)
}

/** Regularized incomplete beta function I_x(a,b) via Lentz continued fraction */
function betaInc(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const lbeta = lgamma(a) + lgamma(b) - lgamma(a + b)
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta)

  function betacf(x: number, a: number, b: number): number {
    const MAXIT = 200, EPS = 3e-7, FPMIN = 1e-30
    const qab = a + b, qap = a + 1, qam = a - 1
    let c = 1, d = 1 - qab * x / qap
    if (Math.abs(d) < FPMIN) d = FPMIN
    d = 1 / d
    let h = d
    for (let m = 1; m <= MAXIT; m++) {
      const m2 = 2 * m
      let aa = m * (b - m) * x / ((qam + m2) * (a + m2))
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN
      d = 1 / d; h *= d * c
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN
      d = 1 / d
      const del = d * c; h *= del
      if (Math.abs(del - 1) < EPS) break
    }
    return h
  }

  if (x < (a + 1) / (a + b + 2)) return front * betacf(x, a, b) / a
  return 1 - front * betacf(1 - x, b, a) / b
}

/** P(F > f | df1, df2) — upper tail of F distribution */
export function fPValue(f: number, df1: number, df2: number): number {
  if (f <= 0) return 1
  return betaInc(df2 / (df2 + df1 * f), df2 / 2, df1 / 2)
}

/** P(T > |t| | df) — two-tailed t-distribution */
export function tPValue(t: number, df: number): number {
  return betaInc(df / (df + t * t), df / 2, 0.5)
}

/** t critical value at α/2 (two-tailed) via Newton's method on betaInc */
function tCritical(alpha: number, df: number): number {
  // Initial estimate from normal approximation
  const za = normalQuantile(1 - alpha / 2)
  let t = za * Math.sqrt(df / (df - 2))
  for (let i = 0; i < 50; i++) {
    const p = tPValue(t, df)
    const dp = 0.001
    const deriv = (tPValue(t + dp, df) - tPValue(t - dp, df)) / (2 * dp)
    const dt = (p - alpha) / deriv
    t -= dt
    if (Math.abs(dt) < 1e-8) break
  }
  return Math.abs(t)
}

/** Standard normal quantile (probit) via rational approximation (Beasley-Springer-Moro) */
function normalQuantile(p: number): number {
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637]
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833]
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209,
             0.0276438810333863, 0.0038405729373609, 0.0003951896511349,
             0.0000321767881768, 0.0000002888167364, 0.0000003960315187]
  const y = p - 0.5
  if (Math.abs(y) < 0.42) {
    const r = y * y
    return y * (((a[3]*r + a[2])*r + a[1])*r + a[0]) / ((((b[3]*r + b[2])*r + b[1])*r + b[0])*r + 1)
  }
  const r = p < 0.5 ? Math.log(-Math.log(p)) : Math.log(-Math.log(1 - p))
  let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] * Math.pow(r, i)
  return p < 0.5 ? -x : x
}

// ─── Studentized Range Critical Values (Tukey q, α=0.05) ─────────────────────
// Source: Pearson & Hartley (1966), Biometrika Tables for Statisticians
// Rows: dfError | Columns: k (number of treatments) 2..10

const TUKEY_Q_TABLE: { [dfE: number]: number[] } = {
  1:   [17.97, 26.98, 32.82, 37.08, 40.41, 43.12, 45.40, 47.36, 49.07],
  2:   [6.085, 8.331, 9.798, 10.88, 11.74, 12.44, 13.03, 13.54, 13.99],
  3:   [4.501, 5.910, 6.825, 7.502, 8.037, 8.478, 8.853, 9.177, 9.462],
  4:   [3.927, 5.040, 5.757, 6.287, 6.707, 7.053, 7.347, 7.602, 7.826],
  5:   [3.635, 4.602, 5.218, 5.673, 6.033, 6.330, 6.582, 6.802, 6.995],
  6:   [3.461, 4.339, 4.896, 5.305, 5.629, 5.895, 6.122, 6.319, 6.493],
  7:   [3.344, 4.165, 4.681, 5.060, 5.359, 5.606, 5.815, 5.998, 6.158],
  8:   [3.261, 4.041, 4.529, 4.886, 5.167, 5.399, 5.596, 5.767, 5.918],
  9:   [3.199, 3.949, 4.415, 4.756, 5.024, 5.244, 5.432, 5.595, 5.739],
  10:  [3.151, 3.877, 4.327, 4.654, 4.912, 5.124, 5.305, 5.461, 5.599],
  11:  [3.113, 3.820, 4.256, 4.574, 4.823, 5.028, 5.202, 5.353, 5.487],
  12:  [3.082, 3.773, 4.199, 4.508, 4.751, 4.950, 5.119, 5.265, 5.395],
  13:  [3.055, 3.735, 4.151, 4.453, 4.690, 4.885, 5.049, 5.192, 5.318],
  14:  [3.033, 3.702, 4.111, 4.407, 4.639, 4.829, 4.990, 5.131, 5.254],
  15:  [3.014, 3.674, 4.076, 4.367, 4.595, 4.782, 4.940, 5.077, 5.198],
  16:  [2.998, 3.649, 4.046, 4.333, 4.557, 4.741, 4.897, 5.031, 5.150],
  17:  [2.984, 3.628, 4.020, 4.303, 4.524, 4.705, 4.858, 4.991, 5.108],
  18:  [2.971, 3.609, 3.997, 4.277, 4.495, 4.673, 4.824, 4.956, 5.071],
  19:  [2.960, 3.593, 3.977, 4.253, 4.469, 4.645, 4.794, 4.924, 5.038],
  20:  [2.950, 3.578, 3.958, 4.232, 4.445, 4.620, 4.768, 4.895, 5.008],
  24:  [2.919, 3.532, 3.901, 4.166, 4.373, 4.541, 4.684, 4.807, 4.915],
  30:  [2.888, 3.486, 3.845, 4.102, 4.302, 4.464, 4.602, 4.720, 4.824],
  40:  [2.858, 3.442, 3.791, 4.039, 4.232, 4.389, 4.521, 4.635, 4.735],
  60:  [2.829, 3.399, 3.737, 3.977, 4.163, 4.314, 4.441, 4.550, 4.646],
  120: [2.800, 3.356, 3.685, 3.917, 4.096, 4.241, 4.363, 4.468, 4.560],
  1000:[2.772, 3.314, 3.633, 3.858, 4.030, 4.170, 4.286, 4.387, 4.474],
}

/** Interpolate Tukey q critical value for α=0.05 */
function getTukeyQ(k: number, dfError: number): number {
  const kClamped = Math.max(2, Math.min(10, k))
  const col = kClamped - 2
  const dfs = Object.keys(TUKEY_Q_TABLE).map(Number).sort((a, b) => a - b)
  if (dfError <= dfs[0]) return TUKEY_Q_TABLE[dfs[0]][col]
  if (dfError >= dfs[dfs.length - 1]) return TUKEY_Q_TABLE[dfs[dfs.length - 1]][col]
  let lo = dfs[0], hi = dfs[1]
  for (let i = 0; i < dfs.length - 1; i++) {
    if (dfError >= dfs[i] && dfError <= dfs[i + 1]) { lo = dfs[i]; hi = dfs[i + 1]; break }
  }
  const t = (dfError - lo) / (hi - lo)
  return TUKEY_Q_TABLE[lo][col] * (1 - t) + TUKEY_Q_TABLE[hi][col] * t
}

// ─── Descriptive Statistics ──────────────────────────────────────────────────

export function descriptiveStats(
  name: string,
  values: number[]
): DescriptiveStat {
  const n = values.length
  if (n === 0) return { tratamiento: name, n: 0, media: 0, mediana: 0, desviacionEstandar: 0, errorEstandar: 0, cv: 0, minimo: 0, maximo: 0, ic95Min: 0, ic95Max: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const media = values.reduce((s, v) => s + v, 0) / n
  const mediana = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)]
  const variance = n > 1 ? values.reduce((s, v) => s + (v - media) ** 2, 0) / (n - 1) : 0
  const sd = Math.sqrt(variance)
  const se = n > 1 ? sd / Math.sqrt(n) : 0
  const cv = media !== 0 ? (sd / Math.abs(media)) * 100 : 0
  const t = n > 1 ? tCritical(0.05, n - 1) : 0
  return {
    tratamiento: name,
    n,
    media: +media.toFixed(4),
    mediana: +mediana.toFixed(4),
    desviacionEstandar: +sd.toFixed(4),
    errorEstandar: +se.toFixed(4),
    cv: +cv.toFixed(2),
    minimo: sorted[0],
    maximo: sorted[n - 1],
    ic95Min: +(media - t * se).toFixed(4),
    ic95Max: +(media + t * se).toFixed(4),
  }
}

// ─── One-Way ANOVA (DCA — Diseño Completamente al Azar) ──────────────────────

export interface TreatmentData {
  id: string
  nombre: string
  valores: number[]
}

export function anovaDCA(treatments: TreatmentData[]): AnovaResult {
  const k = treatments.length
  const ns = treatments.map(t => t.valores.length)
  const N = ns.reduce((s, n) => s + n, 0)
  if (N < k + 2) return { fuentes: [], mediaGeneral: 0, cv: 0, msError: 0, dfError: 0, valido: false, mensaje: 'Datos insuficientes para ANOVA' }

  const allValues = treatments.flatMap(t => t.valores)
  const grandMean = allValues.reduce((s, v) => s + v, 0) / N
  const treatMeans = treatments.map(t => t.valores.reduce((s, v) => s + v, 0) / t.valores.length)

  // Sum of Squares
  const SCtotal = allValues.reduce((s, v) => s + (v - grandMean) ** 2, 0)
  const SCtreat = treatments.reduce((s, t, i) => s + t.valores.length * (treatMeans[i] - grandMean) ** 2, 0)
  const SCerror = SCtotal - SCtreat

  const dfTreat = k - 1
  const dfError = N - k
  const dfTotal = N - 1

  const CMtreat = SCtreat / dfTreat
  const CMerror = SCerror / dfError
  const F = CMerror > 0 ? CMtreat / CMerror : 0
  const pVal = CMerror > 0 ? fPValue(F, dfTreat, dfError) : 1

  // F tabulated at α=0.05
  const Ftab05 = getFTabulated(dfTreat, dfError, 0.05)
  const cv = grandMean !== 0 ? (Math.sqrt(CMerror) / Math.abs(grandMean)) * 100 : 0

  const sig = pVal < 0.001 ? '***' : pVal < 0.01 ? '**' : pVal < 0.05 ? '*' : 'ns'

  const fuentes: AnovaSource[] = [
    { fuente: 'Tratamientos', gl: dfTreat, sc: +SCtreat.toFixed(4), cm: +CMtreat.toFixed(4), fcalculado: +F.toFixed(3), ftabulado: +Ftab05.toFixed(3), pValor: +pVal.toFixed(4), significancia: sig },
    { fuente: 'Error experimental', gl: dfError, sc: +SCerror.toFixed(4), cm: +CMerror.toFixed(4), fcalculado: null, ftabulado: null, pValor: null, significancia: '' },
    { fuente: 'Total', gl: dfTotal, sc: +SCtotal.toFixed(4), cm: null as unknown as number, fcalculado: null, ftabulado: null, pValor: null, significancia: '' },
  ]

  return { fuentes, mediaGeneral: +grandMean.toFixed(4), cv: +cv.toFixed(2), msError: CMerror, dfError, valido: true }
}

// ─── Two-Way ANOVA (DBCA — Diseño de Bloques Completos al Azar) ──────────────

export interface BlockData {
  treatmentId: string
  nombre: string
  bloque: number
  valor: number
}

export function anovaDBCA(data: BlockData[]): AnovaResult {
  const treatmentNames = Array.from(new Set(data.map(d => d.nombre)))
  const blocks = Array.from(new Set(data.map(d => d.bloque))).sort((a, b) => a - b)
  const k = treatmentNames.length
  const r = blocks.length
  const N = k * r

  if (data.length < N || k < 2 || r < 2) {
    return { fuentes: [], mediaGeneral: 0, cv: 0, msError: 0, dfError: 0, valido: false, mensaje: 'Datos incompletos para DBCA (requiere datos balanceados)' }
  }

  const grandMean = data.reduce((s, d) => s + d.valor, 0) / N

  // Treatment means
  const treatMeans = treatmentNames.map(t =>
    data.filter(d => d.nombre === t).reduce((s, d) => s + d.valor, 0) / r
  )

  // Block means
  const blockMeans = blocks.map(b =>
    data.filter(d => d.bloque === b).reduce((s, d) => s + d.valor, 0) / k
  )

  const SCtotal = data.reduce((s, d) => s + (d.valor - grandMean) ** 2, 0)
  const SCtreat = r * treatMeans.reduce((s, m) => s + (m - grandMean) ** 2, 0)
  const SCblock = k * blockMeans.reduce((s, m) => s + (m - grandMean) ** 2, 0)
  const SCerror = SCtotal - SCtreat - SCblock

  const dfTreat = k - 1
  const dfBlock = r - 1
  const dfError = (k - 1) * (r - 1)
  const dfTotal = N - 1

  const CMtreat = SCtreat / dfTreat
  const CMblock = SCblock / dfBlock
  const CMerror = SCerror > 0 ? SCerror / dfError : 0.0001

  const Ftreat = CMtreat / CMerror
  const Fblock = CMblock / CMerror
  const pTreat = fPValue(Ftreat, dfTreat, dfError)
  const pBlock = fPValue(Fblock, dfBlock, dfError)

  const Ftab05_treat = getFTabulated(dfTreat, dfError, 0.05)
  const Ftab05_block = getFTabulated(dfBlock, dfError, 0.05)
  const cv = grandMean !== 0 ? (Math.sqrt(CMerror) / Math.abs(grandMean)) * 100 : 0

  const sigT = pTreat < 0.001 ? '***' : pTreat < 0.01 ? '**' : pTreat < 0.05 ? '*' : 'ns'
  const sigB = pBlock < 0.001 ? '***' : pBlock < 0.01 ? '**' : pBlock < 0.05 ? '*' : 'ns'

  const fuentes: AnovaSource[] = [
    { fuente: 'Bloques', gl: dfBlock, sc: +SCblock.toFixed(4), cm: +CMblock.toFixed(4), fcalculado: +Fblock.toFixed(3), ftabulado: +Ftab05_block.toFixed(3), pValor: +pBlock.toFixed(4), significancia: sigB },
    { fuente: 'Tratamientos', gl: dfTreat, sc: +SCtreat.toFixed(4), cm: +CMtreat.toFixed(4), fcalculado: +Ftreat.toFixed(3), ftabulado: +Ftab05_treat.toFixed(3), pValor: +pTreat.toFixed(4), significancia: sigT },
    { fuente: 'Error experimental', gl: dfError, sc: +SCerror.toFixed(4), cm: +CMerror.toFixed(4), fcalculado: null, ftabulado: null, pValor: null, significancia: '' },
    { fuente: 'Total', gl: dfTotal, sc: +SCtotal.toFixed(4), cm: null as unknown as number, fcalculado: null, ftabulado: null, pValor: null, significancia: '' },
  ]

  return { fuentes, mediaGeneral: +grandMean.toFixed(4), cv: +cv.toFixed(2), msError: CMerror, dfError, valido: true }
}

/** F critical value approximation at α using Wilson-Hilferty transformation */
function getFTabulated(df1: number, df2: number, alpha: number): number {
  // Binary search on fPValue
  let lo = 0.01, hi = 1000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    fPValue(mid, df1, df2) > alpha ? lo = mid : hi = mid
  }
  return (lo + hi) / 2
}

// ─── Tukey HSD Post-hoc Test ─────────────────────────────────────────────────

export function tukeyHSD(
  treatments: TreatmentData[],
  msError: number,
  dfError: number,
  r: number
): { hsd: number; comparisons: { i: number; j: number; sig: boolean }[] } {
  const k = treatments.length
  const q = getTukeyQ(k, dfError)
  const hsd = q * Math.sqrt(msError / r)
  const means = treatments.map(t => t.valores.reduce((s, v) => s + v, 0) / t.valores.length)
  const comparisons: { i: number; j: number; sig: boolean }[] = []
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      comparisons.push({ i, j, sig: Math.abs(means[i] - means[j]) > hsd })
    }
  }
  return { hsd: +hsd.toFixed(4), comparisons }
}

// ─── Fisher LSD Post-hoc Test ─────────────────────────────────────────────────

export function fisherLSD(
  treatments: TreatmentData[],
  msError: number,
  dfError: number,
  r: number
): { lsd: number; comparisons: { i: number; j: number; sig: boolean }[] } {
  const t = tCritical(0.05, dfError)
  const lsd = t * Math.sqrt(2 * msError / r)
  const means = treatments.map(t => t.valores.reduce((s, v) => s + v, 0) / t.valores.length)
  const comparisons: { i: number; j: number; sig: boolean }[] = []
  for (let i = 0; i < treatments.length; i++) {
    for (let j = i + 1; j < treatments.length; j++) {
      comparisons.push({ i, j, sig: Math.abs(means[i] - means[j]) > lsd })
    }
  }
  return { lsd: +lsd.toFixed(4), comparisons }
}

// ─── Compact Letter Display ───────────────────────────────────────────────────
// Standard sweep algorithm: assigns minimal letter groups such that two
// treatments sharing a letter are NOT significantly different.

export function compactLetterDisplay(
  means: number[],
  isSignificant: (i: number, j: number) => boolean
): string[] {
  const k = means.length
  const order = Array.from({ length: k }, (_, i) => i).sort((a, b) => means[b] - means[a])
  const letters: string[] = Array(k).fill('')
  let lIdx = 0

  for (let si = 0; si < k; si++) {
    const startTrt = order[si]
    const L = String.fromCharCode(97 + lIdx)

    // Extend group: from startTrt downward, as long as NOT sig diff from startTrt
    letters[startTrt] += L
    for (let sj = si + 1; sj < k; sj++) {
      if (!isSignificant(startTrt, order[sj])) {
        letters[order[sj]] += L
      } else {
        break
      }
    }

    // Advance only if next treatment is significantly different from current start
    if (si + 1 < k && isSignificant(startTrt, order[si + 1])) {
      lIdx++
    } else if (si + 1 < k && letters[order[si + 1]] !== '') {
      // Already assigned — check if we need a new letter
      const nextAlreadySigFromLast = si + 2 < k && isSignificant(order[si + 1], order[si + 2])
      if (nextAlreadySigFromLast) lIdx++
    } else {
      lIdx++
    }
  }

  return letters
}

// ─── Full Mean Comparison ─────────────────────────────────────────────────────

export function computeMeanComparisons(
  treatments: TreatmentData[],
  anova: AnovaResult,
  method: PostHocMethod,
  controlId?: string
): MeanComparison[] {
  const r = treatments[0]?.valores.length ?? 1
  const k = treatments.length

  let sigMatrix: boolean[][]
  let critValue: number

  if (method === 'tukey') {
    const { comparisons, hsd } = tukeyHSD(treatments, anova.msError, anova.dfError, r)
    critValue = hsd
    sigMatrix = Array.from({ length: k }, () => Array(k).fill(false))
    comparisons.forEach(({ i, j, sig }) => { sigMatrix[i][j] = sig; sigMatrix[j][i] = sig })
  } else {
    const { comparisons, lsd } = fisherLSD(treatments, anova.msError, anova.dfError, r)
    critValue = lsd
    sigMatrix = Array.from({ length: k }, () => Array(k).fill(false))
    comparisons.forEach(({ i, j, sig }) => { sigMatrix[i][j] = sig; sigMatrix[j][i] = sig })
  }

  const means = treatments.map(t => t.valores.reduce((s, v) => s + v, 0) / t.valores.length)
  const ses = treatments.map(t => {
    const n = t.valores.length
    const m = means[treatments.indexOf(t)]
    const sd = Math.sqrt(t.valores.reduce((s, v) => s + (v - m) ** 2, 0) / (n - 1 || 1))
    return sd / Math.sqrt(n)
  })

  const letterArr = compactLetterDisplay(means, (i, j) => sigMatrix[i][j])

  const controlIdx = controlId ? treatments.findIndex(t => t.id === controlId) : -1
  const controlMean = controlIdx >= 0 ? means[controlIdx] : means[Math.min(...means.map((m, i) => i))]

  return treatments
    .map((t, i): MeanComparison => ({
      tratamiento: t.nombre,
      media: +means[i].toFixed(4),
      error_estandar: +ses[i].toFixed(4),
      letras: letterArr[i] || 'a',
      diferenciaPctVsControl: controlMean !== 0 ? +((means[i] - controlMean) / Math.abs(controlMean) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.media - a.media)
}

// ─── Auto-interpretation ──────────────────────────────────────────────────────

export function generateInterpretation(
  anova: AnovaResult,
  comparisons: MeanComparison[],
  variableName: string,
  method: PostHocMethod
): string[] {
  const msgs: string[] = []
  const treatSource = anova.fuentes.find(f => f.fuente === 'Tratamientos')
  if (!treatSource) return msgs

  // CV assessment
  const cvLabel = anova.cv <= 10 ? 'excelente' : anova.cv <= 15 ? 'bueno' : anova.cv <= 20 ? 'aceptable' : 'elevado'
  msgs.push(`El coeficiente de variación (CV = ${anova.cv.toFixed(1)}%) es ${cvLabel}, lo que indica ${anova.cv <= 20 ? 'adecuada' : 'baja'} precisión experimental.`)

  // ANOVA result
  if (treatSource.pValor !== null) {
    if (treatSource.pValor < 0.001) {
      msgs.push(`El análisis de varianza revela diferencias muy altamente significativas entre tratamientos para ${variableName} (F=${treatSource.fcalculado}, p<0.001 ***), lo que indica que al menos un tratamiento produce un efecto diferencial altamente confiable.`)
    } else if (treatSource.pValor < 0.01) {
      msgs.push(`El análisis de varianza revela diferencias altamente significativas entre tratamientos para ${variableName} (F=${treatSource.fcalculado}, p<0.01 **).`)
    } else if (treatSource.pValor < 0.05) {
      msgs.push(`El análisis de varianza revela diferencias significativas entre tratamientos para ${variableName} (F=${treatSource.fcalculado}, p<0.05 *).`)
    } else {
      msgs.push(`El análisis de varianza no detecta diferencias estadísticamente significativas entre tratamientos para ${variableName} (F=${treatSource.fcalculado}, p=${treatSource.pValor?.toFixed(3)} ns). Esto puede deberse a alta variabilidad experimental o efecto real del producto insuficiente.`)
    }
  }

  // Best treatment
  const best = comparisons[0]
  const worst = comparisons[comparisons.length - 1]
  msgs.push(`El tratamiento de mayor rendimiento para ${variableName} fue "${best.tratamiento}" con media de ${best.media} (letras: ${best.letras}).`)

  // Control comparison
  const hasPositive = comparisons.filter(c => (c.diferenciaPctVsControl ?? 0) > 0)
  if (hasPositive.length > 0) {
    const maxBenefit = hasPositive.reduce((best, c) => (c.diferenciaPctVsControl ?? 0) > (best.diferenciaPctVsControl ?? 0) ? c : best)
    msgs.push(`El mayor incremento respecto al testigo fue de ${maxBenefit.diferenciaPctVsControl}% con el tratamiento "${maxBenefit.tratamiento}".`)
  }

  // Method note
  const methodLabel = method === 'tukey' ? 'Tukey HSD (α=0.05)' : 'LSD de Fisher (α=0.05)'
  msgs.push(`La prueba de comparación de medias empleada fue ${methodLabel}. Tratamientos seguidos de la misma letra no difieren estadísticamente.`)

  return msgs
}

// ─── Full Analysis Pipeline ───────────────────────────────────────────────────

export function runAnalysis(
  trial: Trial,
  variableId: string,
  evaluacionId: string,
  method: PostHocMethod,
  alfa: SignificanceLevel = 0.05
): StatisticalAnalysis {
  const obs = trial.observaciones.filter(
    o => o.variableId === variableId && o.evaluacionId === evaluacionId && o.valor !== null
  )

  // Build treatment data per design
  const treatmentMap = new Map<string, TreatmentData>()
  for (const t of trial.tratamientos) {
    treatmentMap.set(t.id, { id: t.id, nombre: t.codigo + ' - ' + t.nombre, valores: [] })
  }
  for (const o of obs) {
    treatmentMap.get(o.tratamientoId)?.valores.push(o.valor as number)
  }
  const treatmentData = trial.tratamientos
    .map(t => treatmentMap.get(t.id)!)
    .filter(t => t.valores.length > 0)

  // Descriptive stats
  const estadisticosDescriptivos = treatmentData.map(t =>
    descriptiveStats(t.nombre, t.valores)
  )

  // ANOVA
  let anova: AnovaResult
  if (trial.diseno.tipo === 'DBCA') {
    const blockData: BlockData[] = []
    for (const o of obs) {
      const t = trial.tratamientos.find(t => t.id === o.tratamientoId)
      if (t) blockData.push({ treatmentId: t.id, nombre: t.codigo + ' - ' + t.nombre, bloque: o.bloque ?? o.repeticion, valor: o.valor as number })
    }
    anova = anovaDBCA(blockData)
  } else {
    anova = anovaDCA(treatmentData)
  }

  // Post-hoc comparisons
  const controlTrt = trial.tratamientos.find(t => t.tipo === 'testigo_absoluto')
  const comparacionMedias = anova.valido
    ? computeMeanComparisons(treatmentData, anova, method, controlTrt?.id)
    : treatmentData.map(t => ({
        tratamiento: t.nombre,
        media: t.valores.reduce((s, v) => s + v, 0) / (t.valores.length || 1),
        error_estandar: 0,
        letras: 'n/a',
        diferenciaPctVsControl: 0,
      }))

  const interpretacion = generateInterpretation(anova, comparacionMedias, trial.variables.find(v => v.id === variableId)?.nombre ?? variableId, method)

  return {
    trialId: trial.id,
    variableId,
    evaluacionId,
    metodo: method,
    alfa,
    estadisticosDescriptivos,
    anova,
    comparacionMedias,
    interpretacion,
    ejecutadoEn: new Date().toISOString(),
  }
}
