'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, BarChart3, Leaf, MapPin, Filter } from 'lucide-react'
import { loadTrials, exportTrialsJSON, importTrialsJSON } from '@/lib/storage'
import { loadPhotosByTrial } from '@/lib/photo-storage'
import type { Trial } from '@/lib/types'
import Link from 'next/link'

export default function InformesPage() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [exportMsg, setExportMsg] = useState('')

  useEffect(() => { setTrials(loadTrials()) }, [])

  const completed = trials.filter(t => ['analisis', 'completado'].includes(t.estado))
  const active = trials.filter(t => t.estado === 'activo')

  const handleExportJSON = () => {
    const json = exportTrialsJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lignoquin_ensayos_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMsg('Datos exportados correctamente.')
    setTimeout(() => setExportMsg(''), 3000)
  }

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = importTrialsJSON(ev.target?.result as string)
      if (ok) { setTrials(loadTrials()); setExportMsg('Datos importados correctamente.') }
      else setExportMsg('Error: archivo JSON inválido.')
      setTimeout(() => setExportMsg(''), 3000)
    }
    reader.readAsText(file)
  }

  const handlePDF = async (trial: Trial) => {
    const { runAnalysis } = await import('@/lib/statistics')
    const { generatePDFReport } = await import('@/lib/pdf-report')
    const varMain = trial.variables.find(v => v.esPrincipal)
    const evalFirst = trial.evaluaciones[0]
    if (!varMain || !evalFirst) { alert('El ensayo no tiene variables principales o evaluaciones configuradas.'); return }
    const result = runAnalysis(trial, varMain.id, evalFirst.id, 'tukey')
    const photos = loadPhotosByTrial(trial.id)
    await generatePDFReport({
      trial,
      analysis: result,
      variableName: varMain.nombre,
      includeCharts: true,
      includeEconomicAnalysis: true,
      photos,
      firmante: trial.ubicacion.responsable,
      cargo: 'Responsable Técnico',
    })
  }

  const TrialSummaryCard = ({ trial }: { trial: Trial }) => {
    const mainVar = trial.variables.find(v => v.esPrincipal)
    const obsCount = trial.observaciones.length

    return (
      <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-xs font-bold text-lq-secondary">{trial.codigo}</p>
            <h3 className="font-semibold text-lq-primary text-sm mt-0.5">{trial.titulo}</h3>
          </div>
          <span className={`badge text-xs ${trial.estado === 'completado' ? 'bg-gray-100 text-gray-600' : 'bg-purple-100 text-purple-700'}`}>
            {trial.estado}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
          <div className="flex items-center gap-1.5"><Leaf size={12} className="text-lq-secondary" /> {trial.cultivo.cultivo} — {trial.cultivo.variedad || 'N/E'}</div>
          <div className="flex items-center gap-1.5"><MapPin size={12} className="text-lq-secondary" /> {trial.ubicacion.region}</div>
          <div className="flex items-center gap-1.5"><BarChart3 size={12} className="text-lq-secondary" /> {trial.diseno.tipo} · {trial.diseno.numTratamientos}T × {trial.diseno.numRepeticiones}R</div>
          <div className="flex items-center gap-1.5"><Filter size={12} className="text-lq-secondary" /> {obsCount} observaciones</div>
        </div>

        <div className="flex gap-2">
          <Link href={`/ensayos/${trial.id}/analisis`} className="flex-1 flex items-center justify-center gap-1.5 border border-lq-secondary text-lq-secondary py-2 rounded-lg text-xs font-medium hover:bg-green-50">
            <BarChart3 size={13} /> Ver análisis
          </Link>
          <button
            onClick={() => handlePDF(trial)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-lq-primary text-white py-2 rounded-lg text-xs font-medium hover:bg-lq-primary-light"
          >
            <Download size={13} /> PDF
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-lq-primary flex items-center gap-2"><FileText size={22} /> Informes y Reportes</h1>
          <p className="text-sm text-lq-muted mt-1">Genere informes técnicos en PDF con análisis estadístico completo</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportJSON} className="flex items-center gap-2 border border-lq-border text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Download size={14} /> Exportar datos (JSON)
          </button>
          <label className="flex items-center gap-2 border border-lq-border text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
            <FileText size={14} /> Importar datos
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {exportMsg && (
        <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{exportMsg}</div>
      )}

      {/* Completed trials */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-lq-primary mb-4 flex items-center gap-2">
          <BarChart3 size={18} /> Ensayos con análisis disponible ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-lq-border text-gray-400">
            <FileText size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No hay ensayos en estado de análisis o completados aún.</p>
            <p className="text-xs mt-1">Ingrese datos y avance el estado del ensayo a "En análisis" para generar informes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map(t => <TrialSummaryCard key={t.id} trial={t} />)}
          </div>
        )}
      </div>

      {/* Active trials */}
      {active.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-lq-primary mb-4 flex items-center gap-2">
            <Leaf size={18} /> Ensayos activos ({active.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(t => <TrialSummaryCard key={t.id} trial={t} />)}
          </div>
        </div>
      )}

      {/* Info about reports */}
      <div className="mt-10 bg-white rounded-xl p-6 border border-lq-border shadow-sm">
        <h3 className="font-semibold text-lq-primary mb-3">¿Qué incluye el informe PDF?</h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          {[
            'Portada con datos del ensayo, código y responsable',
            'Estadísticos descriptivos: media, D.E., E.E., CV%, IC 95%',
            'Tabla de ANOVA con F calculado, F tabulado y P-valor',
            'Comparación de medias con letras (Tukey HSD / LSD)',
            '% de incremento/reducción vs. testigo absoluto',
            'Detalle completo de tratamientos y dosis',
            'Interpretación estadística automatizada',
            'Evaluación de validez del ensayo (CV, significancia)',
          ].map(item => (
            <div key={item} className="flex items-start gap-2">
              <span className="text-lq-secondary font-bold mt-0.5">✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-lq-bg rounded-lg text-xs text-gray-500 border border-lq-border">
          <strong>Fundamento estadístico:</strong> Los análisis implementan ANOVA (DCA/DBCA), distribución F de Snedecor para valores de P, prueba de Tukey HSD con tabla de rangos estudentizados (Pearson & Hartley), y prueba LSD de Fisher. El umbral de CV sigue las recomendaciones INIA/CIMMYT para ensayos de campo en Perú.
        </div>
      </div>
    </div>
  )
}
