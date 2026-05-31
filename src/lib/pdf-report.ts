import type { Trial, StatisticalAnalysis, ReportConfig } from './types'
import { cvCategory } from './constants'

type JsPDF = import('jspdf').jsPDF

export async function generatePDFReport(config: ReportConfig): Promise<void> {
  // Dynamic import so SSR doesn't break
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const { trial, analysis, variableName } = config
  const pw = 210, ph = 297
  const mx = 18 // margin x
  let y = 0

  // ─── Color palette ────────────────────────────────────────────────
  const C = {
    green: [27, 67, 50] as [number, number, number],
    greenMid: [45, 106, 79] as [number, number, number],
    greenLight: [82, 183, 136] as [number, number, number],
    gold: [212, 175, 55] as [number, number, number],
    cream: [244, 247, 244] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    text: [26, 46, 26] as [number, number, number],
    muted: [100, 120, 100] as [number, number, number],
    red: [192, 57, 43] as [number, number, number],
  }

  function setFont(style: 'normal' | 'bold' | 'italic' = 'normal', size = 10) {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  function setColor(rgb: [number, number, number]) { doc.setTextColor(...rgb) }

  function drawRect(x: number, ry: number, w: number, h: number, fill: [number, number, number]) {
    doc.setFillColor(...fill)
    doc.rect(x, ry, w, h, 'F')
  }

  function addText(text: string, x: number, ry: number, options?: { maxWidth?: number; align?: 'left' | 'center' | 'right' }) {
    doc.text(text, x, ry, options)
  }

  function addPage() {
    doc.addPage()
    y = 20
    drawRect(0, 0, pw, 12, C.green)
    setFont('bold', 8)
    setColor(C.cream)
    addText(`LIGNOQUIM S.A. — Informe de Ensayo: ${trial.codigo}`, mx, 8)
    addText(`${new Date().toLocaleDateString('es-PE', { dateStyle: 'long' })}`, pw - mx, 8, { align: 'right' })
    y = 20
  }

  // ─── Cover Page ───────────────────────────────────────────────────
  // Header band
  drawRect(0, 0, pw, 45, C.green)
  drawRect(0, 45, pw, 3, C.gold)

  // Logo text
  setFont('bold', 22)
  setColor(C.white)
  addText('LIGNOQUIM', mx, 20)
  setFont('normal', 10)
  setColor(C.greenLight)
  addText('Sistema de Ensayos de Eficacia — Perú', mx, 28)

  setFont('bold', 8)
  setColor(C.gold)
  addText(trial.codigo, pw - mx, 18, { align: 'right' })

  y = 60

  // Trial title
  setFont('bold', 16)
  setColor(C.green)
  const titleLines = doc.splitTextToSize(`INFORME DE RESULTADOS\n${trial.titulo}`, pw - 2 * mx)
  doc.text(titleLines, mx, y)
  y += titleLines.length * 8 + 6

  drawRect(mx, y, pw - 2 * mx, 0.5, C.greenLight)
  y += 8

  // Key info grid
  const infoItems = [
    ['Tipo de ensayo', trial.tipo === 'eficacia' ? 'Ensayo de Eficacia' : 'Demostración Comercial'],
    ['Cultivo', `${trial.cultivo.cultivo} (${trial.cultivo.variedad})`],
    ['Ubicación', `${trial.ubicacion.distrito}, ${trial.ubicacion.provincia}, ${trial.ubicacion.region}`],
    ['Fundo', trial.ubicacion.fundo],
    ['Responsable', trial.ubicacion.responsable],
    ['Diseño experimental', trial.diseno.tipo === 'DCA' ? 'Diseño Completamente al Azar (DCA)' : 'Diseño de Bloques Completos al Azar (DBCA)'],
    ['Tratamientos × Rep.', `${trial.diseno.numTratamientos} tratamientos × ${trial.diseno.numRepeticiones} repeticiones`],
    ['Altitud', trial.ubicacion.altitud ? `${trial.ubicacion.altitud} msnm` : 'N/E'],
  ]

  for (const [label, value] of infoItems) {
    setFont('bold', 9)
    setColor(C.green)
    addText(label + ':', mx, y)
    setFont('normal', 9)
    setColor(C.text)
    addText(value, mx + 55, y)
    y += 7
  }

  y += 5
  drawRect(mx, y, pw - 2 * mx, 0.5, C.greenLight)
  y += 8

  // Variable analyzed
  drawRect(mx, y, pw - 2 * mx, 12, C.cream)
  setFont('bold', 9)
  setColor(C.green)
  addText(`Variable analizada:`, mx + 4, y + 8)
  setFont('normal', 9)
  setColor(C.text)
  addText(variableName, mx + 50, y + 8)
  y += 18

  // Date & analyst
  setFont('italic', 8)
  setColor(C.muted)
  addText(`Informe generado: ${new Date().toLocaleString('es-PE')}`, mx, y)
  if (config.firmante) addText(`Analista: ${config.firmante}${config.cargo ? ' — ' + config.cargo : ''}`, mx, y + 5)

  // ─── Page 2: Results ─────────────────────────────────────────────
  addPage()

  // Section: Descriptive Statistics
  setFont('bold', 12)
  setColor(C.green)
  addText('1. ESTADÍSTICOS DESCRIPTIVOS', mx, y)
  y += 7

  const descHeaders = ['Tratamiento', 'n', 'Media', 'D.E.', 'E.E.', 'CV (%)', 'Mín.', 'Máx.', 'IC 95% (±)']
  const descRows = analysis.estadisticosDescriptivos.map(d => [
    d.tratamiento,
    String(d.n),
    d.media.toFixed(3),
    d.desviacionEstandar.toFixed(3),
    d.errorEstandar.toFixed(3),
    d.cv.toFixed(1),
    d.minimo.toFixed(3),
    d.maximo.toFixed(3),
    `${d.ic95Min.toFixed(2)} – ${d.ic95Max.toFixed(2)}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [descHeaders],
    body: descRows,
    theme: 'grid',
    headStyles: { fillColor: C.green, textColor: C.white, fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5, textColor: C.text },
    alternateRowStyles: { fillColor: C.cream },
    margin: { left: mx, right: mx },
    columnStyles: { 0: { cellWidth: 45 } },
  })

  y = (doc as any).lastAutoTable.finalY + 10

  // Section: ANOVA
  setFont('bold', 12)
  setColor(C.green)
  addText('2. ANÁLISIS DE VARIANZA (ANVA)', mx, y)
  y += 7

  const anovaHeaders = ['Fuente de Variación', 'G.L.', 'S.C.', 'C.M.', 'F calculado', 'F tab. (0.05)', 'P-valor', 'Signif.']
  const anovaRows = analysis.anova.fuentes.map(f => [
    f.fuente,
    String(f.gl),
    f.sc.toFixed(4),
    f.cm !== null ? f.cm.toFixed(4) : '—',
    f.fcalculado !== null ? f.fcalculado.toFixed(3) : '—',
    f.ftabulado !== null ? f.ftabulado.toFixed(3) : '—',
    f.pValor !== null ? f.pValor.toFixed(4) : '—',
    f.significancia || '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [anovaHeaders],
    body: anovaRows,
    theme: 'grid',
    headStyles: { fillColor: C.greenMid, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: C.text },
    alternateRowStyles: { fillColor: C.cream },
    margin: { left: mx, right: mx },
    columnStyles: { 0: { cellWidth: 52 } },
  })

  y = (doc as any).lastAutoTable.finalY + 6

  // CV info box
  const cvCat = cvCategory(analysis.anova.cv)
  drawRect(mx, y, pw - 2 * mx, 12, C.cream)
  setFont('bold', 9)
  setColor(C.green)
  addText(`Media General: ${analysis.anova.mediaGeneral.toFixed(3)}   |   CV = ${analysis.anova.cv.toFixed(2)}%  (${cvCat.label})`, mx + 4, y + 8)
  y += 18

  // Section: Mean Comparisons
  setFont('bold', 12)
  setColor(C.green)
  addText(`3. COMPARACIÓN DE MEDIAS — ${analysis.metodo.toUpperCase()} (α=0.05)`, mx, y)
  y += 7

  const compHeaders = ['Tratamiento', 'Media', 'E.E.', 'Letras', '% vs Testigo']
  const compRows = analysis.comparacionMedias.map(c => [
    c.tratamiento,
    c.media.toFixed(3),
    c.error_estandar.toFixed(3),
    c.letras,
    c.diferenciaPctVsControl !== undefined ? `${c.diferenciaPctVsControl > 0 ? '+' : ''}${c.diferenciaPctVsControl}%` : '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [compHeaders],
    body: compRows,
    theme: 'grid',
    headStyles: { fillColor: C.greenMid, textColor: C.white, fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: C.text },
    alternateRowStyles: { fillColor: C.cream },
    margin: { left: mx, right: mx },
    columnStyles: { 0: { cellWidth: 65 }, 3: { halign: 'center', fontStyle: 'bold' } },
  })

  y = (doc as any).lastAutoTable.finalY + 4
  setFont('italic', 7.5)
  setColor(C.muted)
  addText('Medias ordenadas en forma descendente. Letras iguales indican que no existen diferencias estadísticas (Tukey/LSD α=0.05).', mx, y)

  // ─── Page 3: Interpretation & Conclusions ────────────────────────
  addPage()

  setFont('bold', 12)
  setColor(C.green)
  addText('4. INTERPRETACIÓN ESTADÍSTICA', mx, y)
  y += 8

  for (const msg of analysis.interpretacion) {
    setFont('normal', 9)
    setColor(C.text)
    const lines = doc.splitTextToSize(`• ${msg}`, pw - 2 * mx - 4)
    doc.text(lines, mx + 3, y)
    y += lines.length * 5.5 + 3
    if (y > ph - 30) addPage()
  }

  y += 5
  drawRect(mx, y, pw - 2 * mx, 0.5, C.greenLight)
  y += 10

  // Treatments summary
  setFont('bold', 12)
  setColor(C.green)
  addText('5. DETALLE DE TRATAMIENTOS', mx, y)
  y += 7

  const trtHeaders = ['Cód.', 'Descripción', 'Tipo', 'Dosis', 'Método']
  const trtRows = trial.tratamientos.map(t => [
    t.codigo,
    t.nombre,
    t.tipo.replace('_', ' '),
    t.dosis ? `${t.dosis} ${t.unidadDosis ?? ''}` : '—',
    t.metodoAplicacion ?? '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [trtHeaders],
    body: trtRows,
    theme: 'grid',
    headStyles: { fillColor: C.green, textColor: C.white, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: C.text },
    alternateRowStyles: { fillColor: C.cream },
    margin: { left: mx, right: mx },
    columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 70 } },
  })

  y = (doc as any).lastAutoTable.finalY + 12

  // Validity assessment
  setFont('bold', 11)
  setColor(C.green)
  addText('6. VALIDEZ DEL ENSAYO', mx, y)
  y += 8

  const validityItems = [
    ['CV del experimento', `${analysis.anova.cv.toFixed(1)}% — ${cvCategory(analysis.anova.cv).label}`],
    ['Diseño experimental', trial.diseno.tipo],
    ['Número de repeticiones', `${trial.diseno.numRepeticiones} rep/tratamiento`],
    ['Tamaño de parcela', `${trial.diseno.tamanioParcela} ${trial.diseno.unidadArea}`],
    ['Área total del ensayo', trial.diseno.areaTotal ? `${trial.diseno.areaTotal} ha` : 'N/E'],
    ['Significancia (ANOVA)', analysis.anova.fuentes.find(f => f.fuente === 'Tratamientos')?.significancia ?? 'n/a'],
  ]

  for (const [label, value] of validityItems) {
    setFont('bold', 9)
    setColor(C.green)
    addText(label + ':', mx + 3, y)
    setFont('normal', 9)
    setColor(C.text)
    addText(value, mx + 65, y)
    y += 6.5
  }

  // Footer note
  y = ph - 25
  drawRect(mx, y, pw - 2 * mx, 0.3, C.greenLight)
  y += 5
  setFont('italic', 7)
  setColor(C.muted)
  addText('Informe generado automáticamente por el Sistema de Ensayos de Lignoquim S.A.', mx, y)
  addText('Los resultados estadísticos se basan en las observaciones registradas en campo. Confidencial.', mx, y + 4)

  if (config.firmante) {
    setFont('normal', 8)
    setColor(C.text)
    addText(`____________________________`, pw - mx - 40, y - 5, { align: 'right' })
    addText(config.firmante, pw - mx - 40, y, { align: 'right' })
    if (config.cargo) addText(config.cargo, pw - mx - 40, y + 4, { align: 'right' })
  }

  doc.save(`Informe_${trial.codigo}_${variableName.replace(/\s+/g, '_')}.pdf`)
}
