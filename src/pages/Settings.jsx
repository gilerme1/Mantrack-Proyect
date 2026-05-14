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

export default function Settings() {
  const { branding, setBranding } = useContext(BrandingContext)
  const [tab,      setTab]      = useState('branding')
  const [form,     setForm]     = useState({ appName: branding.appName, appSlogan: branding.appSlogan })
  const [logo,     setLogo]     = useState(branding.logoDataUrl)
  const [industry, setIndustry] = useState(branding.industry || 'GENERAL')
  const [saved,    setSaved]    = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 1024 * 1024) { alert('El logo no puede superar 1 MB'); return }
    const reader = new FileReader()
    reader.onload = e => setLogo(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSaveBranding = () => {
    setBranding({ ...branding, appName: form.appName.trim() || DEFAULT_BRANDING.appName, appSlogan: form.appSlogan.trim(), logoDataUrl: logo })
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
    setLogo(null)
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

          {/* Logo upload */}
          <div>
            <label className="label" style={{ marginBottom: 10 }}>Logo de la empresa</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, borderRadius: 16, background: logo ? 'var(--bg)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: logo ? 'none' : '0 0 24px rgba(99,102,241,.3)', border: '1px solid var(--border)' }}>
                {logo
                  ? <img src={logo} alt="logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <Icon path={ICONS.wrench} size={32} stroke="white" strokeWidth={1.8} />
                }
              </div>
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                style={{ flex: 1, minWidth: 200, minHeight: 80, border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border-light)'}`, borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'border-color .15s, background .15s', background: dragging ? 'var(--accent-soft)' : 'var(--bg)' }}
                onMouseEnter={e => { if (!dragging) e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = 'var(--border-light)' }}>
                <Icon path={ICONS.share} size={18} stroke={dragging ? 'var(--accent)' : 'var(--text-muted)'} />
                <p style={{ fontSize: 13, color: dragging ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 500 }}>
                  {dragging ? 'Suelta aquí' : 'Arrastra o haz click para subir'}
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>PNG, JPG, SVG, WEBP · máx. 1 MB</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            {logo && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: 'var(--danger)', borderColor: 'rgba(239,68,68,.2)' }} onClick={() => setLogo(null)}>
                <Icon path={ICONS.trash} size={12} stroke="var(--danger)" /> Quitar logo
              </button>
            )}
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
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, background: logo ? 'transparent' : 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {logo
                  ? <img src={logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Icon path={ICONS.wrench} size={14} stroke="white" strokeWidth={2} />
                }
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-.02em' }}>{form.appName || DEFAULT_BRANDING.appName}</span>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -1 }}>v1.0</p>
              </div>
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
