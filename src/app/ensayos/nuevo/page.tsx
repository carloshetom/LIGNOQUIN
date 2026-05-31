'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuid } from 'uuid'
import { ChevronRight, ChevronLeft, Check, Plus, Trash2 } from 'lucide-react'
import { saveTrial, generateTrialCode } from '@/lib/storage'
import { PERU_REGIONES, LIGNOQUIM_PRODUCTS, METODOS_APLICACION, ETAPAS_FENOLOGICAS, CULTIVOS, VARIABLES_POR_CULTIVO, TIPOS_SUELO, ZONAS_CLIMATICAS } from '@/lib/constants'
import type { Trial, Treatment, Variable, TreatmentType } from '@/lib/types'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS = [
  { n: 1, label: 'Identificación' },
  { n: 2, label: 'Cultivo y Sitio' },
  { n: 3, label: 'Diseño Experimental' },
  { n: 4, label: 'Tratamientos' },
  { n: 5, label: 'Variables' },
]

export default function NuevoEnsayoPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<'eficacia' | 'demostracion_comercial'>('eficacia')
  const [objetivo, setObjetivo] = useState('')
  const [responsable, setResponsable] = useState('')
  const [fundo, setFundo] = useState('')
  const [region, setRegion] = useState('')
  const [provincia, setProvincia] = useState('')
  const [distrito, setDistrito] = useState('')

  // Step 2
  const [cultivo, setCultivo] = useState('Arándano')
  const [variedad, setVariedad] = useState('')
  const [etapaFenologica, setEtapaFenologica] = useState('')
  const [fechaSiembra, setFechaSiembra] = useState('')
  const [altitud, setAltitud] = useState('')
  const [tipoSuelo, setTipoSuelo] = useState('')
  const [zonaClimatica, setZonaClimatica] = useState('')
  const [sistemaRiego, setSistemaRiego] = useState('')

  // Step 3
  const [diseno, setDiseno] = useState<'DCA' | 'DBCA'>('DBCA')
  const [numTrat, setNumTrat] = useState(4)
  const [numRep, setNumRep] = useState(4)
  const [tamParcela, setTamParcela] = useState(10)
  const [unidadArea, setUnidadArea] = useState<'m2' | 'ha'>('m2')
  const [descDiseno, setDescDiseno] = useState('')

  // Step 4
  const [treatments, setTreatments] = useState<Treatment[]>([
    { id: uuid(), codigo: 'T1', nombre: 'Testigo absoluto (sin aplicación)', tipo: 'testigo_absoluto', descripcion: 'Control sin ningún tipo de aplicación' },
  ])

  // Step 5
  const [variables, setVariables] = useState<Variable[]>(() => {
    return VARIABLES_POR_CULTIVO['Arándano'].map(v => ({ ...v }))
  })

  // Evaluation dates (simple)
  const [evaluaciones, setEvaluaciones] = useState([
    { id: uuid(), nombre: 'Evaluación final', fecha: '', dda: 90, etapaFenologica: 'Cosecha', notas: '' }
  ])

  const addTreatment = () => {
    const n = treatments.length + 1
    setTreatments(prev => [...prev, {
      id: uuid(), codigo: `T${n}`, nombre: '', tipo: 'producto_lignoquim',
      producto: LIGNOQUIM_PRODUCTS[0].nombre, dosis: 1.0, unidadDosis: 'L/ha',
      metodoAplicacion: 'Foliar (aspersión)', descripcion: ''
    }])
  }

  const removeTreatment = (id: string) => setTreatments(p => p.filter(t => t.id !== id))
  const updateTreatment = (id: string, field: keyof Treatment, value: unknown) =>
    setTreatments(p => p.map(t => t.id === id ? { ...t, [field]: value } : t))

  const toggleVariable = (id: string) =>
    setVariables(p => p.map(v => v.id === id ? { ...v, esPrincipal: !v.esPrincipal } : v))

  const updateEval = (i: number, field: string, value: string | number) =>
    setEvaluaciones(p => p.map((e, idx) => idx === i ? { ...e, [field]: value } : e))

  const addEval = () => setEvaluaciones(p => [...p, { id: uuid(), nombre: `Evaluación ${p.length + 1}`, fecha: '', dda: 0, etapaFenologica: '', notas: '' }])

  const handleCultivoChange = (c: string) => {
    setCultivo(c)
    setVariables(VARIABLES_POR_CULTIVO[c]?.map(v => ({ ...v })) ?? [])
  }

  const handleFinish = () => {
    const now = new Date().toISOString()
    const code = generateTrialCode(tipo, cultivo)
    const trial: Trial = {
      id: uuid(),
      codigo: code,
      titulo: titulo || `Ensayo ${code}`,
      tipo,
      estado: 'configuracion',
      objetivo,
      ubicacion: { region, provincia, distrito, fundo, responsable, altitud: altitud ? +altitud : undefined, tipoClima: zonaClimatica, tipSuelo: tipoSuelo },
      cultivo: { cultivo, variedad, etapaFenologica, fechaSiembra, sistemaRiego },
      diseno: { tipo: diseno, numTratamientos: treatments.length, numRepeticiones: numRep, tamanioParcela: tamParcela, unidadArea, descripcion: descDiseno },
      tratamientos: treatments,
      variables: variables.filter(v => v.esPrincipal || true),
      evaluaciones,
      observaciones: [],
      creadoEn: now,
      actualizadoEn: now,
    }
    saveTrial(trial)
    router.push(`/ensayos/${trial.id}`)
  }

  const canProceed = () => {
    if (step === 1) return titulo.trim().length > 0 && responsable.trim().length > 0
    if (step === 4) return treatments.length >= 2 && treatments.every(t => t.nombre.trim().length > 0)
    return true
  }

  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === s.n ? 'bg-lq-primary text-white shadow-md' :
            step > s.n ? 'bg-lq-secondary text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {step > s.n ? <Check size={14} /> : s.n}
          </div>
          <span className={`text-xs hidden sm:block ${step === s.n ? 'text-lq-primary font-semibold' : 'text-gray-400'}`}>{s.label}</span>
          {i < STEPS.length - 1 && <div className={`w-8 h-0.5 mx-1 ${step > s.n ? 'bg-lq-secondary' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )

  const Input = ({ label, value, onChange, type = 'text', placeholder = '', required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
    </div>
  )

  const Select = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="form-input">
        <option value="">— Seleccionar —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lq-primary">Nuevo Ensayo</h1>
        <p className="text-sm text-lq-muted mt-1">Complete los pasos para registrar el ensayo de eficacia</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-lq-border p-6">
        <StepIndicator />

        {/* STEP 1: Identification */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-lq-primary mb-5">1. Identificación del Ensayo</h2>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ensayo <span className="text-red-400">*</span></label>
                <div className="flex gap-4">
                  {[{v: 'eficacia', l: 'Ensayo de Eficacia'}, {v: 'demostracion_comercial', l: 'Demostración Comercial'}].map(o => (
                    <label key={o.v} className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition ${tipo === o.v ? 'border-lq-secondary bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="tipo" value={o.v} checked={tipo === o.v as typeof tipo} onChange={() => setTipo(o.v as typeof tipo)} className="sr-only" />
                      <p className="font-medium text-sm text-lq-primary">{o.l}</p>
                      <p className="text-xs text-gray-500 mt-1">{o.v === 'eficacia' ? 'Diseño estadístico riguroso con bloques/replicas' : 'Parcela testigo y parcela con producto'}</p>
                    </label>
                  ))}
                </div>
              </div>

              <Input label="Título del ensayo" value={titulo} onChange={setTitulo} required placeholder='Ej: "Eficacia de GLIFENO SL en rendimiento de arándano var. Biloxi"' />
              <Input label="Responsable técnico" value={responsable} onChange={setResponsable} required placeholder="Nombre completo del agrónomo/responsable" />

              <div className="grid grid-cols-3 gap-4">
                <Select label="Región" value={region} onChange={setRegion} options={PERU_REGIONES.map(r => ({ value: r, label: r }))} />
                <Input label="Provincia" value={provincia} onChange={setProvincia} placeholder="Ej: Trujillo" />
                <Input label="Distrito" value={distrito} onChange={setDistrito} placeholder="Ej: El Porvenir" />
              </div>

              <Input label="Nombre del fundo / empresa" value={fundo} onChange={setFundo} placeholder="Ej: Fundo La Esperanza" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo del ensayo</label>
                <textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} rows={3} className="form-input" placeholder="Ej: Evaluar el efecto de diferentes dosis de GLIFENO SL sobre el rendimiento y calidad de fruta de arándano bajo estrés hídrico en condiciones de la costa norte peruana..." />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Crop & Site */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-lq-primary mb-5">2. Información del Cultivo y Sitio</h2>
            <div className="grid grid-cols-2 gap-5">
              <Select label="Cultivo" value={cultivo} onChange={handleCultivoChange} options={CULTIVOS.map(c => ({ value: c, label: c }))} />
              <Input label="Variedad / Cultivar" value={variedad} onChange={setVariedad} placeholder="Ej: Biloxi, Ventura, Criolla..." />
              <Select label="Etapa fenológica al inicio" value={etapaFenologica} onChange={setEtapaFenologica} options={(ETAPAS_FENOLOGICAS[cultivo] ?? []).map(e => ({ value: e, label: e }))} />
              <Input label="Fecha de siembra / transplante" value={fechaSiembra} onChange={setFechaSiembra} type="date" />
              <Input label="Altitud (msnm)" value={altitud} onChange={setAltitud} type="number" placeholder="Ej: 350" />
              <Select label="Zona climática" value={zonaClimatica} onChange={setZonaClimatica} options={ZONAS_CLIMATICAS.map(z => ({ value: z, label: z }))} />
              <Select label="Tipo de suelo" value={tipoSuelo} onChange={setTipoSuelo} options={TIPOS_SUELO.map(s => ({ value: s, label: s }))} />
              <Select label="Sistema de riego" value={sistemaRiego} onChange={setSistemaRiego} options={['Goteo', 'Microaspersión', 'Aspersión', 'Gravedad', 'Secano'].map(s => ({ value: s, label: s }))} />
            </div>
          </div>
        )}

        {/* STEP 3: Experimental Design */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-lq-primary mb-5">3. Diseño Experimental</h2>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de diseño <span className="text-red-400">*</span></label>
              <div className="flex gap-4">
                {[
                  { v: 'DBCA', l: 'DBCA', desc: 'Diseño de Bloques Completos al Azar — Recomendado para condiciones de campo heterogéneas. Controla variabilidad entre bloques.' },
                  { v: 'DCA', l: 'DCA', desc: 'Diseño Completamente al Azar — Adecuado cuando las condiciones experimentales son homogéneas (invernadero, sustrato).' },
                ].map(o => (
                  <label key={o.v} className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition ${diseno === o.v ? 'border-lq-secondary bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="diseno" value={o.v} checked={diseno === o.v as typeof diseno} onChange={() => setDiseno(o.v as typeof diseno)} className="sr-only" />
                    <p className="font-bold text-lq-primary">{o.l}</p>
                    <p className="text-xs text-gray-500 mt-1">{o.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de repeticiones</label>
                <input type="number" min={2} max={10} value={numRep} onChange={e => setNumRep(+e.target.value)} className="form-input" />
                <p className="text-xs text-gray-400 mt-1">Mínimo 3–4 repeticiones para validez estadística</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de parcela experimental</label>
                <div className="flex gap-2">
                  <input type="number" min={1} value={tamParcela} onChange={e => setTamParcela(+e.target.value)} className="form-input flex-1" />
                  <select value={unidadArea} onChange={e => setUnidadArea(e.target.value as 'm2' | 'ha')} className="form-input !w-auto">
                    <option value="m2">m²</option>
                    <option value="ha">ha</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 bg-lq-bg rounded-lg border border-lq-border">
              <h3 className="text-sm font-semibold text-lq-primary mb-2">Resumen del diseño</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">Tratamientos:</span> <span className="font-bold">{numTrat}</span></div>
                <div><span className="text-gray-500">Repeticiones:</span> <span className="font-bold">{numRep}</span></div>
                <div><span className="text-gray-500">Unidades exp.:</span> <span className="font-bold">{numTrat * numRep}</span></div>
                <div><span className="text-gray-500">Área/parcela:</span> <span className="font-bold">{tamParcela} {unidadArea}</span></div>
                <div><span className="text-gray-500">Área total:</span> <span className="font-bold">{(numTrat * numRep * tamParcela).toFixed(0)} {unidadArea}</span></div>
                <div><span className="text-gray-500">Diseño:</span> <span className="font-bold text-lq-secondary">{diseno}</span></div>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción adicional del diseño</label>
              <textarea value={descDiseno} onChange={e => setDescDiseno(e.target.value)} rows={2} className="form-input" placeholder="Orientación de los bloques, distancia entre plantas, observaciones del sitio..." />
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-lq-primary mb-3">Fechas de evaluación</h3>
              <div className="space-y-3">
                {evaluaciones.map((ev, i) => (
                  <div key={ev.id} className="grid grid-cols-4 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Nombre</label>
                      <input value={ev.nombre} onChange={e => updateEval(i, 'nombre', e.target.value)} className="form-input text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Fecha</label>
                      <input type="date" value={ev.fecha} onChange={e => updateEval(i, 'fecha', e.target.value)} className="form-input text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Días después de aplicación</label>
                      <input type="number" value={ev.dda} onChange={e => updateEval(i, 'dda', +e.target.value)} className="form-input text-sm" />
                    </div>
                    <button onClick={() => setEvaluaciones(p => p.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 pb-2">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button onClick={addEval} className="text-lq-secondary text-sm flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Agregar evaluación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Treatments */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold text-lq-primary mb-2">4. Tratamientos</h2>
            <p className="text-sm text-lq-muted mb-5">Defina cada tratamiento incluyendo el testigo absoluto. El orden determina T1, T2, T3...</p>

            <div className="space-y-4">
              {treatments.map((t, i) => (
                <div key={t.id} className="border border-lq-border rounded-xl p-4 bg-lq-bg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lq-primary text-sm bg-lq-secondary/20 px-3 py-1 rounded-full">{t.codigo}</span>
                    {treatments.length > 2 && (
                      <button onClick={() => removeTreatment(t.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 mb-1 block">Nombre del tratamiento <span className="text-red-400">*</span></label>
                      <input value={t.nombre} onChange={e => updateTreatment(t.id, 'nombre', e.target.value)} className="form-input text-sm" placeholder="Ej: GLIFENO SL 1.0 L/ha" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Tipo</label>
                      <select value={t.tipo} onChange={e => updateTreatment(t.id, 'tipo', e.target.value as TreatmentType)} className="form-input text-sm">
                        <option value="testigo_absoluto">Testigo absoluto</option>
                        <option value="testigo_comercial">Testigo comercial (referencia)</option>
                        <option value="producto_lignoquim">Producto Lignoquim</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    {t.tipo === 'producto_lignoquim' && (
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Producto</label>
                        <select value={t.producto} onChange={e => updateTreatment(t.id, 'producto', e.target.value)} className="form-input text-sm">
                          {LIGNOQUIM_PRODUCTS.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
                        </select>
                      </div>
                    )}
                    {t.tipo !== 'testigo_absoluto' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Dosis</label>
                          <div className="flex gap-2">
                            <input type="number" value={t.dosis ?? ''} onChange={e => updateTreatment(t.id, 'dosis', +e.target.value)} className="form-input text-sm flex-1" step="0.1" />
                            <input value={t.unidadDosis ?? 'L/ha'} onChange={e => updateTreatment(t.id, 'unidadDosis', e.target.value)} className="form-input text-sm w-20" placeholder="L/ha" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Método de aplicación</label>
                          <select value={t.metodoAplicacion} onChange={e => updateTreatment(t.id, 'metodoAplicacion', e.target.value)} className="form-input text-sm">
                            {METODOS_APLICACION.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <label className="text-xs text-gray-600 mb-1 block">Descripción</label>
                      <input value={t.descripcion ?? ''} onChange={e => updateTreatment(t.id, 'descripcion', e.target.value)} className="form-input text-sm" placeholder="Descripción adicional del tratamiento..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addTreatment} className="mt-4 flex items-center gap-2 border-2 border-dashed border-lq-border text-lq-muted hover:border-lq-secondary hover:text-lq-secondary px-4 py-3 rounded-xl w-full text-sm font-medium transition">
              <Plus size={16} /> Agregar tratamiento
            </button>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700"><strong>Total:</strong> {treatments.length} tratamientos × {numRep} repeticiones = {treatments.length * numRep} unidades experimentales</p>
            </div>
          </div>
        )}

        {/* STEP 5: Variables */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-semibold text-lq-primary mb-2">5. Variables a Evaluar</h2>
            <p className="text-sm text-lq-muted mb-5">Seleccione las variables que se medirán en cada parcela. Las marcadas como "Principal" aparecerán primero en el análisis.</p>

            <div className="space-y-2">
              {variables.map(v => (
                <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${v.esPrincipal ? 'border-lq-secondary bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <input type="checkbox" checked={v.esPrincipal} onChange={() => toggleVariable(v.id)} className="w-4 h-4 accent-green-700" />
                  <div className="flex-1">
                    <span className="font-medium text-sm text-gray-800">{v.nombre}</span>
                    {v.descripcion && <span className="text-xs text-gray-500 ml-2">— {v.descripcion}</span>}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">{v.unidad}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${v.tipo === 'rendimiento' ? 'bg-green-100 text-green-700' : v.tipo === 'calidad' ? 'bg-blue-100 text-blue-700' : v.tipo === 'fisiologico' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {v.tipo}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-5 p-4 bg-lq-bg rounded-lg border border-lq-border">
              <p className="text-sm font-medium text-lq-primary mb-2">Resumen final del ensayo</p>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-gray-500">Cultivo:</span><span className="font-medium">{cultivo} ({variedad || '—'})</span>
                <span className="text-gray-500">Ubicación:</span><span className="font-medium">{region}, {provincia}</span>
                <span className="text-gray-500">Diseño:</span><span className="font-medium">{diseno} — {treatments.length} trat × {numRep} rep</span>
                <span className="text-gray-500">Variables:</span><span className="font-medium">{variables.filter(v => v.esPrincipal).length} seleccionadas</span>
                <span className="text-gray-500">Evaluaciones:</span><span className="font-medium">{evaluaciones.length} programadas</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-lq-border">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1) as Step)}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(s => Math.min(5, s + 1) as Step)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-lq-primary text-white hover:bg-lq-primary-light disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium shadow"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-lq-accent text-lq-primary hover:opacity-90 text-sm font-bold shadow"
            >
              <Check size={16} /> Crear Ensayo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
