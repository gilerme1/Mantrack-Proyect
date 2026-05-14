// src/pages/QRPage.jsx
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Icon, ICONS, StatusBadge } from '../components/UI.jsx'
import { BrandingContext } from '../lib/branding.js'
import { equipmentAPI, openQRAPI } from '../lib/api.js'
import useIsMobile from '../hooks/useIsMobile.js'

/* ─── Premium QR renderer ────────────────────────────────────────────
   Data modules: rounded squares almost filling each cell → fluid, not dotted
   Finder eyes: native ctx.roundRect() → no trapezoid distortion
   Logo: centered square with white padding
──────────────────────────────────────────────────────────────────── */
async function drawStyledQR(canvas, text, { size = 200, dark = '#111111', light = '#FFFFFF', logoSrc = null } = {}) {
  const QRCode = await import('qrcode')
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' })
  const n  = qr.modules.size
  const mg = 2
  const m  = size / (n + mg * 2)

  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = light
  ctx.fillRect(0, 0, size, size)

  const isEye = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  // ── Data modules: rounded squares, tiny gap → fluid not dotted ──
  const gap = m * 0.12
  const ds  = m - gap
  const dr  = ds * 0.32

  ctx.fillStyle = dark
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.modules.data[r * n + c] || isEye(r, c)) continue
      const x = (c + mg) * m + gap / 2
      const y = (r + mg) * m + gap / 2
      ctx.beginPath()
      ctx.roundRect(x, y, ds, ds, dr)
      ctx.fill()
    }
  }

  // ── Finder "eyes" — three concentric rounded squares ────────────
  const drawEye = (row, col) => {
    const ox = (col + mg) * m
    const oy = (row + mg) * m
    const sz = 7 * m
    const ro = sz * 0.22       // outer corner radius ≈ 1.54 modules
    const ri = (5 * m) * 0.18 // inner white ring radius
    const rc = (3 * m) * 0.25 // center square radius

    ctx.fillStyle = dark
    ctx.beginPath(); ctx.roundRect(ox, oy, sz, sz, ro); ctx.fill()

    ctx.fillStyle = light
    ctx.beginPath(); ctx.roundRect(ox + m, oy + m, 5 * m, 5 * m, ri); ctx.fill()

    ctx.fillStyle = dark
    ctx.beginPath(); ctx.roundRect(ox + 2 * m, oy + 2 * m, 3 * m, 3 * m, rc); ctx.fill()
  }

  drawEye(0,     0    )
  drawEye(0,     n - 7)
  drawEye(n - 7, 0    )

  // ── Logo ─────────────────────────────────────────────────────────
  if (logoSrc) {
    const la  = m * 7
    const lx  = (size - la) / 2
    const ly  = (size - la) / 2
    const pad = m

    ctx.fillStyle = light
    ctx.beginPath(); ctx.roundRect(lx - pad, ly - pad, la + pad * 2, la + pad * 2, m * 0.8); ctx.fill()

    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = logoSrc
    })
    ctx.save()
    ctx.beginPath(); ctx.roundRect(lx, ly, la, la, m * 0.6); ctx.clip()
    ctx.drawImage(img, lx, ly, la, la)
    ctx.restore()
  }
}

async function styledQRDataUrl(text, opts = {}) {
  const canvas = document.createElement('canvas')
  await drawStyledQR(canvas, text, opts)
  return canvas.toDataURL('image/png')
}

