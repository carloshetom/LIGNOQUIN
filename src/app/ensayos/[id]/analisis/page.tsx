'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, RefreshCw, Info, TrendingUp } from 'lucide-react'
import { getTrialById } from '@/lib/storage'
import { runAnalysis } from '@/lib/statistics'
import { cvCategory, SIGNIFICANCE_LABEL } from '@/lib/constants'
import { BarWithError } from '@/components/Charts'
import type { Trial, StatisticalAnalysis, PostHocMethod } from '@/lib/types'

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trial, setTrial] = useState<Trial | null>(null)
  const [selectedVar, setSelectedVar] = useState('')
  const [selectedEval, setSelectedEval] = useState('')
  const [method, setMethod] = useState<PostHocMethod>('tukey')
  const [result, setResult] = useState<StatisticalAnalysis | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = getTrialById(id)
    if (!t) { router.push('/ensayos'); return }
    setTrial(t)
    const v = t.variables.find(v => v.esPrincipal)?.id ?? t.variables[0]?.id ?? ''
    const e = t.evaluaciones[0]?.id ?? ''
    setSelectedVar(v)
    setSelectedEval(e)
  }, [id])

  const handleRun = () => {
    if (!trial || !selectedVar || !selectedEval) return
    setRunning(true)
    setError('')
    try {
      const obs = trial.observaciones.filter(o => o.evaluacionId === selectedEval && o.variableId === selectedVar && o.valor !== null)
      if (obs.length < 4) {
        setError('Datos insuficientes. Se requieren al menos 2 tratamientos con 2 repeticiones cada uno.')
        setRunning(false)
        return
      }
      const r = runAnalysis(trial, selectedVar, selectedEval, method)
      setResult(r)
    } catch (e) {
      setError('Error durante el análisis: ' + String(e))
    }
    setRunning(false)
  }

  const handlePDF = async () => {
    if (!trial || !result) return
    const variable = trial.variables.find(v => v.id === selectedVar)
    const { generatePDFReport } = await import('@/lib/pdf-report')
    await generatePDFReport({
      trial,
      analysis: result,
      variableName: variable?.nombre ?? selectedVar,
      includeCharts: true,
      includeEconomicAnalysis: true,
      firmante: trial.ubicacion.responsable,
      cargo: 'Responsable Técnico',
    })
  }

  if (!trial) return <div className="p-8 text-gray-400">Cargando...</div>

  const treatSource = result?.anova.fuentes.find(f => f.fuente === 'Tratamientos')
  const blockSource = result?.anova.fuentes.find(f => f.fuente === 'Bloques')
  const cvCat = result ? cvCategory(result.anova.cv) : null
  const variable = trial.variables.find(v => v.id === selectedVar)

  const SigBadge = ({ sig }: { sig: string }) => {
    const cls = sig === 'ns' ? 'sig-ns' : sig === '*' ? 'sig-star' : sig === '**' ? 'sig-2star' : 'sig-3star'
    return <span className={`font-bold font-mono ${cls}`}>{sig}</span>
  }

  const chartData = result?.comparacionMedias.map(c => ({
    tratamiento: c.tratamiento,
    media: c.media,
    error_estandar: c.error_estandar,
    letras: c.letras,
    diferenciaPctVsControl: c.diferenciaPctVsControl,
  })) ?? []

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/ensayos/${id}`} className="text-lq-muted hover:text-lq-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-lq-primary">Análisis Estadístico</h1>
          <p className="text-sm text-lq-muted font-mono">{trial.codigo}</p>
        </div>
        {result && (
          <button onClick={handlePDF} className="flex items-center gap-2 bg-lq-accent text-lq-primary px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 shadow">
            <Download size={15} /> Descargar Informe PDF
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-lq-border mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Variable de respuesta</label>
          <select value={selectedVar} onChange={e => setSelectedVar(e.target.value)} className="form-input">
            {trial.variables.map(v => (
              <option key={v.id} value={v.id}>{v.nombre} ({v.unidad})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Evaluación</label>
          <select value={selectedEval} onChange={e => setSelectedEval(e.target.value)} className="form-input">
            {trial.evaluaciones.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prueba de comparación</label>
          <select value={method} onChange={e => setMethod(e.target.value as PostHocMethod)} className="form-input">
            <option value="tukey">Tukey HSD (α=0.05) — Recomendado</option>
            <option value="lsd">LSD de Fisher (α=0.05)</option>
          </select>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 bg-lq-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-lq-primary-light transition text-sm shadow"
        >
          <RefreshCw size={15} className={running ? 'animate-spin' : ''} />
          {running ? 'Procesando...' : 'Ejecutar Análisis'}
        </button>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <Info size={15} /> {error}
        </div>
      )}

      {!result && !error && (
        <div className="text-center py-20 text-gray-400">
          <TrendingUp size={52} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Configure los parámetros y ejecute el análisis para ver los resultados.</p>
          <p className="text-xs mt-1 text-gray-300">Asegúrese de haber ingresado datos en la sección de datos primero.</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* 1. Descriptive Statistics */}
          <section className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
            <div className="px-5 py-3 bg-lq-primary text-white flex items-center justify-between">
              <h2 className="font-semibold text-sm">1. Estadísticos Descriptivos — {variable?.nombre}</h2>
              <span className="text-green-300 text-xs">{variable?.unidad}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Tratamiento</th><th>n</th><th>Media</th><th>D.E.</th><th>E.E.</th>
                    <th>CV (%)</th><th>Mín.</th><th>Máx.</th><th>IC 95%</th>
                  </tr>
                </thead>
                <tbody>
                  {result.estadisticosDescriptivos.map(d => (
                    <tr key={d.tratamiento}>
                      <td className="font-medium text-sm">{d.tratamiento}</td>
                      <td className="text-center font-mono">{d.n}</td>
                      <td className="text-center font-mono font-bold text-lq-primary">{d.media.toFixed(3)}</td>
                      <td className="text-center font-mono">{d.desviacionEstandar.toFixed(3)}</td>
                      <td className="text-center font-mono">{d.errorEstandar.toFixed(3)}</td>
                      <td className={`text-center font-mono font-semibold ${d.cv <= 15 ? 'text-green-600' : d.cv <= 25 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {d.cv.toFixed(1)}
                      </td>
                      <td className="text-center font-mono text-gray-500">{d.minimo.toFixed(3)}</td>
                      <td className="text-center font-mono text-gray-500">{d.maximo.toFixed(3)}</td>
                      <td className="text-center text-xs font-mono text-gray-500">{d.ic95Min.toFixed(2)}–{d.ic95Max.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. ANOVA */}
          <section className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
            <div className="px-5 py-3 bg-lq-primary-light text-white">
              <h2 className="font-semibold text-sm">2. Análisis de Varianza (ANVA) — {trial.diseno.tipo}</h2>
            </div>
            {!result.anova.valido ? (
              <div className="p-5 text-red-500 text-sm">{result.anova.mensaje}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table w-full">
                    <thead>
                      <tr>
                        <th>Fuente de Variación</th><th>G.L.</th><th>S.C.</th><th>C.M.</th>
                        <th>F calculado</th><th>F tab. α=0.05</th><th>P-valor</th><th>Significancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.anova.fuentes.map(f => (
                        <tr key={f.fuente} className={f.fuente === 'Tratamientos' ? 'font-semibold' : ''}>
                          <td>{f.fuente}</td>
                          <td className="text-center font-mono">{f.gl}</td>
                          <td className="text-center font-mono">{f.sc.toFixed(4)}</td>
                          <td className="text-center font-mono">{f.cm !== null ? f.cm.toFixed(4) : '—'}</td>
                          <td className="text-center font-mono font-bold">{f.fcalculado !== null ? f.fcalculado.toFixed(3) : '—'}</td>
                          <td className="text-center font-mono text-gray-500">{f.ftabulado !== null ? f.ftabulado.toFixed(3) : '—'}</td>
                          <td className="text-center font-mono">{f.pValor !== null ? f.pValor.toFixed(4) : '—'}</td>
                          <td className="text-center"><SigBadge sig={f.significancia || '—'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-lq-bg border-t border-lq-border flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Media general:</span>
                    <span className="font-bold text-lq-primary ml-2">{result.anova.mediaGeneral.toFixed(3)} {variable?.unidad}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">CV:</span>
                    <span className={`font-bold ml-2 ${cvCat?.color}`}>{result.anova.cv.toFixed(2)}% — {cvCat?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">CM error:</span>
                    <span className="font-mono ml-2">{result.anova.msError.toFixed(4)}</span>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* 3. Mean Comparisons */}
          <section className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
            <div className="px-5 py-3 bg-lq-primary-light text-white flex items-center justify-between">
              <h2 className="font-semibold text-sm">3. Comparación de Medias — {method === 'tukey' ? 'Prueba de Tukey HSD' : 'LSD de Fisher'} (α=0.05)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Tratamiento</th>
                    <th>Media</th>
                    <th>E.E.</th>
                    <th>Significancia (letras)</th>
                    <th>% vs. Testigo</th>
                    <th>Diferencia absoluta vs. Testigo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparacionMedias.map((c, i) => {
                    const isControl = c.letras === result.comparacionMedias[result.comparacionMedias.length - 1]?.letras && (c.diferenciaPctVsControl === 0 || !c.diferenciaPctVsControl)
                    const pct = c.diferenciaPctVsControl ?? 0
                    const controlMean = result.comparacionMedias.find(x => (x.diferenciaPctVsControl ?? 0) === 0)?.media ?? result.comparacionMedias[result.comparacionMedias.length - 1]?.media ?? 0
                    const diff = c.media - controlMean
                    return (
                      <tr key={c.tratamiento} className={i === 0 ? 'bg-green-50' : ''}>
                        <td className={`font-medium text-sm ${i === 0 ? 'text-green-800' : ''}`}>{c.tratamiento}</td>
                        <td className="text-center font-mono font-bold text-lq-primary">{c.media.toFixed(3)}</td>
                        <td className="text-center font-mono text-gray-500">±{c.error_estandar.toFixed(3)}</td>
                        <td className="text-center">
                          <span className="font-mono font-bold text-lq-primary bg-green-100 px-3 py-0.5 rounded text-sm">{c.letras}</span>
                        </td>
                        <td className="text-center">
                          <span className={`font-semibold text-sm ${pct > 0 ? 'text-green-600' : pct < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {pct !== 0 ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}
                          </span>
                        </td>
                        <td className="text-center font-mono text-sm text-gray-600">
                          {diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(3)} ${variable?.unidad}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-2 bg-lq-bg border-t border-lq-border text-xs text-gray-500">
              Medias ordenadas de mayor a menor. Letras iguales indican que no existen diferencias estadísticas (p≥0.05). Letras distintas indican diferencias significativas.
            </div>
          </section>

          {/* 4. Chart */}
          {chartData.length > 0 && variable && (
            <section className="bg-white rounded-xl shadow-sm border border-lq-border p-6">
              <h2 className="font-semibold text-lq-primary mb-4 text-sm">4. Gráfico de Medias ± Error Estándar</h2>
              <BarWithError data={chartData} unidad={variable.unidad} titulo={`${variable.nombre} por Tratamiento — ${trial.cultivo.cultivo}`} />
            </section>
          )}

          {/* 5. Interpretation */}
          <section className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
            <div className="px-5 py-3 bg-lq-primary text-white">
              <h2 className="font-semibold text-sm">5. Interpretación y Conclusiones</h2>
            </div>
            <div className="p-5 space-y-3">
              {result.interpretacion.map((msg, i) => (
                <div key={i} className="flex gap-3 p-3 bg-lq-bg rounded-lg border border-lq-border">
                  <span className="text-lq-secondary font-bold text-sm flex-shrink-0">→</span>
                  <p className="text-sm text-gray-700">{msg}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. Significance legend */}
          <section className="bg-white rounded-xl shadow-sm border border-lq-border p-4">
            <h3 className="text-sm font-semibold text-lq-primary mb-3">Leyenda de Significancia Estadística</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SIGNIFICANCE_LABEL).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <SigBadge sig={k} />
                  <span className="text-gray-600">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-lq-border text-xs text-gray-500">
              <p><strong>CV ≤10%:</strong> Excelente · <strong>10–15%:</strong> Bueno · <strong>15–20%:</strong> Aceptable · <strong>20–30%:</strong> Precaución · <strong>&gt;30%:</strong> Inválido</p>
              <p className="mt-1">Los resultados se calculan utilizando distribución F (Snedecor), test de {method === 'tukey' ? 'Tukey (tabla de rangos estudentizados)' : 'LSD de Fisher (distribución t)'}, α = 0.05.</p>
            </div>
          </section>

          <div className="flex gap-3 justify-end">
            <button onClick={handlePDF} className="flex items-center gap-2 bg-lq-accent text-lq-primary px-6 py-2.5 rounded-lg font-bold hover:opacity-90 shadow">
              <Download size={16} /> Descargar Informe PDF Completo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
