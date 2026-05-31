'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import { getTrialById, saveTrial } from '@/lib/storage'
import type { Trial, Observation, Variable, Evaluation, Treatment } from '@/lib/types'
import { v4 as uuid } from 'uuid'

export default function DataEntryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trial, setTrial] = useState<Trial | null>(null)
  const [selectedEval, setSelectedEval] = useState<string>('')
  const [selectedVar, setSelectedVar] = useState<string>('')
  const [pending, setPending] = useState<Record<string, string>>({}) // key: `${treatId}_${rep}` => value
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const t = getTrialById(id)
    if (!t) { router.push('/ensayos'); return }
    setTrial(t)
    setSelectedEval(t.evaluaciones[0]?.id ?? '')
    setSelectedVar(t.variables.find(v => v.esPrincipal)?.id ?? t.variables[0]?.id ?? '')
  }, [id])

  if (!trial) return <div className="p-8 text-gray-500">Cargando...</div>

  const variable = trial.variables.find(v => v.id === selectedVar)
  const evaluation = trial.evaluaciones.find(e => e.id === selectedEval)
  const reps = Array.from({ length: trial.diseno.numRepeticiones }, (_, i) => i + 1)

  function cellKey(treatId: string, rep: number) { return `${treatId}_${rep}` }

  function getExistingValue(treatId: string, rep: number): number | null {
    const obs = trial!.observaciones.find(o =>
      o.evaluacionId === selectedEval && o.variableId === selectedVar && o.tratamientoId === treatId && o.repeticion === rep
    )
    return obs?.valor ?? null
  }

  function getCellValue(treatId: string, rep: number): string {
    const k = cellKey(treatId, rep)
    if (k in pending) return pending[k]
    const v = getExistingValue(treatId, rep)
    return v !== null ? String(v) : ''
  }

  function setCellValue(treatId: string, rep: number, value: string) {
    setPending(p => ({ ...p, [cellKey(treatId, rep)]: value }))
  }

  function handleSave() {
    if (!trial) return
    const updatedObs = [...trial.observaciones.filter(o =>
      !(o.evaluacionId === selectedEval && o.variableId === selectedVar)
    )]

    for (const t of trial.tratamientos) {
      for (const rep of reps) {
        const rawVal = getCellValue(t.id, rep)
        const val = rawVal === '' ? null : parseFloat(rawVal)
        if (rawVal === '') {
          const existing = getExistingValue(t.id, rep)
          if (existing !== null) continue
        }
        const obs: Observation = {
          id: uuid(),
          evaluacionId: selectedEval,
          tratamientoId: t.id,
          repeticion: rep,
          bloque: rep,
          variableId: selectedVar,
          valor: val,
          creadoEn: new Date().toISOString(),
        }
        updatedObs.push(obs)
      }
    }

    const updated: Trial = { ...trial, observaciones: updatedObs, actualizadoEn: new Date().toISOString() }
    if (updated.estado === 'configuracion') updated.estado = 'activo'
    saveTrial(updated)
    setTrial(updated)
    setPending({})
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalFilledForCurrent = trial.tratamientos.reduce((count, t) =>
    count + reps.filter(r => getCellValue(t.id, r) !== '').length, 0
  )
  const totalCells = trial.tratamientos.length * reps.length
  const pct = Math.round((totalFilledForCurrent / totalCells) * 100)

  // Calculate row stats for preview
  function rowStats(tratId: string) {
    const vals = reps.map(r => parseFloat(getCellValue(tratId, r))).filter(v => !isNaN(v))
    if (vals.length === 0) return null
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length
    const sd = vals.length > 1 ? Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1)) : 0
    return { mean: mean.toFixed(3), sd: sd.toFixed(3), n: vals.length }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/ensayos/${id}`} className="text-lq-muted hover:text-lq-primary"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-lq-primary">Ingreso de Datos</h1>
          <p className="text-sm text-lq-muted font-mono">{trial.codigo} — {trial.cultivo.cultivo}</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-lq-border mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Evaluación / Fecha de muestreo</label>
          <select value={selectedEval} onChange={e => setSelectedEval(e.target.value)} className="form-input">
            {trial.evaluaciones.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.nombre}{ev.fecha ? ` — ${new Date(ev.fecha).toLocaleDateString('es-PE')}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Variable a medir</label>
          <select value={selectedVar} onChange={e => setSelectedVar(e.target.value)} className="form-input">
            {trial.variables.map(v => (
              <option key={v.id} value={v.id}>{v.nombre} ({v.unidad})</option>
            ))}
          </select>
        </div>
        {variable && (
          <div className="px-3 py-2 bg-lq-bg rounded-lg border border-lq-border text-sm">
            <span className="text-lq-muted text-xs">Unidad: </span>
            <span className="font-mono font-bold text-lq-primary">{variable.unidad}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="bg-lq-secondary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm text-gray-600 w-20 text-right">{totalFilledForCurrent}/{totalCells} ingresados</span>
      </div>

      {/* Data Entry Grid */}
      {variable && evaluation && (
        <div className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden mb-5">
          <div className="px-5 py-3 bg-lq-primary text-white text-sm font-semibold flex items-center justify-between">
            <span>{evaluation.nombre} — {variable.nombre} ({variable.unidad})</span>
            <span className="text-green-300 text-xs">{trial.diseno.tipo}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-lq-bg">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-lq-primary border-b border-lq-border w-64">
                    Tratamiento
                  </th>
                  {reps.map(r => (
                    <th key={r} className="px-3 py-3 text-center text-sm font-semibold text-lq-primary border-b border-lq-border">
                      {trial.diseno.tipo === 'DBCA' ? `Bloque ${r}` : `Rep. ${r}`}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-500 border-b border-lq-border">Media</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-500 border-b border-lq-border">D.E.</th>
                </tr>
              </thead>
              <tbody>
                {trial.tratamientos.map((t, tIdx) => {
                  const stats = rowStats(t.id)
                  return (
                    <tr key={t.id} className={tIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 border-b border-lq-border">
                        <div>
                          <span className="font-mono text-xs font-bold text-lq-secondary mr-2">{t.codigo}</span>
                          <span className="text-sm text-gray-800 truncate">{t.nombre}</span>
                        </div>
                        {t.tipo === 'testigo_absoluto' && (
                          <span className="text-xs text-gray-400">Testigo</span>
                        )}
                      </td>
                      {reps.map(r => {
                        const val = getCellValue(t.id, r)
                        const hasExisting = getExistingValue(t.id, r) !== null
                        const inPending = cellKey(t.id, r) in pending
                        return (
                          <td key={r} className="px-2 py-2 border-b border-lq-border">
                            <input
                              type="number"
                              step="any"
                              value={val}
                              onChange={e => setCellValue(t.id, r, e.target.value)}
                              placeholder="—"
                              className={`w-full text-center border rounded-md py-1.5 px-2 text-sm font-mono transition focus:outline-none focus:ring-2 focus:ring-lq-secondary ${
                                inPending ? 'border-yellow-400 bg-yellow-50' :
                                hasExisting ? 'border-green-200 bg-green-50' :
                                'border-gray-200 bg-white'
                              }`}
                            />
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 border-b border-lq-border text-center text-sm font-mono font-semibold text-lq-primary">
                        {stats?.mean ?? '—'}
                      </td>
                      <td className="px-3 py-2 border-b border-lq-border text-center text-xs font-mono text-gray-500">
                        {stats ? `±${stats.sd}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Validation hints */}
      {variable?.valorEsperadoMin !== undefined && variable?.valorEsperadoMax !== undefined && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <AlertCircle size={15} />
          Rango esperado para {variable.nombre}: {variable.valorEsperadoMin} – {variable.valorEsperadoMax} {variable.unidad}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={Object.keys(pending).length === 0}
          className="flex items-center gap-2 bg-lq-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-lq-primary-light disabled:opacity-40 transition shadow"
        >
          <Save size={16} /> Guardar datos
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
            <CheckCircle size={16} /> Datos guardados correctamente
          </div>
        )}

        {Object.keys(pending).length > 0 && !saved && (
          <span className="text-yellow-600 text-sm">{Object.keys(pending).length} celda(s) sin guardar</span>
        )}

        <div className="flex-1" />

        <Link href={`/ensayos/${id}/analisis`} className="flex items-center gap-2 border border-lq-secondary text-lq-secondary px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-50">
          <BarChart3 size={15} /> Ir a análisis estadístico →
        </Link>
      </div>

      {/* Quick guide */}
      <div className="mt-6 p-4 bg-lq-bg rounded-xl border border-lq-border text-xs text-gray-500">
        <p className="font-semibold text-gray-700 mb-1">Guía de ingreso de datos:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Ingrese el valor medido para cada parcela (tratamiento × repetición/bloque)</li>
          <li>Celdas en <span className="text-yellow-600 font-semibold">amarillo</span> = modificadas sin guardar · celdas en <span className="text-green-600 font-semibold">verde</span> = ya guardadas</li>
          <li>Para {trial.diseno.tipo === 'DBCA' ? 'DBCA: cada columna corresponde a un bloque (variabilidad controlada)' : 'DCA: cada columna es una repetición independiente'}</li>
          <li>Se calcula media y desviación estándar por fila automáticamente (previsualización)</li>
          <li>Guarde antes de cambiar de variable o evaluación para no perder datos</li>
        </ul>
      </div>
    </div>
  )
}
