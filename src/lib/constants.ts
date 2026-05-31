import type { Variable } from './types'

// ─── Peru Administrative Regions ─────────────────────────────────────────────

export const PERU_REGIONES = [
  'Amazonas','Áncash','Apurímac','Arequipa','Ayacucho','Cajamarca',
  'Callao','Cusco','Huancavelica','Huánuco','Ica','Junín','La Libertad',
  'Lambayeque','Lima','Loreto','Madre de Dios','Moquegua','Pasco',
  'Piura','Puno','San Martín','Tacna','Tumbes','Ucayali'
]

// ─── Lignoquim Products ───────────────────────────────────────────────────────

export const LIGNOQUIM_PRODUCTS = [
  { nombre: 'GLIFENO SL', descripcion: 'Bioestimulante con glicina betaína, ácidos fúlvicos y aminoácidos', dosis: '1.0–2.0 L/ha' },
  { nombre: 'LIGNOQUIM FOLIAR', descripcion: 'Nutrición foliar balanceada N-P-K + micronutrientes', dosis: '2.0–3.0 L/ha' },
  { nombre: 'LIGNOQUIM RADICULAR', descripcion: 'Estimulante radicular con ácidos húmicos y fúlvicos', dosis: '3.0–5.0 L/ha' },
  { nombre: 'LIGNOQUIM CALCIO-BORO', descripcion: 'Calcio y boro quelado para calidad de fruta', dosis: '1.5–2.5 L/ha' },
  { nombre: 'LIGNOQUIM ZINC-MANGANESO', descripcion: 'Zinc y manganeso quelado para fotosíntesis y enzimas', dosis: '0.5–1.0 L/ha' },
  { nombre: 'LIGNOQUIM POTASIO PLUS', descripcion: 'Potasio líquido para llenado de frutos', dosis: '4.0–6.0 L/ha' },
  { nombre: 'LIGNOQUIM AMINO PLUS', descripcion: 'Aminoácidos libres hidrolizados para estrés', dosis: '1.0–2.0 L/ha' },
  { nombre: 'LIGNOQUIM FERRO PLUS', descripcion: 'Hierro quelado con EDTA para clorosis', dosis: '0.5–1.0 L/ha' },
]

// ─── Application Methods ─────────────────────────────────────────────────────

export const METODOS_APLICACION = [
  'Foliar (aspersión)', 'Riego (fertirriego)', 'Drench radicular',
  'Aspersión en banda', 'Drench dirigido', 'Aplicación al suelo'
]

// ─── Phenological Stages ─────────────────────────────────────────────────────

export const ETAPAS_FENOLOGICAS: Record<string, string[]> = {
  'Arándano': ['Brotación', 'Crecimiento vegetativo', 'Floración', 'Cuajado', 'Desarrollo de fruto', 'Maduración', 'Postcosecha'],
  'Espárrago': ['Brotación de turiones', 'Elongación', 'Apertura de brácteas', 'Plumeo', 'Senescencia', 'Dormancia'],
  'Palta / Aguacate': ['Brotación', 'Crecimiento vegetativo', 'Inducción floral', 'Floración', 'Cuajado', 'Desarrollo de fruto', 'Maduración'],
  'Mango': ['Brotación', 'Crecimiento vegetativo', 'Inducción floral', 'Panícula visible', 'Floración', 'Cuajado', 'Desarrollo de fruto', 'Maduración'],
  'Vid / Uva': ['Brotación', 'Crecimiento de brotes', 'Floración', 'Cuajado', 'Envero', 'Maduración', 'Postcosecha'],
  'Papa': ['Emergencia', 'Crecimiento vegetativo', 'Inicio de tuberización', 'Tuberización plena', 'Llenado de tubérculos', 'Maduración'],
  'Maíz': ['Emergencia (VE)', 'V3–V4', 'V6', 'V12', 'VT (Floración masculina)', 'R1 (Floración femenina)', 'R3 (Choclo)', 'R5', 'R6 (Madurez fisiológica)'],
  'Quinua': ['Emergencia', 'Dos hojas verdaderas', 'Cuatro hojas verdaderas', 'Ramificación', 'Inicio de panoja', 'Floración', 'Grano lechoso', 'Madurez fisiológica'],
  'Tomate': ['Transplante', 'Crecimiento vegetativo', 'Floración', 'Cuajado', 'Desarrollo de fruto', 'Maduración verde', 'Cosecha'],
  'Espinaca / Lechuga': ['Transplante / Siembra', 'Formación de roseta', 'Crecimiento foliar', 'Cosecha'],
  'Cítricos': ['Brotación', 'Floración', 'Cuajado', 'Caída de frutos', 'Desarrollo de fruto', 'Maduración'],
  'Café': ['Brotación', 'Crecimiento vegetativo', 'Floración', 'Cuajado', 'Desarrollo de cereza', 'Maduración', 'Postcosecha'],
  'Alcachofa': ['Transplante', 'Crecimiento vegetativo', 'Inicio de capítulo', 'Capítulo desarrollado', 'Cosecha'],
  'Brócoli': ['Transplante', 'Crecimiento vegetativo', 'Inicio de pella', 'Pella desarrollada', 'Cosecha'],
  'Otro': ['Establecimiento', 'Crecimiento vegetativo', 'Floración/Fructificación', 'Maduración', 'Cosecha'],
}

