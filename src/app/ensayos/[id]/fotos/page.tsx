'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, Trash2, X, ZoomIn, HardDrive, Filter } from 'lucide-react'
import { getTrialById } from '@/lib/storage'
import {
  loadPhotosByTrial, savePhoto, deletePhoto,
  buildPhotoRecord, estimateStorageKB
} from '@/lib/photo-storage'
import type { Trial, PhotoRecord, PhotoTipo } from '@/lib/types'
import { PHOTO_TIPO_LABELS, PHOTO_TIPO_COLORS } from '@/lib/types'

const TIPO_OPTIONS = Object.entries(PHOTO_TIPO_LABELS) as [PhotoTipo, string][]

export default function FotosPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [trial, setTrial] = useState<Trial | null>(null)
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [filterTipo, setFilterTipo] = useState<PhotoTipo | 'all'>('all')
  const [filterEval, setFilterEval] = useState<string>('all')
  const [lightbox, setLightbox] = useState<PhotoRecord | null>(null)
  const [uploading, setUploading] = useState(false)
  const [storageKB, setStorageKB] = useState(0)

  // Upload form state
  const [uploadTipo, setUploadTipo] = useState<PhotoTipo>('durante')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadEval, setUploadEval] = useState('')
  const [uploadTrat, setUploadTrat] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const t = getTrialById(id)
    if (!t) { router.push('/ensayos'); return }
    setTrial(t)
    setUploadEval(t.evaluaciones[0]?.id ?? '')
    refresh(t.id)
  }, [id])

  function refresh(trialId: string) {
    const p = loadPhotosByTrial(trialId)
    setPhotos(p)
    setStorageKB(estimateStorageKB(trialId))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setPendingFiles(files)
    const readers = files.map(f => new Promise<string>(res => {
      const r = new FileReader(); r.onload = ev => res(ev.target?.result as string); r.readAsDataURL(f)
    }))
    Promise.all(readers).then(setPreviews)
    setShowUpload(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleUpload() {
    if (!trial || !pendingFiles.length) return
    setUploading(true)
    for (const file of pendingFiles) {
      const record = await buildPhotoRecord(
        file, trial.id, uploadTipo,
        uploadDesc || PHOTO_TIPO_LABELS[uploadTipo],
        uploadEval || undefined,
        uploadTrat || undefined
      )
      savePhoto(record)
    }
    refresh(trial.id)
    setPendingFiles([])
    setPreviews([])
    setUploadDesc('')
    setShowUpload(false)
    setUploading(false)
  }

  function handleDelete(photoId: string) {
    if (!confirm('¿Eliminar esta fotografía permanentemente?')) return
    deletePhoto(photoId)
    refresh(trial!.id)
    if (lightbox?.id === photoId) setLightbox(null)
  }

  const filtered = photos.filter(p => {
    const matchT = filterTipo === 'all' || p.tipo === filterTipo
    const matchE = filterEval === 'all' || p.evaluacionId === filterEval
    return matchT && matchE
  })

  const countsByTipo = TIPO_OPTIONS.map(([k]) => ({
    tipo: k,
    count: photos.filter(p => p.tipo === k).length,
  }))

  if (!trial) return <div className="p-8 text-gray-400">Cargando...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/ensayos/${id}`} className="text-lq-muted hover:text-lq-primary"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-lq-primary flex items-center gap-2">
            <Camera size={20} /> Registro Fotográfico
          </h1>
          <p className="text-sm text-lq-muted font-mono">{trial.codigo} — {trial.titulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <HardDrive size={12} /> {storageKB} KB · {photos.length} foto(s)
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-lq-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-lq-primary-light shadow"
          >
            <Upload size={15} /> Subir fotografías
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
        </div>
      </div>

      {/* Type counters */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {countsByTipo.map(({ tipo, count }) => (
          <button
            key={tipo}
            onClick={() => setFilterTipo(filterTipo === tipo ? 'all' : tipo)}
            className={`p-3 rounded-xl border text-left transition ${
              filterTipo === tipo ? 'border-lq-secondary bg-green-50 shadow-sm' : 'border-lq-border bg-white hover:border-lq-secondary'
            }`}
          >
            <p className="text-lg font-bold text-lq-primary">{count}</p>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">{PHOTO_TIPO_LABELS[tipo]}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-lq-border mb-5 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-gray-400" />
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as PhotoTipo | 'all')} className="form-input !w-auto text-sm py-1.5">
          <option value="all">Todos los tipos</option>
          {TIPO_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={filterEval} onChange={e => setFilterEval(e.target.value)} className="form-input !w-auto text-sm py-1.5">
          <option value="all">Todas las evaluaciones</option>
          {trial.evaluaciones.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} resultado(s)</span>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white rounded-xl p-5 shadow border border-lq-border mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lq-primary">Subir {pendingFiles.length} fotografía(s)</h2>
            <button onClick={() => { setShowUpload(false); setPendingFiles([]); setPreviews([]) }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {/* Preview strip */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {previews.map((src, i) => (
              <img key={i} src={src} alt="" className="h-24 w-32 object-cover rounded-lg border border-lq-border flex-shrink-0" />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de fotografía <span className="text-red-400">*</span></label>
              <select value={uploadTipo} onChange={e => setUploadTipo(e.target.value as PhotoTipo)} className="form-input">
                {TIPO_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evaluación relacionada</label>
              <select value={uploadEval} onChange={e => setUploadEval(e.target.value)} className="form-input">
                <option value="">— Sin evaluación específica —</option>
                {trial.evaluaciones.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento relacionado</label>
              <select value={uploadTrat} onChange={e => setUploadTrat(e.target.value)} className="form-input">
                <option value="">— General (todos) —</option>
                {trial.tratamientos.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Observación</label>
              <input
                value={uploadDesc}
                onChange={e => setUploadDesc(e.target.value)}
                placeholder={`Ej: ${PHOTO_TIPO_LABELS[uploadTipo]} — Parcela T2, Bloque 3`}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 bg-lq-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-lq-primary-light disabled:opacity-50 shadow"
            >
              {uploading ? 'Procesando...' : `Guardar ${pendingFiles.length} foto(s)`}
            </button>
            <button onClick={() => { setShowUpload(false); setPendingFiles([]); setPreviews([]) }} className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Las imágenes se comprimen automáticamente (max 1200px, JPEG). Formatos: JPG, PNG, HEIC, WEBP.</p>
        </div>
      )}

      {/* Photo grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl py-20 text-center border border-lq-border">
          <Camera size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 text-sm">No hay fotografías para los filtros seleccionados.</p>
          <button onClick={() => fileInputRef.current?.click()} className="mt-3 text-lq-secondary text-sm font-medium hover:underline">
            + Subir primera fotografía
          </button>
        </div>
      ) : (
        <>
          {/* Group by tipo */}
          {(filterTipo === 'all' ? (Object.keys(PHOTO_TIPO_LABELS) as PhotoTipo[]) : [filterTipo]).map(tipo => {
            const group = filtered.filter(p => p.tipo === tipo)
            if (!group.length) return null
            return (
              <div key={tipo} className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-semibold text-lq-primary text-sm">{PHOTO_TIPO_LABELS[tipo]}</h2>
                  <span className={`badge text-xs ${PHOTO_TIPO_COLORS[tipo]}`}>{group.length} foto(s)</span>
                  <div className="flex-1 h-px bg-lq-border" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {group.map(photo => {
                    const evalName = trial.evaluaciones.find(e => e.id === photo.evaluacionId)?.nombre
                    const tratName = trial.tratamientos.find(t => t.id === photo.tratamientoId)?.codigo
                    return (
                      <div key={photo.id} className="group relative bg-white rounded-xl border border-lq-border overflow-hidden shadow-sm hover:shadow-md transition">
                        {/* Thumbnail */}
                        <div
                          className="relative cursor-pointer"
                          onClick={() => setLightbox(photo)}
                        >
                          <img
                            src={photo.base64}
                            alt={photo.descripcion}
                            className="w-full h-36 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                            <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-800 truncate">{photo.descripcion}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`badge text-xs py-0 ${PHOTO_TIPO_COLORS[photo.tipo]}`}>{PHOTO_TIPO_LABELS[photo.tipo].split(' ')[0]}</span>
                            <span className="text-xs text-gray-400">{photo.fechaCaptura}</span>
                          </div>
                          {evalName && <p className="text-xs text-gray-400 truncate mt-0.5">{evalName}{tratName ? ` · ${tratName}` : ''}</p>}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setLightbox(null) }}
        >
          <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl">
            <div className="relative">
              <img src={lightbox.base64} alt={lightbox.descripcion} className="w-full max-h-[70vh] object-contain bg-gray-900" />
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`badge text-xs mr-2 ${PHOTO_TIPO_COLORS[lightbox.tipo]}`}>{PHOTO_TIPO_LABELS[lightbox.tipo]}</span>
                  <span className="font-medium text-gray-800">{lightbox.descripcion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{lightbox.fechaCaptura}</span>
                  <button onClick={() => handleDelete(lightbox.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
              {lightbox.evaluacionId && (
                <p className="text-xs text-gray-500 mt-1">
                  Evaluación: {trial.evaluaciones.find(e => e.id === lightbox.evaluacionId)?.nombre ?? '—'}
                  {lightbox.tratamientoId && ` · Tratamiento: ${trial.tratamientos.find(t => t.id === lightbox.tratamientoId)?.codigo ?? '—'}`}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 font-mono">{lightbox.nombreArchivo}</p>
            </div>
          </div>
        </div>
      )}

      {/* Guide */}
      <div className="mt-8 p-4 bg-lq-bg rounded-xl border border-lq-border text-xs text-gray-500">
        <p className="font-semibold text-gray-700 mb-1">Protocolo fotográfico recomendado para ensayos de eficacia:</p>
        <div className="grid grid-cols-2 gap-1 mt-1">
          <p>• <strong>Instalación:</strong> Layout del ensayo, señalización de parcelas y bloques</p>
          <p>• <strong>Antes del tratamiento:</strong> Estado inicial del cultivo, condición de la planta</p>
          <p>• <strong>Durante el muestreo:</strong> Proceso de medición, toma de muestras, SPAD, pesaje</p>
          <p>• <strong>Después del tratamiento:</strong> Respuesta visible del cultivo post-aplicación</p>
          <p>• <strong>Cosecha:</strong> Frutos/rendimiento, comparativo entre tratamientos</p>
          <p>• <strong>General:</strong> Condiciones climáticas, incidencias, plagas, suelo</p>
        </div>
      </div>
    </div>
  )
}
