// src/lib/pdfGenerator.js — ultra-premium redesign
import jsPDF from 'jspdf'
import { REPORT_TYPE_LABEL } from './reportMeta.js'

/* ─────────────────────────────────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────────────────────────────────── */
const C = {
  ink:        [15,  15,  20 ],
  ink2:       [65,  65,  85 ],
  muted:      [140, 140, 162],
  line:       [215, 215, 228],
  lineSoft:   [235, 235, 245],
  surface:    [247, 247, 252],
  white:      [255, 255, 255],
  accent:     [70,  75,  200],
  accentDk:   [48,  52,  160],
  accentSoft: [230, 232, 252],
  ok:         [20,  158, 68 ],
  okBg:       [218, 252, 228],
  okTxt:      [15,  78,  38 ],
  warn:       [172,  98,   0],
  warnBg:     [255, 242, 195],
  warnTxt:    [138,  58,   8],
  err:        [178,  24,  24],
  errBg:      [253, 224, 224],
  errTxt:     [148,  18,  18],
  none:       [ 92, 102, 122],
  noneBg:     [238, 240, 248],
  noneTxt:    [ 62,  72,  94],
}

/* ─────────────────────────────────────────────────────────────────────────
   Page geometry — single source of truth
───────────────────────────────────────────────────────────────────────── */
const PW  = 210                  // A4 width  mm
const PH  = 297                  // A4 height mm
const ML  = 22                   // left  margin mm
const MR  = 22                   // right margin mm
const CW  = PW - ML - MR         // 166 mm content width

const HDR_H  = 16                // header band height
const HDR_A  = 2                 // accent strip inside header
const CTOP   = HDR_H + 14       // 30 mm — first content y on every page

// Footer: solid band at bottom — text centered inside, well away from edge
const FTR_Y  = 260               // top of footer band
const FTR_H  = PH - FTR_Y       // 37 mm band height
const FTR_MID = FTR_Y + FTR_H / 2 + 1.5  // ≈ 280 mm — text baseline (17 mm from bottom)

const BRK    = FTR_Y - 8        // 252 mm — content hard stop (8 mm buffer above band)

const IMG_W  = (CW - 8) / 2     // 79 mm — photo column
const IMG_H  = Math.round(IMG_W * 0.68)  // ≈ 54 mm
const IMG_ROW = IMG_H + 16      // ≈ 70 mm — row height inc. caption gap

/* ─────────────────────────────────────────────────────────────────────────
   Low-level drawing helpers
───────────────────────────────────────────────────────────────────────── */
const f   = (d, c) => d.setFillColor(...c)
const dc  = (d, c) => d.setDrawColor(...c)
const tc  = (d, c) => d.setTextColor(...c)
const lw  = (d, w) => d.setLineWidth(w)
const csp = (d, n) => { try { d.setCharSpace(n) } catch (_) {} }
const B   = (d, s) => { d.setFont('helvetica', 'bold');   d.setFontSize(s) }
const N   = (d, s) => { d.setFont('helvetica', 'normal'); d.setFontSize(s) }
const tx  = (d, s, x, y, o) => d.text(String(s ?? '—'), x, y, o)

/* ─────────────────────────────────────────────────────────────────────────
   Date helpers
───────────────────────────────────────────────────────────────────────── */
function fmt(date) {
  if (!date) return '—'
  const dt = typeof date === 'string' ? new Date(date) : date
  return isNaN(dt) ? '—' : dt.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtLong(date) {
  if (!date) return '—'
  const dt = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dt)) return '—'
  return dt.toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysFromNow(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : Math.round((d - Date.now()) / 86400000)
}

function safeParseJson(str) {
  try { return str ? JSON.parse(str) : null } catch { return null }
}

/* ─────────────────────────────────────────────────────────────────────────
   Image helpers
───────────────────────────────────────────────────────────────────────── */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = reject
    img.src     = src
  })
}

