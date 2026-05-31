'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FlaskConical, TrendingUp, MapPin, Sprout, BarChart3, PlusCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { loadTrials } from '@/lib/storage'
import type { Trial, TrialStatus } from '@/lib/types'

const STATUS_CONFIG: Record<TrialStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  configuracion: { label: 'Configuración', color: 'bg-blue-100 text-blue-700', icon: Clock },
  activo:        { label: 'Activo', color: 'bg-green-100 text-green-700', icon: Sprout },
  cosecha:       { label: 'En cosecha', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  analisis:      { label: 'En análisis', color: 'bg-purple-100 text-purple-700', icon: BarChart3 },
  completado:    { label: 'Completado', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
}

export default function DashboardPage() {
  const [trials, setTrials] = useState<Trial[]>([])

  useEffect(() => { setTrials(loadTrials()) }, [])

  const total = trials.length
  const activos = trials.filter(t => t.estado === 'activo').length
  const completados = trials.filter(t => t.estado === 'completado').length
  const cultivos = Array.from(new Set(trials.map(t => t.cultivo.cultivo))).length
  const recent = [...trials].sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn)).slice(0, 5)

  const byStatus = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    status: key as TrialStatus,
    count: trials.filter(t => t.estado === key).length,
    ...cfg,
  })).filter(s => s.count > 0)

  const byCrop = Object.entries(
    trials.reduce<Record<string, number>>((acc, t) => {
      acc[t.cultivo.cultivo] = (acc[t.cultivo.cultivo] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const stats = [
    { label: 'Total Ensayos', value: total, icon: FlaskConical, color: 'bg-green-900 text-white' },
    { label: 'Ensayos Activos', value: activos, icon: Sprout, color: 'bg-green-600 text-white' },
    { label: 'Completados', value: completados, icon: CheckCircle, color: 'bg-yellow-500 text-white' },
    { label: 'Cultivos', value: cultivos, icon: MapPin, color: 'bg-blue-600 text-white' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-lq-primary">Panel Principal</h1>
          <p className="text-lq-muted text-sm mt-1">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/ensayos/nuevo"
          className="flex items-center gap-2 bg-lq-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-lq-primary-light transition text-sm shadow"
        >
          <PlusCircle size={16} />
          Nuevo Ensayo
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl p-5 flex items-center gap-4 shadow-sm ${color}`}>
            <div className="bg-white/20 p-3 rounded-lg">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-sm opacity-90">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
          <h2 className="font-semibold text-lq-primary mb-4 flex items-center gap-2">
            <BarChart3 size={16} /> Estado de Ensayos
          </h2>
          {byStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin ensayos registrados</p>
          ) : (
            <div className="space-y-3">
              {byStatus.map(s => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className={`badge ${s.color}`}>{s.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-lq-secondary h-2 rounded-full" style={{ width: total ? `${(s.count / total) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-6">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crops distribution */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
          <h2 className="font-semibold text-lq-primary mb-4 flex items-center gap-2">
            <Sprout size={16} /> Cultivos Evaluados
          </h2>
          {byCrop.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin cultivos registrados</p>
          ) : (
            <div className="space-y-2">
              {byCrop.map(([crop, count]) => (
                <div key={crop} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{crop}</span>
                  <span className="text-sm font-bold text-lq-primary bg-lq-bg px-2 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-lq-border">
          <h2 className="font-semibold text-lq-primary mb-4">Acciones Rápidas</h2>
          <div className="space-y-2">
            {[
              { href: '/ensayos/nuevo', label: 'Nuevo ensayo de eficacia', icon: FlaskConical, color: 'text-green-700 bg-green-50' },
              { href: '/ensayos', label: 'Ver todos los ensayos', icon: BarChart3, color: 'text-blue-700 bg-blue-50' },
              { href: '/informes', label: 'Generar informes', icon: TrendingUp, color: 'text-purple-700 bg-purple-50' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href} className={`flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition ${color}`}>
                <Icon size={16} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trials */}
      <div className="bg-white rounded-xl shadow-sm border border-lq-border overflow-hidden">
        <div className="px-5 py-4 border-b border-lq-border flex items-center justify-between">
          <h2 className="font-semibold text-lq-primary flex items-center gap-2">
            <FlaskConical size={16} /> Ensayos Recientes
          </h2>
          <Link href="/ensayos" className="text-sm text-lq-secondary font-medium hover:underline">Ver todos →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="py-16 text-center">
            <FlaskConical size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No hay ensayos registrados aún.</p>
            <Link href="/ensayos/nuevo" className="mt-3 inline-flex items-center gap-1 text-lq-secondary text-sm font-medium hover:underline">
              <PlusCircle size={14} /> Crear primer ensayo
            </Link>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Código</th><th>Título</th><th>Cultivo</th><th>Diseño</th><th>Estado</th><th>Actualizado</th><th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map(t => {
                const cfg = STATUS_CONFIG[t.estado]
                return (
                  <tr key={t.id}>
                    <td className="font-mono text-xs font-semibold text-lq-primary">{t.codigo}</td>
                    <td className="max-w-[200px] truncate">{t.titulo}</td>
                    <td>{t.cultivo.cultivo}</td>
                    <td className="text-xs font-medium">{t.diseno.tipo}</td>
                    <td><span className={`badge ${cfg.color}`}>{cfg.label}</span></td>
                    <td className="text-xs text-gray-500">{new Date(t.actualizadoEn).toLocaleDateString('es-PE')}</td>
                    <td>
                      <Link href={`/ensayos/${t.id}`} className="text-lq-secondary text-xs font-medium hover:underline">Abrir</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
