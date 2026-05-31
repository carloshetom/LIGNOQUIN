'use client'

import type { PhotoRecord, PhotoTipo } from './types'
import { v4 as uuid } from 'uuid'

const PHOTO_KEY = 'lignoquin_photos'

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadAll(): PhotoRecord[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(PHOTO_KEY) ?? '[]')
  } catch { return [] }
}

function saveAll(photos: PhotoRecord[]): void {
  localStorage.setItem(PHOTO_KEY, JSON.stringify(photos))
}

export function loadPhotosByTrial(trialId: string): PhotoRecord[] {
  return loadAll().filter(p => p.trialId === trialId)
}

export function loadPhotosByEval(trialId: string, evaluacionId: string): PhotoRecord[] {
  return loadAll().filter(p => p.trialId === trialId && p.evaluacionId === evaluacionId)
}

export function savePhoto(photo: PhotoRecord): void {
  const all = loadAll()
  const idx = all.findIndex(p => p.id === photo.id)
  if (idx >= 0) all[idx] = photo
  else all.push(photo)
  saveAll(all)
}

export function deletePhoto(id: string): void {
  saveAll(loadAll().filter(p => p.id !== id))
}

// ─── Image Compression (Canvas API) ──────────────────────────────────────────

export async function compressImage(
  file: File,
  maxPx = 1200,
  quality = 0.80
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = ev => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx }
          else                 { width = Math.round(width * maxPx / height); height = maxPx }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        const base64 = canvas.toDataURL('image/jpeg', quality)
        resolve({ base64, mimeType: 'image/jpeg' })
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ─── Build a PhotoRecord from a File ─────────────────────────────────────────

export async function buildPhotoRecord(
  file: File,
  trialId: string,
  tipo: PhotoTipo,
  descripcion: string,
  evaluacionId?: string,
  tratamientoId?: string
): Promise<PhotoRecord> {
  const { base64, mimeType } = await compressImage(file)
  return {
    id: uuid(),
    trialId,
    evaluacionId,
    tratamientoId,
    tipo,
    descripcion: descripcion || file.name,
    base64,
    mimeType,
    nombreArchivo: file.name,
    fechaCaptura: new Date().toISOString().slice(0, 10),
    creadoEn: new Date().toISOString(),
  }
}

// ─── Storage usage estimate ───────────────────────────────────────────────────

export function estimateStorageKB(trialId: string): number {
  const photos = loadPhotosByTrial(trialId)
  const bytes = photos.reduce((s, p) => s + p.base64.length * 0.75, 0)
  return Math.round(bytes / 1024)
}
