// src/pages/Settings.jsx
import React, { useState, useContext, useRef } from 'react'
import { Icon, ICONS } from '../components/UI.jsx'
import { Select, SelectItem } from '../components/Primitives.jsx'
import { BrandingContext, DEFAULT_BRANDING } from '../lib/branding.js'
import TemplateManager from '../components/TemplateManager.jsx'
import TechnicianManager from '../components/TechnicianManager.jsx'
import { INDUSTRY_OPTIONS } from '../lib/reportMeta.js'

const TABS = [
  { id: 'branding',   label: 'Branding',   icon: ICONS.wrench     },
  { id: 'empresa',    label: 'Empresa',     icon: ICONS.settings   },
  { id: 'tecnicos',   label: 'Técnicos',    icon: ICONS.users      },
  { id: 'plantillas', label: 'Plantillas',  icon: ICONS.clipboard  },
]

function LogoUploadSlot({ label, badge, preview, previewStyle, dragging, onDragOver, onDragLeave, onDrop, onClick, onClear }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        {badge && <span style={{ fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 4, padding: '1px 6px', fontWeight: 500 }}>{badge}</span>}
      </div>
      {preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...previewStyle, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6, boxSizing: 'border-box' }}>
            <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: 11.5 }} onClick={onClick}>Cambiar</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.2)', fontSize: 11.5 }} onClick={onClear}>
              <Icon path={ICONS.trash} size={11} stroke="var(--danger)" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={onClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          style={{ minHeight: 72, border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-light)'}`, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', transition: 'border-color .15s, background .15s', background: dragging ? 'var(--accent-soft)' : 'var(--bg)' }}
          onMouseEnter={e => { if (!dragging) e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = 'var(--border-light)' }}>
          <Icon path={ICONS.share} size={15} stroke={dragging ? 'var(--accent)' : 'var(--text-muted)'} />
          <p style={{ fontSize: 12, color: dragging ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500 }}>
            {dragging ? 'Suelta aquí' : 'Subir imagen'}
          </p>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>PNG, JPG, SVG, WEBP · máx. 1 MB</p>
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const { branding, setBranding } = useContext(BrandingContext)
  const [tab,              setTab]              = useState('branding')
  const [form,             setForm]             = useState({ appName: branding.appName, appSlogan: branding.appSlogan })
  const [logoIcon,         setLogoIcon]         = useState(branding.logoDataUrl)
  const [logoIconDark,     setLogoIconDark]     = useState(branding.logoDarkDataUrl)
  const [logoFull,         setLogoFull]         = useState(branding.logoFullDataUrl)
  const [logoFullDark,     setLogoFullDark]     = useState(branding.logoFullDarkDataUrl)
  const [industry,         setIndustry]         = useState(branding.industry || 'GENERAL')
  const [saved,            setSaved]            = useState(false)
  const [draggingIcon,     setDraggingIcon]     = useState(false)
  const [draggingIconDark, setDraggingIconDark] = useState(false)
  const [draggingFull,     setDraggingFull]     = useState(false)
  const [draggingFullDark, setDraggingFullDark] = useState(false)
  const fileIconRef     = useRef()
  const fileIconDarkRef = useRef()
  const fileFullRef     = useRef()
  const fileFullDarkRef = useRef()

  const makeFileHandler = (setter) => (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 1024 * 1024) { alert('El logo no puede superar 1 MB'); return }
    const reader = new FileReader()
    reader.onload = e => setter(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSaveBranding = () => {
    setBranding({ ...branding, appName: form.appName.trim() || DEFAULT_BRANDING.appName, appSlogan: form.appSlogan.trim(), logoDataUrl: logoIcon, logoDarkDataUrl: logoIconDark, logoFullDataUrl: logoFull, logoFullDarkDataUrl: logoFullDark })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleSaveEmpresa = () => {
    setBranding({ ...branding, industry })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    setForm({ appName: DEFAULT_BRANDING.appName, appSlogan: DEFAULT_BRANDING.appSlogan })
    setLogoIcon(null); setLogoIconDark(null)
    setLogoFull(null); setLogoFullDark(null)
  }

  return (
    <div className="animate-up" style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.03em' }}>Configuración</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>Personaliza la apariencia y plantillas de la aplicación.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--surface)', borderRadius: 10, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400, fontSize: 13, background: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? 'white' : 'var(--text-muted)', transition: 'all .15s' }}>
            <Icon path={t.icon} size={14} stroke={tab === t.id ? 'white' : 'var(--text-muted)'} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Branding tab ── */}
      {tab === 'branding' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Branding</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>El nombre y el logo aparecen en la barra lateral y en la pantalla de inicio de sesión.</p>
          </div>

          {/* Logo ícono (sidebar colapsada, mobile) */}
          <div>
            <label className="label" style={{ marginBottom: 4 }}>Logo ícono <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— sidebar colapsada, mobile</span></label>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10 }}>Imagen cuadrada. Si no hay variante oscura, se invierte automáticamente en modo oscuro.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Modo claro */}
              <LogoUploadSlot
                label="Modo claro"
                preview={logoIcon}
                previewStyle={{ width: 48, height: 48 }}
                dragging={draggingIcon}
                onDragOver={e => { e.preventDefault(); setDraggingIcon(true) }}
                onDragLeave={() => setDraggingIcon(false)}
                onDrop={e => { e.preventDefault(); setDraggingIcon(false); makeFileHandler(setLogoIcon)(e.dataTransfer.files[0]) }}
                onClick={() => fileIconRef.current.click()}
                onClear={() => setLogoIcon(null)}
              />
              {/* Modo oscuro */}
              <LogoUploadSlot
                label="Modo oscuro (opcional)"
                badge="auto-invert si vacío"
                preview={logoIconDark}
                previewStyle={{ width: 48, height: 48, background: '#1a1a2e' }}
                dragging={draggingIconDark}
                onDragOver={e => { e.preventDefault(); setDraggingIconDark(true) }}
                onDragLeave={() => setDraggingIconDark(false)}
                onDrop={e => { e.preventDefault(); setDraggingIconDark(false); makeFileHandler(setLogoIconDark)(e.dataTransfer.files[0]) }}
                onClick={() => fileIconDarkRef.current.click()}
                onClear={() => setLogoIconDark(null)}
              />
            </div>
            <input ref={fileIconRef}     type="file" accept="image/*" style={{ display: 'none' }} onChange={e => makeFileHandler(setLogoIcon)(e.target.files[0])} />
            <input ref={fileIconDarkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => makeFileHandler(setLogoIconDark)(e.target.files[0])} />
          </div>

          {/* Logo completo (sidebar expandida, PDFs, login) */}
          <div>
            <label className="label" style={{ marginBottom: 4 }}>Logo completo <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— sidebar expandida, PDFs, login</span></label>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 10 }}>Logo horizontal. Si no hay variante oscura, se invierte automáticamente en modo oscuro.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Modo claro */}
              <LogoUploadSlot
                label="Modo claro"
                preview={logoFull}
                previewStyle={{ width: '100%', height: 52 }}
                dragging={draggingFull}
                onDragOver={e => { e.preventDefault(); setDraggingFull(true) }}
                onDragLeave={() => setDraggingFull(false)}
                onDrop={e => { e.preventDefault(); setDraggingFull(false); makeFileHandler(setLogoFull)(e.dataTransfer.files[0]) }}
                onClick={() => fileFullRef.current.click()}
                onClear={() => setLogoFull(null)}
              />
              {/* Modo oscuro */}
              <LogoUploadSlot
                label="Modo oscuro (opcional)"
                badge="auto-invert si vacío"
                preview={logoFullDark}
                previewStyle={{ width: '100%', height: 52, background: '#1a1a2e' }}
                dragging={draggingFullDark}
                onDragOver={e => { e.preventDefault(); setDraggingFullDark(true) }}
                onDragLeave={() => setDraggingFullDark(false)}
                onDrop={e => { e.preventDefault(); setDraggingFullDark(false); makeFileHandler(setLogoFullDark)(e.dataTransfer.files[0]) }}
                onClick={() => fileFullDarkRef.current.click()}
                onClear={() => setLogoFullDark(null)}
              />
            </div>
            <input ref={fileFullRef}     type="file" accept="image/*" style={{ display: 'none' }} onChange={e => makeFileHandler(setLogoFull)(e.target.files[0])} />
            <input ref={fileFullDarkRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => makeFileHandler(setLogoFullDark)(e.target.files[0])} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label className="label">Nombre de la aplicación</label>
              <input className="input" value={form.appName} onChange={e => setForm(p => ({ ...p, appName: e.target.value }))} placeholder="MantTrack" maxLength={40} />
            </div>
            <div className="field">
              <label className="label">Subtítulo / slogan</label>
              <input className="input" value={form.appSlogan} onChange={e => setForm(p => ({ ...p, appSlogan: e.target.value }))} placeholder="Gestión de Mantenimiento" maxLength={60} />
            </div>
          </div>

          {/* Preview sidebar */}
          <div>
            <label className="label" style={{ marginBottom: 10 }}>Vista previa — barra lateral</label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Modo claro', bg: 'var(--bg)', border: 'var(--border)', iconSrc: logoIcon, fullSrc: logoFull || logoIcon, iconFilter: undefined, fullFilter: undefined },
                { label: 'Modo oscuro', bg: '#111827', border: '#374151', iconSrc: logoIconDark || logoIcon, fullSrc: logoFullDark || logoIconDark || logoFull || logoIcon, iconFilter: (!logoIconDark && logoIcon) ? 'brightness(0) invert(1)' : undefined, fullFilter: (!logoFullDark && !logoIconDark && (logoFull || logoIcon)) ? 'brightness(0) invert(1)' : undefined },
              ].map(({ label, bg, border, iconSrc, fullSrc, iconFilter, fullFilter }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Colapsada */}
                    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 10px', display: 'inline-flex', alignItems: 'center' }}>
                      <div style={{ width: 24, height: 24, background: iconSrc ? 'transparent' : 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {iconSrc
                          ? <img src={iconSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: iconFilter }} />
                          : <Icon path={ICONS.wrench} size={12} stroke="white" strokeWidth={2} />
                        }
                      </div>
                    </div>
                    {/* Expandida */}
                    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                      {fullSrc ? (
                        <img src={fullSrc} alt="" style={{ maxWidth: 120, maxHeight: 28, objectFit: 'contain', filter: fullFilter }} />
                      ) : (
                        <>
                          <div style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon path={ICONS.wrench} size={12} stroke="white" strokeWidth={2} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '-.02em', color: bg === 'var(--bg)' ? 'var(--text)' : '#f9fafb' }}>{form.appName || DEFAULT_BRANDING.appName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              <Icon path={ICONS.refresh} size={12} /> Restaurar por defecto
            </button>
            <div style={{ flex: 1 }} />
            {saved && <span style={{ fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon path={ICONS.check} size={14} stroke="var(--success)" strokeWidth={2.5} />Guardado</span>}
            <button className="btn btn-primary" onClick={handleSaveBranding}>Guardar cambios</button>
          </div>
        </div>
      )}

      {/* ── Empresa tab ── */}
      {tab === 'empresa' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Configuración de la empresa</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Indica el rubro de la empresa para que el sistema pre-cargue las plantillas de checklist correspondientes.</p>
          </div>

          <div className="field" style={{ maxWidth: 340 }}>
            <label className="label">Rubro / Industria</label>
            <Select value={industry} onValueChange={setIndustry}>
              {INDUSTRY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </Select>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>
              El rubro seleccionado filtra las plantillas disponibles al crear nuevos reportes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }} />
            {saved && <span style={{ fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon path={ICONS.check} size={14} stroke="var(--success)" strokeWidth={2.5} />Guardado</span>}
            <button className="btn btn-primary" onClick={handleSaveEmpresa}>Guardar cambios</button>
          </div>
        </div>
      )}

      {/* ── Plantillas tab ── */}
      {tab === 'plantillas' && (
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Plantillas de checklist</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Edita las plantillas del sistema o crea las tuyas propias. Solo las plantillas del sistema no pueden eliminarse.</p>
          </div>
          <TemplateManager />
        </div>
      )}

      {tab === 'tecnicos' && (
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Técnicos</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Crea usuarios, asigna derechos y limita equipos para el trabajo de campo.</p>
          </div>
          <TechnicianManager />
        </div>
      )}
    </div>
  )
}
