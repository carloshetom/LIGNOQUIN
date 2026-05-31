'use client'

import type { Trial } from './types'

const STORAGE_KEY = 'lignoquin_trials'

export function loadTrials(): Trial[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTrial(trial: Trial): void {
  const trials = loadTrials()
  const idx = trials.findIndex(t => t.id === trial.id)
  if (idx >= 0) trials[idx] = trial
  else trials.push(trial)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trials))
}

export function deleteTrial(id: string): void {
  const trials = loadTrials().filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trials))
}

export function getTrialById(id: string): Trial | undefined {
  return loadTrials().find(t => t.id === id)
}

export function generateTrialCode(tipo: string, cultivo: string): string {
  const year = new Date().getFullYear()
  const existing = loadTrials()
  const prefix = tipo === 'eficacia' ? 'EF' : 'DC'
  const cultCode = cultivo.slice(0, 3).toUpperCase().replace(/ /g, '')
  const count = existing.filter(t => t.codigo.includes(`${prefix}-${year}`)).length + 1
  return `LGQ-${prefix}-${year}-${cultCode}-${String(count).padStart(3, '0')}`
}

export function exportTrialsJSON(): string {
  return JSON.stringify(loadTrials(), null, 2)
}

export function importTrialsJSON(json: string): boolean {
  try {
    const data = JSON.parse(json)
    if (!Array.isArray(data)) return false
    localStorage.setItem(STORAGE_KEY, json)
    return true
  } catch {
    return false
  }
}