function getImageFormat(src) {
  if (!src) return 'JPEG'
  const s = String(src).toLowerCase()
  if (s.includes('data:image/png') || s.endsWith('.png'))   return 'PNG'
  if (s.includes('data:image/webp') || s.endsWith('.webp')) return 'WEBP'
  if (s.includes('data:image/gif') || s.endsWith('.gif'))   return 'GIF'
  return 'JPEG'
}

function removeEdgeWhiteBackground(imageData) {
  const { data, width, height } = imageData
  const seen  = new Uint8Array(width * height)
  const queue = []
  const isWhiteish = idx => {
    const i = idx * 4
    return data[i + 3] > 0 && data[i] > 244 && data[i + 1] > 244 && data[i + 2] > 244
  }
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (seen[idx] || !isWhiteish(idx)) return
    seen[idx] = 1; queue.push(idx)
  }
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1) }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y) }
  while (queue.length) {
    const idx = queue.pop()
    data[idx * 4 + 3] = 0
    const x = idx % width, y = Math.floor(idx / width)
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1)
  }
}

async function transparentLogoDataUrl(src, maxSize = 512) {
  if (!src) return null
  try {
    const img = await loadImage(src)
    if (!img || img.width <= 0 || img.height <= 0) return null
    const scale  = Math.min(maxSize / img.width, maxSize / img.height, 1) || 1
    const canvas = document.createElement('canvas')
    canvas.width  = Math.max(1, Math.round(img.width  * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height)
    removeEdgeWhiteBackground(id)
    ctx.putImageData(id, 0, 0)
    return canvas.toDataURL('image/png')
  } catch (err) {
    console.warn('Logo processing failed:', err)
    return null
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Badge (centered on cx, clamped to margins)
───────────────────────────────────────────────────────────────────────── */
function badge(doc, cx, cy, text, bg, textColor, fs = 6.5) {
  B(doc, fs)
  const tw = doc.getTextWidth(text)
  const bw = tw + 8,  bh = 5.5
  const bx = Math.max(ML, Math.min(cx - bw / 2, PW - MR - bw))
  const by = cy - bh / 2
  f(doc, bg); dc(doc, bg); lw(doc, 0.1)
  doc.roundedRect(bx, by, bw, bh, 1.5, 1.5, 'FD')
  tc(doc, textColor)
  tx(doc, text, bx + bw / 2, by + 3.8, { align: 'center' })
}

function statusBadge(doc, cx, cy, status, fs = 6.5) {
  const MAP = {
    COMPLETED:   ['Completado',  C.okBg,      C.okTxt  ],
    PENDING:     ['Pendiente',   C.warnBg,    C.warnTxt],
    IN_PROGRESS: ['En progreso', C.accentSoft, C.accent ],
  }
  const [label, bg, color] = MAP[status] || [status, C.noneBg, C.noneTxt]
  badge(doc, cx, cy, label, bg, color, fs)
}

/* ─────────────────────────────────────────────────────────────────────────
   Cover page
───────────────────────────────────────────────────────────────────────── */
async function drawCover(doc, branding, report) {
  // White canvas
  f(doc, C.white); doc.rect(0, 0, PW, PH, 'F')

  // Hero band — top 75 mm
  const HERO = 75
  f(doc, C.accent); doc.rect(0, 0, PW, HERO, 'F')
  f(doc, C.accentDk); doc.rect(0, HERO - 4, PW, 4, 'F')

  // ── Logo (inside hero, top-left) ──────────────────────────────────
  let logoBottom = HERO - 14
  if (branding?.logoDataUrl) {
    try {
      const img = await loadImage(branding.logoDataUrl)
      if (img && img.width > 0 && img.height > 0) {
        const maxW = 46, maxH = 18
        const ratio  = Math.min(maxW / img.width, maxH / img.height, 1)
        const lw_mm  = Math.max(8, Math.round(img.width  * ratio))
        const lh_mm  = Math.max(5, Math.round(img.height * ratio))
        doc.addImage(branding.logoDataUrl, getImageFormat(branding.logoDataUrl),
                     ML, 11, lw_mm, lh_mm, undefined, 'FAST')
        logoBottom = 11 + lh_mm + 4
      }
    } catch (err) { console.warn('Cover logo failed:', err) }
  }

  B(doc, 10); tc(doc, [255, 255, 255])
  tx(doc, branding?.appName || 'MantTrack', ML, Math.max(logoBottom + 7, 24))
  N(doc, 7);  tc(doc, [200, 202, 238])
  tx(doc, branding?.appSlogan || 'Gestión de Mantenimiento', ML, Math.max(logoBottom + 15, 32))

  // ── Document type label ───────────────────────────────────────────
  csp(doc, 2); N(doc, 6); tc(doc, [175, 178, 240])
  tx(doc, 'INFORME DE SERVICIO TÉCNICO', ML, HERO + 18)
  csp(doc, 0)

  // Thin accent rule below label
  f(doc, C.accent); doc.rect(ML, HERO + 22, 28, 0.7, 'F')

  // ── Equipment name ───────────────────────────────────────────────
  const equipName  = report.equipment?.name || 'Equipo'
  const equipLines = doc.splitTextToSize(equipName, CW).slice(0, 3)
  B(doc, 25); tc(doc, C.ink)
  doc.text(equipLines, ML, HERO + 40)
  const afterEquip = HERO + 40 + (equipLines.length - 1) * 9.6

  const typeLabel = REPORT_TYPE_LABEL[report.type] || report.type || ''
  N(doc, 10); tc(doc, C.ink2)
  tx(doc, typeLabel, ML, afterEquip + 13)

  // ── Info rule + three columns ─────────────────────────────────────
  const RULE1 = 195
  dc(doc, C.line); lw(doc, 0.3)
  doc.line(ML, RULE1, PW - MR, RULE1)

  const INFO_Y  = RULE1 + 8
  const col1    = ML
  const col2    = ML + CW * 0.37
  const col3    = ML + CW * 0.67
  const colMaxW = CW * 0.31

  const infos = [
    { x: col1, label: 'CLIENTE',           value: report.equipment?.client?.name || '—' },
    { x: col2, label: 'TÉCNICO',           value: report.tech?.name || '—'              },
    { x: col3, label: 'FECHA DE SERVICIO', value: fmtLong(report.createdAt)             },
  ]
  for (const { x, label, value } of infos) {
    csp(doc, 1.2); N(doc, 5.5); tc(doc, C.muted)
    tx(doc, label, x, INFO_Y + 6)
    csp(doc, 0); B(doc, 9.5); tc(doc, C.ink)
    const vl = doc.splitTextToSize(value, colMaxW)
    tx(doc, vl[0] + (vl.length > 1 ? '…' : ''), x, INFO_Y + 16)
  }

  // ── Report number + status ────────────────────────────────────────
  const RULE2 = 244
  dc(doc, C.line); lw(doc, 0.3)
  doc.line(ML, RULE2, PW - MR, RULE2)

  csp(doc, 1.2); N(doc, 5.5); tc(doc, C.muted)
  tx(doc, 'N° DE REPORTE', ML, RULE2 + 9)
  csp(doc, 0); B(doc, 12); tc(doc, C.ink)
  tx(doc, `#${report.id.slice(-8).toUpperCase()}`, ML, RULE2 + 21)

  N(doc, 5.5); tc(doc, C.muted)
  tx(doc, `Emitido el ${fmtLong(new Date())}`, PW - MR, RULE2 + 9, { align: 'right' })

  statusBadge(doc, ML + 95, RULE2 + 15, report.status, 7)

  // Accent bottom strip
  f(doc, C.accent); doc.rect(0, PH - 4, PW, 4, 'F')
}

/* ─────────────────────────────────────────────────────────────────────────
   Page header (content pages)
───────────────────────────────────────────────────────────────────────── */
function drawPageHeader(doc, branding, report) {
  f(doc, C.white); doc.rect(0, 0, PW, HDR_H, 'F')
  f(doc, C.accent); doc.rect(0, 0, PW, HDR_A, 'F')
  dc(doc, C.line); lw(doc, 0.2); doc.line(0, HDR_H, PW, HDR_H)

  const midY = (HDR_H + HDR_A) / 2 + 1.5  // vertically centred in usable header
  B(doc, 7.5); tc(doc, C.ink)
  tx(doc, branding?.appName || 'MantTrack', ML, midY)
  N(doc, 5.5); tc(doc, C.muted)
  tx(doc, `Reporte #${report.id.slice(-8).toUpperCase()}`, PW - MR, midY, { align: 'right' })
}

/* ─────────────────────────────────────────────────────────────────────────
   Page footer — solid surface band, page number centred inside
───────────────────────────────────────────────────────────────────────── */
function drawPageFooter(doc, branding, report, page, total) {
  // Solid footer band
  f(doc, C.surface); doc.rect(0, FTR_Y, PW, FTR_H, 'F')
  dc(doc, C.line); lw(doc, 0.25); doc.line(0, FTR_Y, PW, FTR_Y)

  csp(doc, 0)
  N(doc, 5.5); tc(doc, C.muted)
  tx(doc, branding?.appName || 'MantTrack', ML + 2, FTR_MID)
  tx(doc, report.equipment?.name || '', PW / 2, FTR_MID, { align: 'center' })

  B(doc, 7); tc(doc, C.ink2)
  tx(doc, `${page}  /  ${total}`, PW - MR - 2, FTR_MID, { align: 'right' })
}

/* ─────────────────────────────────────────────────────────────────────────
   Section heading
───────────────────────────────────────────────────────────────────────── */
function sectionHead(doc, label, y) {
  csp(doc, 1.5); N(doc, 6); tc(doc, C.accent)
  tx(doc, label, ML, y + 5.5)
  csp(doc, 0)
  dc(doc, C.line); lw(doc, 0.25)
  doc.line(ML, y + 9, PW - MR, y + 9)
  return y + 18
}

/* ─────────────────────────────────────────────────────────────────────────
   Info grid
───────────────────────────────────────────────────────────────────────── */
function drawInfoGrid(doc, report, startY) {
  const ROW_H = 16
  const colW  = CW / 2

  const model  = report.equipment?.model  || ''
  const serial = report.equipment?.serial || ''
  const plate  = report.equipment?.plate  || ''
  const modelStr = [model, plate && `Matr. ${plate}`, serial && `#${serial}`].filter(Boolean).join('  ·  ')
  const dateStr  = fmt(report.createdAt) + (report.duration ? `  ·  ${report.duration} min` : '')

  const rows = [
    [['EQUIPO',         report.equipment?.name || '—'],        ['TÉCNICO',           report.tech?.name || '—']],
    [['CLIENTE',        report.equipment?.client?.name || '—'],['TIPO DE SERVICIO',  REPORT_TYPE_LABEL[report.type] || '—']],
    [['UBICACIÓN',      report.equipment?.location || '—'],    ['FECHA DE SERVICIO', dateStr]],
    [['MODELO / SERIE', modelStr || '—'],                      ['ESTADO',            '__status__']],
  ]
  const H = rows.length * ROW_H

  // 1. White base
  f(doc, C.white); doc.rect(ML, startY, CW, H, 'F')
  // 2. Zebra (even rows)
  for (let i = 0; i < rows.length; i++) {
    if (i % 2 === 0) {
      f(doc, C.surface)
      doc.rect(ML + 0.3, startY + i * ROW_H + 0.3, CW - 0.6, ROW_H - 0.6, 'F')
    }
  }
  // 3. Outer border
  dc(doc, C.line); lw(doc, 0.3); doc.rect(ML, startY, CW, H, 'D')
  // 4. Centre vertical divider
  doc.line(ML + colW, startY, ML + colW, startY + H)
  // 5. Row dividers
  dc(doc, C.lineSoft); lw(doc, 0.15)
  for (let i = 1; i < rows.length; i++) {
    doc.line(ML, startY + i * ROW_H, ML + CW, startY + i * ROW_H)
  }
  // 6. Cell content
  for (let i = 0; i < rows.length; i++) {
    const ry = startY + i * ROW_H
    for (let c = 0; c < 2; c++) {
      const cx = ML + c * colW
      const [label, value] = rows[i][c]
      csp(doc, 0.7); N(doc, 5.5); tc(doc, C.muted)
      tx(doc, label, cx + 6, ry + 5.5)
      csp(doc, 0)
      if (value === '__status__') {
        statusBadge(doc, cx + colW / 2, ry + ROW_H / 2 + 1.5, report.status)
      } else {
        B(doc, 8); tc(doc, C.ink)
        const vl = doc.splitTextToSize(String(value), colW - 14)
        tx(doc, vl[0] + (vl.length > 1 ? '…' : ''), cx + 6, ry + 12.5)
      }
    }
  }
  return startY + H
}

/* ─────────────────────────────────────────────────────────────────────────
   Next maintenance band
───────────────────────────────────────────────────────────────────────── */
function drawNextMaint(doc, report, y) {
  const H    = 16
  const days = daysFromNow(report.equipment?.nextMaint)
  const date = fmt(report.equipment?.nextMaint)

  let bg, borderC, textC, badgeBg, badgeTxt, badgeLabel
  if (days === null) {
    bg = C.noneBg;  borderC = [210, 212, 222]; textC = C.none
    badgeBg = C.noneBg; badgeTxt = C.noneTxt; badgeLabel = 'No programado'
  } else if (days < 0) {
    bg = C.errBg;   borderC = [215, 100, 100]; textC = C.err
    badgeBg = C.errBg; badgeTxt = C.errTxt; badgeLabel = `Vencido hace ${Math.abs(days)} días`
  } else if (days <= 30) {
    bg = C.warnBg;  borderC = [215, 160, 60 ]; textC = C.warn
    badgeBg = C.warnBg; badgeTxt = C.warnTxt; badgeLabel = `En ${days} días`
  } else {
    bg = C.okBg;    borderC = [100, 195, 130]; textC = C.ok
    badgeBg = C.okBg; badgeTxt = C.okTxt; badgeLabel = `En ${days} días`
  }

  f(doc, bg); dc(doc, borderC); lw(doc, 0.25)
  doc.roundedRect(ML, y, CW, H, 2.5, 2.5, 'FD')

  csp(doc, 0.8); N(doc, 5.5); tc(doc, textC)
  tx(doc, 'PRÓXIMO CONTROL ESTIMADO', ML + 8, y + 5.5)
  csp(doc, 0); B(doc, 9); tc(doc, C.ink)
  tx(doc, date, ML + 8, y + 12.5)

  // Badge in right portion — centered at ≈75% of content width
  badge(doc, ML + CW * 0.77, y + H / 2, badgeLabel, badgeBg, badgeTxt)

  return y + H
}

/* ─────────────────────────────────────────────────────────────────────────
   Work done (paginated)
───────────────────────────────────────────────────────────────────────── */
function drawWorkDone(doc, notes, startY, pbFn) {
  const LINE_H  = 5.8
  const BOX_PAD = 16
  const PRE_GAP = 10
  const SECT_H  = 18

  let allLines = doc.splitTextToSize(notes, CW - 16)
  let y = startY

  while (allLines.length > 0) {
    if (y + PRE_GAP + SECT_H + LINE_H + BOX_PAD > BRK) { pbFn(); y = CTOP }
    const avail    = BRK - y - PRE_GAP - SECT_H - BOX_PAD
    const maxLines = Math.max(1, Math.floor(avail / LINE_H))
    const chunk    = allLines.splice(0, maxLines)
    const H        = Math.max(chunk.length * LINE_H + BOX_PAD, 26)

    y = sectionHead(doc, 'TRABAJO REALIZADO', y + PRE_GAP)

    f(doc, C.surface); dc(doc, C.line); lw(doc, 0.25)
    doc.rect(ML, y, CW, H, 'FD')
    f(doc, C.accent); doc.rect(ML, y, 3, H, 'F')

    N(doc, 8.5); tc(doc, C.ink2)
    doc.text(chunk, ML + 11, y + 10)
    y = y + H
  }
  return y
}

/* ─────────────────────────────────────────────────────────────────────────
   Checklist summary
───────────────────────────────────────────────────────────────────────── */
function drawChecklistSummary(doc, report, checklist, startY) {
  const y = startY + 10
  const H = 26

  f(doc, C.accentSoft); dc(doc, C.line); lw(doc, 0.25)
  doc.roundedRect(ML, y, CW, H, 2.5, 2.5, 'FD')

  const allItems = report.template.sections.flatMap(s => s.items)
  const total    = allItems.length
  const ok       = allItems.filter(i => checklist[i.id] === true).length
  const err      = allItems.filter(i => checklist[i.id] === false).length
  const pct      = total ? Math.round((ok / total) * 100) : 0

  csp(doc, 1.2); N(doc, 6); tc(doc, C.accent)
  tx(doc, 'RESUMEN DE VERIFICACIÓN', ML + 8, y + 8)
  csp(doc, 0)

  const bx = ML + 8, by = y + 14, bw = 65, bh = 3.5
  f(doc, C.line); doc.roundedRect(bx, by, bw, bh, 1.5, 1.5, 'F')
  if (pct > 0) {
    f(doc, pct >= 80 ? C.ok : pct >= 50 ? C.warn : C.err)
    doc.roundedRect(bx, by, bw * (pct / 100), bh, 1.5, 1.5, 'F')
  }
  B(doc, 10); tc(doc, C.accent)
  tx(doc, `${pct}%`, bx + bw + 6, by + 3.5)

  const stats = [
    { dot: C.ok,   text: `${ok} conformes`             },
    { dot: C.err,  text: `${err} no conformes`         },
    { dot: C.none, text: `${total - ok - err} sin ev.` },
  ]
  let sx = bx + bw + 22
  for (const s of stats) {
    f(doc, s.dot); doc.ellipse(sx + 1.8, y + 17, 1.3, 1.3, 'F')
    N(doc, 6); tc(doc, C.ink2)
    tx(doc, s.text, sx + 5, y + 18)
    sx += 5 + doc.getTextWidth(s.text) + 6
  }
  return y + H
}

/* ─────────────────────────────────────────────────────────────────────────
   Sub-section header
───────────────────────────────────────────────────────────────────────── */
function drawSubSection(doc, title, num, total, y) {
  const H = 10
  f(doc, C.surface); dc(doc, C.line); lw(doc, 0.2)
  doc.rect(ML, y, CW, H, 'FD')
  f(doc, C.accent); doc.rect(ML, y, 3, H, 'F')
  B(doc, 8); tc(doc, C.ink)
  tx(doc, title, ML + 10, y + 7)
  N(doc, 6); tc(doc, C.muted)
  tx(doc, `${num} / ${total}`, PW - MR, y + 7, { align: 'right' })
  return y + H
}

/* ─────────────────────────────────────────────────────────────────────────
   Checklist item
───────────────────────────────────────────────────────────────────────── */
const ITEM_H = 9
function drawItem(doc, item, val, idx, y) {
  if (idx % 2 === 0) {
    f(doc, C.surface); doc.rect(ML, y, CW, ITEM_H, 'F')
  }
  const isCheck = item.type === 'CHECK'
  const checkX  = ML + 10
  const cy      = y + ITEM_H / 2

  if (isCheck) {
    const col = val === true ? C.ok : val === false ? C.err : C.line
    f(doc, col === C.line ? C.white : col)
    dc(doc, col); lw(doc, 0.4)
    doc.roundedRect(checkX - 2.3, cy - 2.3, 4.6, 4.6, 1, 1, col === C.line ? 'D' : 'FD')
    if (val === true || val === false) {
      dc(doc, C.white); lw(doc, 0.55)
      if (val === true) {
        doc.line(checkX - 1, cy, checkX - 0.2, cy + 0.9)
        doc.line(checkX - 0.2, cy + 0.9, checkX + 1.2, cy - 0.9)
      } else {
        doc.line(checkX - 0.9, cy - 0.9, checkX + 0.9, cy + 0.9)
        doc.line(checkX + 0.9, cy - 0.9, checkX - 0.9, cy + 0.9)
      }
    }
  }

  N(doc, 8); tc(doc, C.ink)
  const labelW  = CW - 62
  const lLines  = doc.splitTextToSize(item.label, labelW)
  tx(doc, lLines[0] + (lLines.length > 1 ? '…' : ''), ML + 18, cy + 1.5)

  if (item.required) {
    B(doc, 7); tc(doc, C.err)
    tx(doc, '*', ML + 18 + doc.getTextWidth(lLines[0]) + 1, cy + 1.5)
  }

  if (isCheck) {
    const [label, bg, color] =
      val === true  ? ['Conforme',    C.okBg,   C.okTxt  ] :
      val === false ? ['No conforme', C.errBg,  C.errTxt ] :
                      ['Sin evaluar', C.noneBg, C.noneTxt]
    // badge centered: right portion of row, 14 mm inset from right margin
    badge(doc, PW - MR - 14, cy, label, bg, color)
  } else if (val) {
    N(doc, 8); tc(doc, C.ink2)
    tx(doc, String(val).slice(0, 30), PW - MR, cy + 1.5, { align: 'right' })
  }

  dc(doc, C.lineSoft); lw(doc, 0.15)
  doc.line(ML + 16, y + ITEM_H, PW - MR, y + ITEM_H)
  return y + ITEM_H
}

/* ─────────────────────────────────────────────────────────────────────────
   Photos
───────────────────────────────────────────────────────────────────────── */
function drawPhotos(doc, photos, startY, pbFn) {
  const GAP = 8
  let y = sectionHead(doc, 'REGISTRO FOTOGRÁFICO', startY)

  for (let row = 0; row < Math.ceil(photos.length / 2); row++) {
    if (y + IMG_ROW > BRK) {
      pbFn(); y = CTOP
      y = sectionHead(doc, 'REGISTRO FOTOGRÁFICO', y)
    }
    for (let col = 0; col < 2; col++) {
      const photo = photos[row * 2 + col]
      if (!photo) continue
      const x = ML + col * (IMG_W + GAP)
      try {
        const imgData = photo.dataUrl || photo
        if (!imgData) continue
        f(doc, C.surface); dc(doc, C.line); lw(doc, 0.2)
        doc.roundedRect(x, y, IMG_W, IMG_H, 2.5, 2.5, 'FD')
        doc.addImage(imgData, getImageFormat(imgData), x, y, IMG_W, IMG_H, undefined, 'FAST')
        dc(doc, C.line); lw(doc, 0.2)
        doc.roundedRect(x, y, IMG_W, IMG_H, 2.5, 2.5)
        if (photo.caption) {
          N(doc, 6.5); tc(doc, C.ink2)
          const cl = doc.splitTextToSize(photo.caption, IMG_W - 4)
          tx(doc, cl[0] + (cl.length > 1 ? '…' : ''), x + 2, y + IMG_H + 6)
        }
      } catch (err) { console.warn('Photo render failed:', err) }
    }
    y += IMG_ROW
  }
  return y
}

/* ─────────────────────────────────────────────────────────────────────────
   Signatures
───────────────────────────────────────────────────────────────────────── */
function drawSignatures(doc, report, startY) {
  let y = startY + 12
  csp(doc, 1.2); N(doc, 6); tc(doc, C.muted)
  tx(doc, 'CONFORMIDAD Y FIRMAS', ML, y)
  csp(doc, 0)
  dc(doc, C.line); lw(doc, 0.25)
  doc.line(ML, y + 5, PW - MR, y + 5)
  y += 14

  const bw = (CW - 12) / 2, bh = 36
  const box = (x, title, name) => {
    f(doc, C.surface); dc(doc, C.line); lw(doc, 0.25)
    doc.rect(x, y, bw, bh, 'FD')
    f(doc, C.accent); doc.rect(x, y, bw, 2, 'F')
    csp(doc, 0.7); N(doc, 5.5); tc(doc, C.muted)
    tx(doc, title, x + 6, y + 11)
    csp(doc, 0); B(doc, 9.5); tc(doc, C.ink)
    tx(doc, name, x + 6, y + 20)
    dc(doc, C.line); lw(doc, 0.3)
    doc.line(x + 6, y + 30, x + bw - 6, y + 30)
    N(doc, 6); tc(doc, C.muted)
    tx(doc, 'Firma', x + 6, y + 34.5)
  }

  box(ML,           'TÉCNICO RESPONSABLE',   report.tech?.name              || '—')
  box(ML + bw + 12, 'CLIENTE / RESPONSABLE', report.equipment?.client?.name || '—')
}

/* ─────────────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────────────── */
export async function generateReportPDF({ report, branding }) {
  let pdfBranding = branding
  if (branding?.logoDataUrl) {
    const processed = await transparentLogoDataUrl(branding.logoDataUrl, 512)
    pdfBranding = { ...branding, logoDataUrl: processed || branding.logoDataUrl }
  }

  const doc       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const checklist = safeParseJson(report.checklistJson)
  const photos    = safeParseJson(report.photosJson) || []
  let   y         = 0

  // ── Cover ────────────────────────────────────────────────────────
  await drawCover(doc, pdfBranding, report)

  // ── Content pages ────────────────────────────────────────────────
  doc.addPage()
  drawPageHeader(doc, pdfBranding, report)
  y = CTOP

  function pb() {
    doc.addPage()
    drawPageHeader(doc, pdfBranding, report)
    y = CTOP
  }

  // Service info grid
  y = drawInfoGrid(doc, report, y) + 8

  // Next maintenance
  if (y + 28 > BRK) pb()
  y = drawNextMaint(doc, report, y) + 8

  // Notes
  if (report.notes?.trim()) {
    y = drawWorkDone(doc, report.notes, y, pb) + 10
  }

  // Checklist
  if (checklist && report.template?.sections?.length) {
    if (y + 48 > BRK) pb()
    y = drawChecklistSummary(doc, report, checklist, y) + 2
    if (y + 36 > BRK) pb()
    y += 12
    y = sectionHead(doc, 'VERIFICACIÓN TÉCNICA', y)

    for (let si = 0; si < report.template.sections.length; si++) {
      const sec = report.template.sections[si]
      if (y + 24 > BRK) pb()
      y = drawSubSection(doc, sec.title, si + 1, report.template.sections.length, y) + 2
      for (const item of sec.items) {
        if (y + ITEM_H + 2 > BRK) pb()
        y = drawItem(doc, item, checklist[item.id], sec.items.indexOf(item), y)
      }
      y += 8
    }
  }

  // Photos
  if (photos.length > 0) {
    if (y + 12 + 18 + IMG_ROW > BRK) pb()
    y += 10
    y = drawPhotos(doc, photos, y, pb) + 6
  }

  // Signatures
  if (y + 68 > BRK) pb()
  drawSignatures(doc, report, y)

  // Stamp footer on all content pages
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    drawPageFooter(doc, pdfBranding, report, p - 1, totalPages - 1)
  }

  const filename = `reporte_${(report.equipment?.name || 'equipo').replace(/[\s/\\]+/g, '_')}_${report.id.slice(-6)}.pdf`
  doc.save(filename)
}