function QRCanvas({ text, size = 120 }) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const { branding } = useContext(BrandingContext)

  useEffect(() => {
    let active = true
    if (!ref.current) return
    drawStyledQR(ref.current, text, {
      size,
      dark: '#111111', light: '#FFFFFF',
      logoSrc: branding.logoDataUrl || null,
    }).then(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [text, size, branding.logoDataUrl])

  return (
    <div style={{ position: 'relative' }}>
      <canvas ref={ref} style={{ borderRadius: 10, display: 'block' }} />
      {!loaded && <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', borderRadius: 10 }} className="skeleton" />}
    </div>
  )
}

// Opens a printable window with QR label cards
async function printLabels(equipmentList, logoSrc = null) {
  const origin = window.location.origin

  const cards = await Promise.all(equipmentList.map(async eq => {
    const url    = `${origin}/equipo/${eq.id}`
    const dataUrl = await styledQRDataUrl(url, { size: 280, logoSrc })
    return { eq, dataUrl, url }
  }))

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Activa las ventanas emergentes para imprimir.'); return }

  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Etiquetas QR — MantTrack</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; }

    .header { text-align: center; padding: 0 0 8mm; border-bottom: 1px solid #e5e5e5; margin-bottom: 8mm; }
    .header h1 { font-size: 16pt; font-weight: 700; letter-spacing: -.03em; }
    .header p  { font-size: 9pt; color: #888; margin-top: 2mm; }

    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }

    .card {
      border: 1.5px solid #ddd;
      border-radius: 8px;
      padding: 5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .card:hover { border-color: #6366f1; }

    .qr-wrap { border: 1px solid #eee; border-radius: 6px; padding: 3mm; background: #fff; }
    .qr-wrap img { width: 44mm; height: 44mm; display: block; }

    .equip-name { font-size: 10pt; font-weight: 700; text-align: center; line-height: 1.3; }
    .equip-meta { font-size: 7.5pt; color: #555; text-align: center; line-height: 1.5; }
    .equip-serial { font-family: monospace; font-size: 7.5pt; color: #333; background: #f5f5f5; padding: 0.5mm 2mm; border-radius: 3px; }
    .equip-url  { font-size: 6pt; color: #aaa; text-align: center; word-break: break-all; margin-top: 1mm; }

    .divider { width: 100%; height: 1px; background: #eee; }

    @media print {
      .no-print { display: none !important; }
    }

    .no-print { text-align: center; padding: 8mm 0 4mm; }
    .no-print button {
      background: #6366f1; color: white; border: none;
      padding: 8px 24px; border-radius: 8px; font-size: 14px;
      cursor: pointer; font-weight: 600; margin: 0 4px;
    }
    .no-print button.ghost { background: transparent; color: #6366f1; border: 1.5px solid #6366f1; }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Imprimir etiquetas</button>
    <button class="ghost" onclick="window.close()">Cerrar</button>
  </div>

  <div class="header">
    <h1>Etiquetas QR — MantTrack</h1>
    <p>${cards.length} equipo${cards.length !== 1 ? 's' : ''} · ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
  </div>

  <div class="grid">
    ${cards.map(({ eq, dataUrl, url }) => `
      <div class="card">
        <div class="qr-wrap">
          <img src="${dataUrl}" alt="QR ${eq.name}" />
        </div>
        <p class="equip-name">${eq.name}</p>
        ${eq.model ? `<p class="equip-meta">${eq.model}</p>` : ''}
        ${eq.plate ? `<span class="equip-serial">Matr. ${eq.plate}</span>` : ''}
        ${eq.serial ? `<span class="equip-serial">#${eq.serial}</span>` : ''}
        <p class="equip-meta">${eq.client?.name || ''}</p>
        <div class="divider"></div>
        <p class="equip-url">${url}</p>
      </div>
    `).join('')}
  </div>
</body>
</html>`)
  win.document.close()
}

// ─── Open QR section ─────────────────────────────────────────────────────────
function OpenQRSection({ isMobile, onOpenEquipment }) {
  const [openQRs,   setOpenQRs]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [generating,setGenerating]= useState(false)
  const [count,     setCount]     = useState(10)
  const [label,     setLabel]     = useState('')
  const [printing,  setPrinting]  = useState(false)
  const { branding } = useContext(BrandingContext)

  const load = () => {
    setLoading(true)
    openQRAPI.list().then(setOpenQRs).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await openQRAPI.generate(count, label || null)
      setLabel('')
      load()
    } catch (e) { alert(e.message) }
    finally { setGenerating(false) }
  }

  const handleDelete = async (id) => {
    try { await openQRAPI.delete(id); load() }
    catch (e) { alert(e.message) }
  }

  const handlePrintOpen = async (list) => {
    if (!list.length) return
    setPrinting(true)
    const origin = window.location.origin
    const logo   = branding.logoDataUrl || null
    const cards  = await Promise.all(list.map(async qr => {
      const url     = `${origin}/qr/${qr.id}`
      const dataUrl = await styledQRDataUrl(url, { size: 280, logoSrc: logo })
      return { qr, dataUrl, url }
    }))
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { alert('Activa las ventanas emergentes para imprimir.'); setPrinting(false); return }
    const batch = list[0]?.label ? ` · ${list[0].label}` : ''
    win.document.write(`<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<title>QRs abiertos — MantTrack</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #fff; color: #111; }
  .header { text-align: center; padding: 0 0 8mm; border-bottom: 1px solid #e5e5e5; margin-bottom: 8mm; }
  .header h1 { font-size: 16pt; font-weight: 700; }
  .header p  { font-size: 9pt; color: #888; margin-top: 2mm; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
  .card { border: 1.5px dashed #ccc; border-radius: 8px; padding: 4mm; display: flex; flex-direction: column; align-items: center; gap: 2mm; break-inside: avoid; }
  .qr-wrap img { width: 36mm; height: 36mm; display: block; }
  .badge { font-size: 7pt; background: #f0f0ff; color: #6366f1; border-radius: 3px; padding: 1mm 2mm; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }
  .code { font-family: monospace; font-size: 6pt; color: #aaa; }
  .no-print { text-align: center; padding: 8mm 0 4mm; }
  .no-print button { background: #6366f1; color: #fff; border: none; padding: 8px 24px; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600; margin: 0 4px; }
  .no-print button.ghost { background: transparent; color: #6366f1; border: 1.5px solid #6366f1; }
  @media print { .no-print { display: none !important; } }
</style></head><body>
<div class="no-print">
  <button onclick="window.print()">🖨️ Imprimir plancha</button>
  <button class="ghost" onclick="window.close()">Cerrar</button>
</div>
<div class="header">
  <h1>QRs abiertos — MantTrack${batch}</h1>
  <p>${cards.length} etiquetas · ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
</div>
<div class="grid">
  ${cards.map(({ qr, dataUrl }) => `
    <div class="card">
      <div class="qr-wrap"><img src="${dataUrl}" /></div>
      <span class="badge">Sin asignar</span>
      <span class="code">${qr.id.slice(0,12)}</span>
    </div>
  `).join('')}
</div>
</body></html>`)
    win.document.close()
    setPrinting(false)
  }

  const unassigned = openQRs.filter(q => !q.equipmentId)
  const assigned   = openQRs.filter(q =>  q.equipmentId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Generator */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 16 : 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon path={ICONS.plus} size={18} stroke="var(--accent)" strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700 }}>Generar plancha de QRs</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>QRs sin equipo asignado, listos para imprimir y llevar al campo</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '0 0 120px' }}>
            <label className="label">Cantidad</label>
            <input
              className="input"
              type="number" min="1" max="100"
              value={count}
              onChange={e => setCount(Math.min(100, Math.max(1, parseInt(e.target.value)||1)))}
              style={{ height: isMobile ? 44 : undefined }}
            />
          </div>
          <div className="field" style={{ flex: '1 1 160px' }}>
            <label className="label">Etiqueta / lote (opcional)</label>
            <input
              className="input"
              placeholder="Ej. Planta Norte – Mayo 2025"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{ height: isMobile ? 44 : undefined }}
            />
          </div>
          <div className="field" style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ height: isMobile ? 44 : 38 }}
            >
              {generating
                ? <div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                : <Icon path={ICONS.plus} size={14} stroke="white" strokeWidth={2.5} />
              }
              Generar {count} QR{count !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned QRs */}
      {!loading && unassigned.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700 }}>Sin asignar <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({unassigned.length})</span></p>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>Listos para imprimir y llevar al campo</p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handlePrintOpen(unassigned)}
              disabled={printing}
              style={{ height: 36 }}
            >
              <Icon path={ICONS.download} size={13} stroke="white" strokeWidth={2} />
              {isMobile ? 'Imprimir' : 'Imprimir plancha'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(auto-fill,minmax(140px,1fr))', gap: 8 }}>
            {unassigned.map(qr => (
              <div key={qr.id} style={{ background: 'var(--surface)', border: '1.5px dashed var(--border-light)', borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <QRCanvas text={`${window.location.origin}/qr/${qr.id}`} size={isMobile ? 68 : 80} />
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <p style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {qr.id.slice(0, 10)}…
                  </p>
                  {qr.label && (
                    <p style={{ fontSize: 9.5, color: 'var(--accent)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qr.label}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, width: '100%' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, justifyContent: 'center', padding: '4px 0', fontSize: 10.5 }}
                    onClick={() => handlePrintOpen([qr])}
                  >
                    <Icon path={ICONS.download} size={11} strokeWidth={2} />
                    Imprimir
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.15)', padding: '4px 6px' }}
                    onClick={() => handleDelete(qr.id)}
                  >
                    <Icon path={ICONS.trash} size={11} stroke="var(--danger)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned QRs */}
      {!loading && assigned.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            Asignados <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({assigned.length})</span>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assigned.map(qr => (
              <div key={qr.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 4, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }}>
                  <QRCanvas text={`${window.location.origin}/qr/${qr.id}`} size={isMobile ? 52 : 60} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qr.equipment?.name}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>{qr.equipment?.client?.name}</p>
                  <StatusBadge status={qr.equipment?.status} />
                </div>
                {onOpenEquipment && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flexShrink: 0, gap: 5 }}
                    onClick={() => onOpenEquipment(qr.equipmentId)}
                    title="Ver equipo"
                  >
                    <Icon path={ICONS.equipment} size={13} strokeWidth={2} />
                    {!isMobile && 'Ver equipo'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}
        </div>
      )}

      {!loading && openQRs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
          <Icon path={ICONS.qr} size={32} stroke="var(--text-muted)" />
          <p style={{ marginTop: 10, fontSize: 13 }}>No hay QRs abiertos todavía.<br />Genera una plancha para comenzar.</p>
        </div>
      )}
    </div>
  )
}

export default function QRPage({ onOpenEquipment }) {
  const [equipment, setEquipment] = useState([])
  const [search,    setSearch]    = useState('')
  const [printing,  setPrinting]  = useState(false)
  const [tab,       setTab]       = useState('open')  // 'open' | 'equipment'
  const isMobile = useIsMobile()
  const { branding } = useContext(BrandingContext)

  useEffect(() => { equipmentAPI.list().then(setEquipment) }, [])

  const filtered = equipment.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.client?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.serial || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.plate || '').toLowerCase().includes(search.toLowerCase())
  )

  const qrURL = (eq) => `${window.location.origin}/equipo/${eq.id}`
  const logo  = branding.logoDataUrl || null

  const downloadQR = async (eq) => {
    const dataUrl = await styledQRDataUrl(qrURL(eq), { size: 600, logoSrc: logo })
    const a = document.createElement('a')
    a.download = `QR-${eq.name}.png`
    a.href = dataUrl
    a.click()
  }

  const handlePrintAll = async () => {
    if (filtered.length === 0) return
    setPrinting(true)
    await printLabels(filtered, logo).catch(() => {})
    setPrinting(false)
  }

  const handlePrintOne = async (eq) => {
    setPrinting(true)
    await printLabels([eq], logo).catch(() => {})
    setPrinting(false)
  }

  return (
    <div className="animate-up" style={{ padding: isMobile ? '16px 12px' : 24 }}>

      {/* Info banner */}
      <div style={{
        background: 'var(--accent-soft)',
        border: '1px solid rgba(99,102,241,.2)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 20,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <Icon path={ICONS.smartphone} size={18} stroke="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}>Acceso por QR desde campo</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Imprime las etiquetas y pégalas en los equipos. Al escanear, el técnico accede directamente al historial y puede registrar reportes en el acto.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
        <button
          onClick={() => setTab('open')}
          className={`btn btn-sm ${tab === 'open' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, justifyContent: 'center', gap: 6 }}
        >
          <Icon path={ICONS.qr} size={13} stroke={tab === 'open' ? 'white' : 'var(--text-secondary)'} strokeWidth={2} />
          QRs abiertos
        </button>
        <button
          onClick={() => setTab('equipment')}
          className={`btn btn-sm ${tab === 'equipment' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ flex: 1, justifyContent: 'center', gap: 6 }}
        >
          <Icon path={ICONS.equipment} size={13} stroke={tab === 'equipment' ? 'white' : 'var(--text-secondary)'} strokeWidth={2} />
          Por equipo
        </button>
      </div>

      {/* Open QRs tab */}
      {tab === 'open' && <OpenQRSection isMobile={isMobile} onOpenEquipment={onOpenEquipment} />}

      {/* Equipment QRs tab */}
      {tab === 'equipment' && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-icon-wrapper" style={{ flex: '1 1 180px', minWidth: 0 }}>
              <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
              <input
                className="input"
                placeholder="Buscar por nombre, cliente o serie..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: isMobile ? 44 : undefined }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handlePrintAll}
              disabled={printing || filtered.length === 0}
              style={{ height: isMobile ? 44 : undefined, flexShrink: 0 }}
            >
              {printing
                ? <div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                : <Icon path={ICONS.download} size={14} stroke="white" strokeWidth={2} />
              }
              {isMobile ? `Imprimir (${filtered.length})` : `Imprimir todas las etiquetas (${filtered.length})`}
            </button>
          </div>

          {/* QR grid */}
          {filtered.length === 0 && equipment.length > 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
              <Icon path={ICONS.search} size={28} stroke="var(--text-muted)" />
              <p style={{ marginTop: 10, fontSize: 14 }}>No se encontraron equipos.</p>
            </div>
          )}

          {filtered.length === 0 && equipment.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>
              <Icon path={ICONS.equipment} size={32} stroke="var(--text-muted)" />
              <p style={{ marginTop: 10, fontSize: 14 }}>No hay equipos registrados.</p>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill,minmax(160px,1fr))'
              : 'repeat(auto-fill,minmax(220px,1fr))',
            gap: isMobile ? 10 : 14,
          }}>
            {filtered.map(eq => (
              <div key={eq.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: isMobile ? 14 : 20,
                textAlign: 'center',
              }}>
                {/* QR code */}
                <div style={{ padding: 8, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <QRCanvas text={qrURL(eq)} size={isMobile ? 90 : 110} />
                </div>

                {/* Equipment info */}
                <div style={{ width: '100%' }}>
                  <p style={{ fontSize: isMobile ? 13 : 13.5, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{eq.name}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.client?.name}</p>
                  {(eq.serial || eq.plate) && (
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', background: 'var(--surface-hover)', color: 'var(--text-secondary)', borderRadius: 4, padding: '2px 6px' }}>
                      {[eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>

                <StatusBadge status={eq.status} />

                {/* URL preview */}
                <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '5px 8px', width: '100%' }}>
                  <p style={{ fontSize: 9.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {qrURL(eq)}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handlePrintOne(eq)}
                    title="Imprimir etiqueta"
                  >
                    <Icon path={ICONS.download} size={12} stroke="white" strokeWidth={2} />
                    {isMobile ? 'Imprimir' : 'Imprimir etiqueta'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => downloadQR(eq)}
                    title="Descargar PNG"
                  >
                    <Icon path={ICONS.share} size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => navigator.clipboard?.writeText(qrURL(eq)).then(() => alert('URL copiada'))}
                    title="Copiar URL"
                  >
                    <Icon path={ICONS.clipboard} size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
