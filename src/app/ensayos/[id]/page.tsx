'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, FlaskConical, BarChart3, Edit3, ArrowLeft, Leaf, Droplets, Ruler, ChevronRight, Camera } from 'lucide-react'
import { getTrialById, saveTrial } from '@/lib/storage'
import { loadPhotosByTrial } from '@/lib/photo-storage'
import type { Trial, TrialStatus } from '@/lib/types'

const STATUS_FLOW: TrialStatus[] = ['configuracion', 'activo', 'cosecha', 'analisis', 'completado']
const STATUS_LABELS: Record<TrialStatus, string> = { configuracion: 'Configuración', activo: 'Activo', cosecha: 'En cosecha', analisis: 'En análisis', completado: 'Completado' }
const STATUS_COLORS: Record<TrialStatus, string> = { configuracion: 'bg-blue-100 text-blue-700', activo: 'bg-green-100 text-green-700', cosecha: 'bg-yellow-100 text-yellow-700', analisis: 'bg-purple-100 text-purple-700', completado: 'bg-gray-100 text-gray-600' }

export default function TrialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trial, setTrial] = useState<Trial | null>(null)

  useEffect(() => {
    const t = getTrialById(id)
    if (!t) { router.push('/ensayos'); return }
    setTrial(t)
  }, [id])

  if (!trial) return <div className="p-8 text-gray-500">Cargando...</div>

  const obsCount = trial.observaciones.length
  const treatCount = trial.tratamientos.length
  const evalCount = trial.evaluaciones.length
  const photoCount = typeof window !== 'undefined' ? loadPhotosByTrial(trial.id).length : 0

  const advanceStatus = () => {
    const idx = STATUS_FLOW.indexOf(trial.estado)
    if (idx < STATUS_FLOW.length - 1) {
      const updated = { ...trial, estado: STATUS_FLOW[idx + 1], actualizadoEn: new Date().toISOString() }
      saveTrial(updated)
      setTrial(updated)
    }
  }

  const completeness = () => {
    const total = treatCount * trial.diseno.numRepeticiones * trial.variables.filter(v => v.esPrincipal).length * evalCount
    if (total === 0) return 0
    return Math.round((obsCount / total) * 100)
  }

  const InfoBlock = ({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) => (
    <div className="flex items-start gap-3 p-3 bg-lq-bg rounded-lg">
      <Icon size={16} className="text-lq-secondary mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-lq-muted">{label}</p>
        <p className="text-sm font-medium text-lq-text">{value || '—'}</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ensayos" className="text-lq-muted hover:text-lq-primary">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-lq-primary">{trial.titulo}</h1>
            <span className={`badge ${STATUS_COLORS[trial.estado]}`}>{STATUS_LABELS[trial.estado]}</span>
          </div>
          <p className="text-sm text-lq-muted mt-0.5 font-mono">{trial.codigo}</p>
        </div>
        {trial.estado !== 'completado' && (
          <button onClick={advanceStatus} className="flex items-center gap-1 text-xs bg-lq-secondary text-white px-3 py-2 rounded-lg hover:opacity-80">
            Avanzar estado <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { href: `/ensayos/${id}/datos`, label: 'Ingresar Datos', icon: Edit3, desc: `${obsCount} observaciones registradas`, color: 'bg-lq-primary hover:bg-lq-primary-light text-white' },
          { href: `/ensayos/${id}/fotos`, label: 'Fotografías', icon: Camera, desc: `${photoCount} foto(s) — antes/durante/después`, color: 'bg-blue-700 hover:bg-blue-800 text-white' },
          { href: `/ensayos/${id}/analisis`, label: 'Análisis Estadístico', icon: BarChart3, desc: 'ANOVA, Tukey, LSD, Comparación de medias', color: 'bg-lq-secondary hover:bg-green-600 text-white' },
          { href: `/informes`, label: 'Generar Informe PDF', icon: FlaskConical, desc: 'Reporte técnico con fotos', color: 'bg-lq-accent hover:opacity-90 text-lq-primary font-bold' },
        ].map(a => (
          <Link key={a.href} href={a.href} className={`p-5 rounded-xl flex items-center gap-4 shadow-sm transition ${a.color}`}>
            <a.icon size={28} />
            <div>
              <p className="font-semibold">{a.label}</p>
              <p className="text-xs opacity-80 mt-0.5">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Data completeness */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-lq-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-lq-primary">Completitud de datos</span>
          <span className="text-lg font-bold text-lq-secondary">{completeness()}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-2.5">
          <div className="bg-lq-secondary h-2.5 rounded-full transition-all" style={{ width: `${completeness()}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{obsCount} de {treatCount * trial.diseno.numRepeticiones * trial.variables.filter(v=>v.esPrincipal).length * evalCount} datos registrados</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Location */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
          <h2 className="font-semibold text-lq-primary mb-3 text-sm flex items-center gap-2"><MapPin size={14}/> Ubicación</h2>
          <div className="space-y-2">
            <InfoBlock icon={MapPin} label="Región / Provincia / Distrito" value={`${trial.ubicacion.region} / ${trial.ubicacion.provincia} / ${trial.ubicacion.distrito}`} />
            <InfoBlock icon={MapPin} label="Fundo" value={trial.ubicacion.fundo} />
            <InfoBlock icon={MapPin} label="Altitud" value={trial.ubicacion.altitud ? `${trial.ubicacion.altitud} msnm` : '—'} />
            <InfoBlock icon={Leaf} label="Tipo de suelo" value={trial.ubicacion.tipSuelo ?? '—'} />
          </div>
        </div>

        {/* Crop */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
          <h2 className="font-semibold text-lq-primary mb-3 text-sm flex items-center gap-2"><Leaf size={14}/> Cultivo</h2>
          <div className="space-y-2">
            <InfoBlock icon={Leaf} label="Cultivo / Variedad" value={`${trial.cultivo.cultivo} — ${trial.cultivo.variedad || '—'}`} />
            <InfoBlock icon={Calendar} label="Fecha de siembra" value={trial.cultivo.fechaSiembra || '—'} />
            <InfoBlock icon={Leaf} label="Etapa fenológica" value={trial.cultivo.etapaFenologica} />
            <InfoBlock icon={Droplets} label="Sistema de riego" value={trial.cultivo.sistemaRiego || '—'} />
          </div>
        </div>

        {/* Design */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
          <h2 className="font-semibold text-lq-primary mb-3 text-sm flex items-center gap-2"><Ruler size={14}/> Diseño Experimental</h2>
          <div className="space-y-2">
            <InfoBlock icon={FlaskConical} label="Tipo de diseño" value={trial.diseno.tipo === 'DBCA' ? 'DBCA — Bloques Completos al Azar' : 'DCA — Completamente al Azar'} />
            <InfoBlock icon={FlaskConical} label="Tratamientos × Repeticiones" value={`${treatCount} × ${trial.diseno.numRepeticiones}`} />
            <InfoBlock icon={Ruler} label="Tamaño de parcela" value={`${trial.diseno.tamanioParcela} ${trial.diseno.unidadArea}`} />
            <InfoBlock icon={Calendar} label="Evaluaciones programadas" value={String(evalCount)} />
          </div>
        </div>
      </div>

      {/* Treatments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-lq-border">
          <h2 className="font-semibold text-lq-primary text-sm">Tratamientos ({treatCount})</h2>
        </div>
        <table className="data-table w-full">
          <thead>
            <tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Producto</th><th>Dosis</th><th>Método</th></tr>
          </thead>
          <tbody>
            {trial.tratamientos.map(t => (
              <tr key={t.id}>
                <td className="font-mono font-bold text-lq-primary text-xs">{t.codigo}</td>
                <td className="text-sm">{t.nombre}</td>
                <td className="text-xs">{t.tipo.replace('_', ' ')}</td>
                <td className="text-xs">{t.producto || '—'}</td>
                <td className="text-xs font-mono">{t.dosis ? `${t.dosis} ${t.unidadDosis}` : '—'}</td>
                <td className="text-xs">{t.metodoAplicacion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Variables */}
      <div className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
        <div className="px-5 py-3 border-b border-lq-border">
          <h2 className="font-semibold text-lq-primary text-sm">Variables de Evaluación ({trial.variables.length})</h2>
        </div>
        <table className="data-table w-full">
          <thead>
            <tr><th>Variable</th><th>Unidad</th><th>Tipo</th><th>Principal</th></tr>
          </thead>
          <tbody>
            {trial.variables.map(v => (
              <tr key={v.id}>
                <td className="font-medium text-sm">{v.nombre}</td>
                <td className="font-mono text-xs">{v.unidad}</td>
                <td><span className={`badge text-xs ${v.tipo === 'rendimiento' ? 'bg-green-100 text-green-700' : v.tipo === 'calidad' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{v.tipo}</span></td>
                <td className="text-center">{v.esPrincipal ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
