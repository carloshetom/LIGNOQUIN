'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Trash2, ExternalLink, Search, FlaskConical, Filter } from 'lucide-react'
import { loadTrials, deleteTrial } from '@/lib/storage'
import type { Trial, TrialStatus } from '@/lib/types'

const STATUS_COLORS: Record<TrialStatus, string> = {
  configuracion: 'bg-blue-100 text-blue-700',
  activo:        'bg-green-100 text-green-700',
  cosecha:       'bg-yellow-100 text-yellow-700',
  analisis:      'bg-purple-100 text-purple-700',
  completado:    'bg-gray-100 text-gray-600',
}
const STATUS_LABELS: Record<TrialStatus, string> = {
  configuracion: 'Configuración', activo: 'Activo', cosecha: 'En cosecha',
  analisis: 'En análisis', completado: 'Completado',
}

export default function EnsayosPage() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => { setTrials(loadTrials()) }, [])

  const filtered = trials.filter(t => {
    const q = search.toLowerCase()
    const matchQ = !q || t.titulo.toLowerCase().includes(q) || t.codigo.toLowerCase().includes(q) || t.cultivo.cultivo.toLowerCase().includes(q) || t.ubicacion.region.toLowerCase().includes(q)
    const matchS = filterStatus === 'all' || t.estado === filterStatus
    const matchT = filterType === 'all' || t.tipo === filterType
    return matchQ && matchS && matchT
  })

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar este ensayo permanentemente?')) return
    deleteTrial(id)
    setTrials(loadTrials())
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-lq-primary flex items-center gap-2">
            <FlaskConical size={22} /> Ensayos de Eficacia
          </h1>
          <p className="text-sm text-lq-muted mt-1">{trials.length} ensayo(s) registrado(s)</p>
        </div>
        <Link href="/ensayos/nuevo" className="flex items-center gap-2 bg-lq-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-lq-primary-light transition text-sm shadow">
          <PlusCircle size={16} /> Nuevo Ensayo
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-lq-border mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código, título, cultivo..."
            className="text-sm flex-1 bg-transparent outline-none"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-input !w-auto text-sm py-2">
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-input !w-auto text-sm py-2">
          <option value="all">Todos los tipos</option>
          <option value="eficacia">Ensayo de Eficacia</option>
          <option value="demostracion_comercial">Demostración Comercial</option>
        </select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter size={13} /> {filtered.length} resultado(s)
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl py-20 text-center shadow-sm border border-lq-border">
          <FlaskConical size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 mb-3">{trials.length === 0 ? 'No hay ensayos registrados aún.' : 'No se encontraron resultados para el filtro aplicado.'}</p>
          {trials.length === 0 && (
            <Link href="/ensayos/nuevo" className="inline-flex items-center gap-2 bg-lq-primary text-white px-4 py-2 rounded-lg text-sm">
              <PlusCircle size={14} /> Crear primer ensayo
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Cultivo</th>
                <th>Diseño</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Evaluaciones</th>
                <th>Actualizado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs font-bold text-lq-primary whitespace-nowrap">{t.codigo}</td>
                  <td className="max-w-[180px]">
                    <Link href={`/ensayos/${t.id}`} className="hover:text-lq-secondary font-medium text-sm truncate block">{t.titulo}</Link>
                  </td>
                  <td className="text-xs">{t.tipo === 'eficacia' ? 'Eficacia' : 'Demo Comercial'}</td>
                  <td className="text-sm">{t.cultivo.cultivo}</td>
                  <td className="text-xs font-semibold">{t.diseno.tipo} · {t.diseno.numTratamientos}T × {t.diseno.numRepeticiones}R</td>
                  <td className="text-xs text-gray-600">{t.ubicacion.region}</td>
                  <td><span className={`badge ${STATUS_COLORS[t.estado]}`}>{STATUS_LABELS[t.estado]}</span></td>
                  <td className="text-center text-sm font-semibold text-gray-700">{t.evaluaciones.length}</td>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{new Date(t.actualizadoEn).toLocaleDateString('es-PE')}</td>
                  <td>
                    <div className="flex items-center gap-2 justify-center">
                      <Link href={`/ensayos/${t.id}`} className="text-lq-secondary hover:text-lq-primary-light p-1" title="Abrir ensayo">
                        <ExternalLink size={15} />
                      </Link>
                      <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 p-1" title="Eliminar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
