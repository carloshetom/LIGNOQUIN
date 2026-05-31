'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ErrorBar, ResponsiveContainer, Cell, ReferenceLine,
  LineChart, Line, ScatterChart, Scatter
} from 'recharts'

interface BarWithErrorProps {
  data: { tratamiento: string; media: number; error_estandar: number; letras: string; diferenciaPctVsControl?: number }[]
  unidad: string
  titulo?: string
}

const COLORS = ['#2D6A4F', '#52B788', '#95D5B2', '#D4AF37', '#40916C', '#1B4332', '#74C69D', '#B7E4C7', '#F4A261', '#E63946']

export function BarWithError({ data, unidad, titulo }: BarWithErrorProps) {
  const chartData = data.map((d, i) => ({
    name: d.tratamiento.length > 18 ? d.tratamiento.substring(0, 18) + '…' : d.tratamiento,
    fullName: d.tratamiento,
    media: +d.media.toFixed(3),
    errorVal: [[d.error_estandar], [d.error_estandar]],
    letras: d.letras,
    pct: d.diferenciaPctVsControl ?? 0,
    fill: COLORS[i % COLORS.length],
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <p className="font-semibold text-gray-800 mb-1">{d.fullName}</p>
          <p className="text-gray-700">Media: <span className="font-bold">{d.media} {unidad}</span></p>
          <p className="text-gray-500">± ES: {d.errorVal[0][0].toFixed(3)}</p>
          <p className="text-gray-500">Letras: <span className="font-mono font-bold text-green-700">{d.letras}</span></p>
          {d.pct !== 0 && (
            <p className={d.pct > 0 ? 'text-green-600' : 'text-red-500'}>
              {d.pct > 0 ? '+' : ''}{d.pct}% vs testigo
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ x, y, width, value }: any) => (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#1B4332" fontSize={11} fontWeight="bold" fontFamily="monospace">
      {value}
    </text>
  )

  return (
    <div className="w-full">
      {titulo && <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center">{titulo}</h3>}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 25, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#374151' }}
            angle={-30}
            textAnchor="end"
            interval={0}
            height={65}
          />
          <YAxis tick={{ fontSize: 11 }} unit={` ${unidad}`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="media" name={`Media (${unidad})`} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <ErrorBar dataKey="errorVal" width={6} strokeWidth={2} stroke="#1B4332" />
            <CustomLabel />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 text-center mt-1">Barras representan la media ± error estándar. Letras sobre cada barra = grupos Tukey/LSD (α=0.05)</p>
    </div>
  )
}

interface DoseResponseProps {
  data: { dosis: number; media: number; tratamiento: string }[]
  unidad: string
}

export function DoseResponseChart({ data, unidad }: DoseResponseProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E0" />
        <XAxis dataKey="dosis" name="Dosis" unit=" L/ha" tick={{ fontSize: 11 }} />
        <YAxis dataKey="media" name="Rendimiento" unit={` ${unidad}`} tick={{ fontSize: 11 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Dosis-Respuesta" data={data} fill="#2D6A4F" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

interface TreatmentProgressProps {
  data: { fecha: string; [key: string]: number | string }[]
  treatments: string[]
}

export function TreatmentProgressChart({ data, treatments }: TreatmentProgressProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E0" />
        <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {treatments.map((t, i) => (
          <Line key={t} type="monotone" dataKey={t} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

// Simple sparkline for dashboard
export function MiniBarChart({ values, color = '#52B788' }: { values: number[]; color?: string }) {
  const data = values.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={48}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
