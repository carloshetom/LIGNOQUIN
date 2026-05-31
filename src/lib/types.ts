// ─── Core Domain Types ───────────────────────────────────────────────────────

export type TrialType = 'eficacia' | 'demostracion_comercial'
export type DesignType = 'DCA' | 'DBCA' | 'FACTORIAL'
export type TreatmentType = 'testigo_absoluto' | 'testigo_comercial' | 'producto_lignoquim' | 'otro'
export type TrialStatus = 'configuracion' | 'activo' | 'cosecha' | 'analisis' | 'completado'
export type VariableType = 'rendimiento' | 'crecimiento' | 'calidad' | 'fisiologico' | 'economico' | 'sanitario'
export type PostHocMethod = 'tukey' | 'lsd' | 'duncan'
export type SignificanceLevel = 0.05 | 0.01

// ─── Location ────────────────────────────────────────────────────────────────

export interface Location {
  region: string
  provincia: string
  distrito: string
  fundo: string
  responsable: string
  latitud?: number
  longitud?: number
  altitud?: number
  tipoClima?: string
  tipSuelo?: string
}

// ─── Crop ────────────────────────────────────────────────────────────────────

export interface CropInfo {
  cultivo: string
  variedad: string
  etapaFenologica: string
  fechaSiembra?: string
  edadPlantasAnios?: number
  marcoPlanacion?: string
  sistemaRiego?: string
}

// ─── Experimental Design ─────────────────────────────────────────────────────

export interface ExperimentalDesign {
  tipo: DesignType
  numTratamientos: number
  numRepeticiones: number
  tamanioParcela: number
  unidadArea: 'm2' | 'ha'
  areaTotal?: number
  calleEntreRepeticiones?: number
  descripcion?: string
}

// ─── Treatment ───────────────────────────────────────────────────────────────

export interface Treatment {
  id: string
  codigo: string
  nombre: string
  tipo: TreatmentType
  producto?: string
  dosis?: number
  unidadDosis?: string
  metodoAplicacion?: string
  frecuenciaAplicacion?: string
  momentoAplicacion?: string
  costoPorHectarea?: number
  descripcion?: string
}

// ─── Variable ────────────────────────────────────────────────────────────────

export interface Variable {
  id: string
  nombre: string
  unidad: string
  tipo: VariableType
  descripcion?: string
  esPrincipal: boolean
  metodoMedicion?: string
  valorEsperadoMin?: number
  valorEsperadoMax?: number
}

// ─── Evaluation / Sampling date ──────────────────────────────────────────────

export interface Evaluation {
  id: string
  nombre: string
  fecha: string
  dda?: number
  etapaFenologica?: string
  notas?: string
}

// ─── Observation (a single data point) ───────────────────────────────────────

export interface Observation {
  id: string
  evaluacionId: string
  tratamientoId: string
  repeticion: number
  bloque?: number
  variableId: string
  valor: number | null
  notas?: string
  creadoEn: string
}

// ─── Trial ───────────────────────────────────────────────────────────────────

export interface Trial {
  id: string
  codigo: string
  titulo: string
  tipo: TrialType
  estado: TrialStatus
  ubicacion: Location
  cultivo: CropInfo
  diseno: ExperimentalDesign
  tratamientos: Treatment[]
  variables: Variable[]
  evaluaciones: Evaluation[]
  observaciones: Observation[]
  objetivo?: string
  hipotesis?: string
  creadoEn: string
  actualizadoEn: string
}

// ─── Statistical Results ─────────────────────────────────────────────────────

export interface DescriptiveStat {
  tratamiento: string
  n: number
  media: number
  mediana: number
  desviacionEstandar: number
  errorEstandar: number
  cv: number
  minimo: number
  maximo: number
  ic95Min: number
  ic95Max: number
}

export interface AnovaSource {
  fuente: string
  gl: number
  sc: number
  cm: number
  fcalculado: number | null
  ftabulado: number | null
  pValor: number | null
  significancia: string
}

export interface AnovaResult {
  fuentes: AnovaSource[]
  mediaGeneral: number
  cv: number
  msError: number
  dfError: number
  valido: boolean
  mensaje?: string
}

export interface MeanComparison {
  tratamiento: string
  media: number
  error_estandar: number
  letras: string
  diferenciaPctVsControl?: number
  beneficioBruto?: number
  relacionBC?: number
}

export interface StatisticalAnalysis {
  trialId: string
  variableId: string
  evaluacionId: string
  metodo: PostHocMethod
  alfa: SignificanceLevel
  estadisticosDescriptivos: DescriptiveStat[]
  anova: AnovaResult
  comparacionMedias: MeanComparison[]
  interpretacion: string[]
  ejecutadoEn: string
}

// ─── PDF Report ──────────────────────────────────────────────────────────────

export interface ReportConfig {
  trial: Trial
  analysis: StatisticalAnalysis
  variableName: string
  includeCharts: boolean
  includeEconomicAnalysis: boolean
  firmante?: string
  cargo?: string
}