// ─── Crop List ────────────────────────────────────────────────────────────────

export const CULTIVOS = Object.keys(ETAPAS_FENOLOGICAS)

// ─── Standard Variables per Crop ─────────────────────────────────────────────

const mkVar = (id: string, nombre: string, unidad: string, tipo: Variable['tipo'], esPrincipal: boolean, desc?: string): Variable => ({
  id, nombre, unidad, tipo, esPrincipal, descripcion: desc,
  metodoMedicion: undefined, valorEsperadoMin: undefined, valorEsperadoMax: undefined
})

export const VARIABLES_POR_CULTIVO: Record<string, Variable[]> = {
  'Arándano': [
    mkVar('arn_rend', 'Rendimiento total', 't/ha', 'rendimiento', true, 'Peso total de fruta cosechada por unidad de área'),
    mkVar('arn_rend_exp', 'Rendimiento exportable', 't/ha', 'rendimiento', true),
    mkVar('arn_peso_fruta', 'Peso promedio de fruta', 'g', 'calidad', true),
    mkVar('arn_brix', 'Sólidos solubles', '°Brix', 'calidad', true),
    mkVar('arn_firmeza', 'Firmeza de fruta', 'N', 'calidad', true),
    mkVar('arn_diam', 'Diámetro ecuatorial', 'mm', 'calidad', false),
    mkVar('arn_color', 'Índice de color (CIELAB)', 'unidad', 'calidad', false),
    mkVar('arn_spad', 'Contenido de clorofila (SPAD)', 'SPAD', 'fisiologico', false),
    mkVar('arn_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('arn_pct_exp', 'Porcentaje fruta exportable', '%', 'calidad', false),
  ],
  'Espárrago': [
    mkVar('esp_rend_tot', 'Rendimiento total', 't/ha', 'rendimiento', true),
    mkVar('esp_rend_exp', 'Rendimiento exportable', 't/ha', 'rendimiento', true),
    mkVar('esp_diam_turion', 'Diámetro de turión', 'mm', 'calidad', true),
    mkVar('esp_peso_turion', 'Peso promedio de turión', 'g', 'calidad', false),
    mkVar('esp_long_turion', 'Longitud de turión', 'cm', 'calidad', false),
    mkVar('esp_pct_extra', 'Porcentaje calibre Premium/Extra', '%', 'calidad', true),
    mkVar('esp_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
  'Palta / Aguacate': [
    mkVar('plt_rend', 'Rendimiento', 't/ha', 'rendimiento', true),
    mkVar('plt_peso_fruta', 'Peso promedio de fruta', 'g', 'calidad', true),
    mkVar('plt_ms', 'Materia seca de pulpa', '%', 'calidad', true),
    mkVar('plt_rel_ps', 'Relación pulpa/semilla', 'ratio', 'calidad', false),
    mkVar('plt_aceite', 'Contenido de aceite', '%', 'calidad', false),
    mkVar('plt_dias_cosecha', 'Días a cosecha', 'días', 'fisiologico', false),
    mkVar('plt_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
    mkVar('plt_largo', 'Largo de fruta', 'cm', 'calidad', false),
  ],
  'Mango': [
    mkVar('mng_rend', 'Rendimiento', 't/ha', 'rendimiento', true),
    mkVar('mng_peso_fruta', 'Peso promedio de fruta', 'g', 'calidad', true),
    mkVar('mng_brix', 'Sólidos solubles', '°Brix', 'calidad', true),
    mkVar('mng_firmeza', 'Firmeza', 'N', 'calidad', false),
    mkVar('mng_largo', 'Largo de fruta', 'cm', 'calidad', false),
    mkVar('mng_frutos_planta', 'Número de frutos por planta', 'frutos', 'rendimiento', false),
    mkVar('mng_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
  'Papa': [
    mkVar('ppa_rend_tot', 'Rendimiento total', 't/ha', 'rendimiento', true),
    mkVar('ppa_rend_com', 'Rendimiento comercial', 't/ha', 'rendimiento', true),
    mkVar('ppa_peso_tuberculo', 'Peso promedio de tubérculo', 'g', 'calidad', false),
    mkVar('ppa_ms', 'Materia seca', '%', 'calidad', true),
    mkVar('ppa_num_tuberculos', 'Número de tubérculos/planta', 'unid', 'rendimiento', false),
    mkVar('ppa_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('ppa_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
    mkVar('ppa_materia_seca_folla', 'Materia seca follaje', 'g/planta', 'fisiologico', false),
  ],
  'Maíz': [
    mkVar('mz_rend', 'Rendimiento de grano', 'kg/ha', 'rendimiento', true),
    mkVar('mz_peso_100', 'Peso de 100 granos', 'g', 'calidad', true),
    mkVar('mz_granos_mazorca', 'Número de granos/mazorca', 'granos', 'rendimiento', true),
    mkVar('mz_long_mazorca', 'Longitud de mazorca', 'cm', 'calidad', false),
    mkVar('mz_diam_mazorca', 'Diámetro de mazorca', 'cm', 'calidad', false),
    mkVar('mz_altura_planta', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('mz_diam_tallo', 'Diámetro de tallo', 'mm', 'crecimiento', false),
    mkVar('mz_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
    mkVar('mz_ms', 'Materia seca de grano', '%', 'calidad', false),
  ],
  'Vid / Uva': [
    mkVar('vd_rend', 'Rendimiento', 't/ha', 'rendimiento', true),
    mkVar('vd_peso_racimo', 'Peso promedio de racimo', 'g', 'calidad', true),
    mkVar('vd_brix', 'Sólidos solubles', '°Brix', 'calidad', true),
    mkVar('vd_diam_baya', 'Diámetro de baya', 'mm', 'calidad', true),
    mkVar('vd_firmeza', 'Firmeza de baya', 'N', 'calidad', false),
    mkVar('vd_color', 'Índice de color', 'unid', 'calidad', false),
    mkVar('vd_acidez', 'Acidez titulable', 'g/L ácido tartárico', 'calidad', false),
  ],
  'Tomate': [
    mkVar('tom_rend', 'Rendimiento', 't/ha', 'rendimiento', true),
    mkVar('tom_peso_fruta', 'Peso promedio de fruto', 'g', 'calidad', true),
    mkVar('tom_brix', 'Sólidos solubles', '°Brix', 'calidad', true),
    mkVar('tom_firmeza', 'Firmeza', 'N', 'calidad', false),
    mkVar('tom_num_frutos', 'Número de frutos/planta', 'frutos', 'rendimiento', false),
    mkVar('tom_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('tom_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
  'Quinua': [
    mkVar('qn_rend', 'Rendimiento de grano', 'kg/ha', 'rendimiento', true),
    mkVar('qn_peso_1000', 'Peso de 1000 granos', 'g', 'calidad', true),
    mkVar('qn_long_panoja', 'Longitud de panoja', 'cm', 'crecimiento', true),
    mkVar('qn_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('qn_diam_tallo', 'Diámetro de tallo', 'mm', 'crecimiento', false),
    mkVar('qn_saponina', 'Contenido de saponina', '%', 'calidad', false),
    mkVar('qn_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
    mkVar('qn_proteina', 'Proteína en grano', '%', 'calidad', false),
  ],
  'Café': [
    mkVar('caf_rend', 'Rendimiento de café pergamino', 'kg/ha', 'rendimiento', true),
    mkVar('caf_rend_oro', 'Rendimiento de café oro', 'kg/ha', 'rendimiento', false),
    mkVar('caf_peso_100', 'Peso de 100 granos', 'g', 'calidad', true),
    mkVar('caf_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('caf_num_ramas', 'Número de ramas productivas', 'ramas', 'crecimiento', false),
    mkVar('caf_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
    mkVar('caf_taza', 'Puntaje de taza (cupping)', 'puntos', 'calidad', false),
  ],
  'Cítricos': [
    mkVar('cit_rend', 'Rendimiento', 't/ha', 'rendimiento', true),
    mkVar('cit_peso_fruta', 'Peso promedio de fruta', 'g', 'calidad', true),
    mkVar('cit_brix', 'Sólidos solubles', '°Brix', 'calidad', true),
    mkVar('cit_indice_color', 'Índice de color', 'IC', 'calidad', false),
    mkVar('cit_diam', 'Diámetro ecuatorial', 'mm', 'calidad', false),
    mkVar('cit_espesor_cascara', 'Espesor de cáscara', 'mm', 'calidad', false),
    mkVar('cit_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
  'Brócoli': [
    mkVar('bro_rend', 'Rendimiento', 't/ha', 'rendimiento', true),
    mkVar('bro_peso_pella', 'Peso de pella', 'g', 'calidad', true),
    mkVar('bro_diam_pella', 'Diámetro de pella', 'cm', 'calidad', true),
    mkVar('bro_pct_exp', 'Porcentaje exportable', '%', 'calidad', false),
    mkVar('bro_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('bro_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
  'Alcachofa': [
    mkVar('alc_rend', 'Rendimiento', 'capítulos/ha', 'rendimiento', true),
    mkVar('alc_peso_capitulo', 'Peso de capítulo', 'g', 'calidad', true),
    mkVar('alc_diam_capitulo', 'Diámetro de capítulo', 'cm', 'calidad', true),
    mkVar('alc_pct_exp', 'Porcentaje exportable', '%', 'calidad', false),
    mkVar('alc_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
  'Otro': [
    mkVar('otro_rend', 'Rendimiento principal', 'kg/ha', 'rendimiento', true),
    mkVar('otro_altura', 'Altura de planta', 'cm', 'crecimiento', false),
    mkVar('otro_spad', 'Índice SPAD', 'SPAD', 'fisiologico', false),
  ],
}

// ─── Soil Types ───────────────────────────────────────────────────────────────

export const TIPOS_SUELO = [
  'Franco', 'Franco arenoso', 'Franco arcilloso', 'Franco limoso',
  'Arenoso', 'Arcilloso', 'Arcillo limoso', 'Limoso',
  'Arena franca', 'Arcillo arenoso'
]

// ─── Climate Zones ────────────────────────────────────────────────────────────

export const ZONAS_CLIMATICAS = [
  'Costa árida (0–500 msnm)', 'Costa semi-árida (500–1500 msnm)',
  'Sierra baja (1500–2500 msnm)', 'Sierra media (2500–3500 msnm)',
  'Sierra alta (3500–4500 msnm)', 'Selva alta (>800 msnm)',
  'Selva baja (<800 msnm)', 'Valle interandino'
]

// ─── Significance Labels ──────────────────────────────────────────────────────

export const SIGNIFICANCE_LABEL: Record<string, string> = {
  'ns': 'ns (no significativo)',
  '*': '* (significativo α=0.05)',
  '**': '** (altamente significativo α=0.01)',
  '***': '*** (muy altamente significativo α=0.001)',
}

// ─── CV Validity Criteria ─────────────────────────────────────────────────────

export const CV_CRITERIA = {
  excelente: { max: 10, label: 'Excelente', color: 'text-green-700' },
  bueno: { max: 15, label: 'Bueno', color: 'text-green-600' },
  regular: { max: 20, label: 'Regular', color: 'text-yellow-600' },
  alto: { max: 30, label: 'Alto (precaución)', color: 'text-orange-500' },
  muyAlto: { max: Infinity, label: 'Muy alto (inválido)', color: 'text-red-600' },
}

export function cvCategory(cv: number) {
  if (cv <= CV_CRITERIA.excelente.max) return CV_CRITERIA.excelente
  if (cv <= CV_CRITERIA.bueno.max) return CV_CRITERIA.bueno
  if (cv <= CV_CRITERIA.regular.max) return CV_CRITERIA.regular
  if (cv <= CV_CRITERIA.alto.max) return CV_CRITERIA.alto
  return CV_CRITERIA.muyAlto
}
