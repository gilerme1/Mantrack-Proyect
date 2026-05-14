// src/pages/QRFieldView.jsx
// Shown when a technician scans an Open QR code in the field.
// If unassigned → form to create/link equipment.
// If assigned   → equipment detail with quick actions.
import React, { useState, useEffect } from 'react'
import { Icon, ICONS, StatusBadge, Modal } from '../components/UI.jsx'
import { Select, SelectItem } from '../components/Primitives.jsx'
import { openQRAPI, clientsAPI, equipmentAPI } from '../lib/api.js'
import ReportWizard from '../components/ReportWizard.jsx'

const SECTORS = ['Manufactura','Transporte','Minería','Alimentos','Salud','Construcción','Energía','Retail','Otro']

export default function QRFieldView({ qrId, setActive }) {
  const [qr,           setQR]           = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [clients,      setClients]      = useState([])
  const [mode,         setMode]         = useState('view')  // 'view' | 'create' | 'link'
  const [saving,       setSaving]       = useState(false)
  const [showWizard,   setShowWizard]   = useState(false)

  // Create form
  const [form, setForm] = useState({
    name: '', clientId: '', model: '', serial: '', plate: '', location: '', status: 'ACTIVE',
  })
  // Link form
  const [allEquipment, setAllEquipment] = useState([])
  const [linkSearch,   setLinkSearch]   = useState('')
  const [linkId,       setLinkId]       = useState('')

  useEffect(() => {
    if (!qrId) return
    setLoading(true)
    Promise.all([
      openQRAPI.get(qrId),
      clientsAPI.list(),
    ]).then(([q, c]) => {
      setQR(q)
      setClients(c)
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [qrId])

  const loadEquipment = async () => {
    const res = await equipmentAPI.list()
    setAllEquipment(Array.isArray(res) ? res : (res.equipment || []))
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.clientId) return
    setSaving(true)
    try {
      const updated = await openQRAPI.assignNew(qrId, form)
      setQR(updated)
      setMode('view')
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleLink = async () => {
    if (!linkId) return
    setSaving(true)
    try {
      const updated = await openQRAPI.assignExisting(qrId, linkId)
      setQR(updated)
      setMode('view')
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
      <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Verificando código QR...</p>
    </div>
  )

  if (error || !qr) return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--danger-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon path={ICONS.alert} size={26} stroke="var(--danger)" />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>QR no encontrado</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Este código QR no existe o fue eliminado.
        </p>
      </div>
      <button className="btn btn-ghost" onClick={() => setActive('dashboard')}>
        <Icon path={ICONS.chevLeft} size={14} /> Volver al inicio
      </button>
    </div>
  )

  /* ── ASSIGNED: show equipment detail ── */
  if (qr.equipment) {
    const eq = qr.equipment
    return (
      <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--success-soft)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 10 }}>
          <Icon path={ICONS.check} size={14} stroke="var(--success)" strokeWidth={2.5} />
          <p style={{ fontSize: 12.5, color: 'var(--success)', fontWeight: 500 }}>QR vinculado a equipo</p>
        </div>

        {/* Equipment card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon path={ICONS.wrench} size={22} stroke="var(--accent)" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 3 }}>{eq.name}</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{eq.client?.name}</p>
            </div>
            <StatusBadge status={eq.status} />
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {[
              { l: 'Modelo',      v: eq.model    || '—' },
              { l: 'N° Serie',    v: eq.serial   ? `#${eq.serial}` : '—' },
              { l: 'Matrícula',   v: eq.plate    || '—' },
              { l: 'Ubicación',   v: eq.location || '—' },
              { l: 'Reportes',    v: eq._count?.reports ?? '—' },
            ].map(f => (
              <div key={f.l} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{f.l}</p>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{f.v}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 50, fontSize: 15, fontWeight: 700 }}
              onClick={() => setShowWizard(true)}
            >
              <Icon path={ICONS.plus} size={18} stroke="white" strokeWidth={2.5} />
              Nuevo reporte
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center', height: 44 }}
                onClick={() => setActive('equipment')}
              >
                <Icon path={ICONS.eye} size={14} /> Ver en sistema
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center', height: 44 }}
                onClick={() => setActive('reports')}
              >
                <Icon path={ICONS.reports} size={14} /> Reportes
              </button>
            </div>
          </div>
        </div>

        {/* Report wizard */}
        <Modal open={showWizard} onClose={() => setShowWizard(false)} title="Nuevo reporte" maxWidth={580}>
          <ReportWizard
            prefillEquipId={eq.id}
            onClose={() => setShowWizard(false)}
            onSaved={() => setShowWizard(false)}
          />
        </Modal>
      </div>
    )
  }

  /* ── UNASSIGNED: create or link equipment ── */
  return (
    <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ background: 'var(--warning-soft)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon path={ICONS.qr} size={20} stroke="var(--warning)" strokeWidth={1.8} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)' }}>QR sin asignar</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
            {qr.label ? `Lote: ${qr.label}` : `Código: ${qr.id.slice(0, 8)}...`}
          </p>
        </div>
      </div>

      {/* Mode switcher */}
      {mode === 'view' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
            Este QR no tiene un equipo asignado todavía.<br />¿Qué deseas hacer?
          </p>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 52, fontSize: 15, fontWeight: 700 }}
            onClick={() => setMode('create')}
          >
            <Icon path={ICONS.plus} size={18} stroke="white" strokeWidth={2.5} />
            Crear nuevo equipo aquí
          </button>

          <button
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', height: 48 }}
            onClick={() => { setMode('link'); loadEquipment() }}
          >
            <Icon path={ICONS.equipment} size={15} />
            Vincular a equipo existente
          </button>
        </div>
      )}

      {/* Create new equipment */}
      {mode === 'create' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setMode('view')} style={{ padding: 6 }}>
              <Icon path={ICONS.chevLeft} size={16} />
            </button>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Nuevo equipo</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="label">Nombre del equipo *</label>
              <input className="input mobile-input" placeholder="Ej. Compresor Atlas C-12" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div className="field">
              <label className="label">Cliente / lugar *</label>
              <Select value={form.clientId} onValueChange={v => setForm(p=>({...p,clientId:v}))} placeholder="Seleccionar...">
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </Select>
            </div>
            <div className="field">
              <label className="label">Modelo</label>
              <input className="input mobile-input" placeholder="Marca y modelo" value={form.model} onChange={e => setForm(p=>({...p,model:e.target.value}))} />
            </div>
            <div className="field">
              <label className="label">N° de serie</label>
              <input className="input mobile-input" placeholder="Número de serie..." value={form.serial} onChange={e => setForm(p=>({...p,serial:e.target.value}))} />
            </div>
            <div className="field">
              <label className="label">Matrícula</label>
              <input className="input mobile-input" placeholder="Ej. ABC 1234" value={form.plate} onChange={e => setForm(p=>({...p,plate:e.target.value.toUpperCase()}))} />
            </div>
            <div className="field">
              <label className="label">Ubicación</label>
              <input className="input mobile-input" placeholder="Ej. Sala de máquinas piso 2" value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} />
            </div>
            <div className="field">
              <label className="label">Estado</label>
              <Select value={form.status} onValueChange={v => setForm(p=>({...p,status:v}))}>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="SCHEDULED">Programado</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </Select>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', height: 50, fontSize: 15, fontWeight: 700, marginTop: 4 }}
              onClick={handleCreate}
              disabled={!form.name.trim() || !form.clientId || saving}
            >
              {saving
                ? <><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Guardando...</>
                : <><Icon path={ICONS.check} size={16} stroke="white" strokeWidth={2.5} /> Crear y vincular QR</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Link to existing equipment */}
      {mode === 'link' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setMode('view')} style={{ padding: 6 }}>
              <Icon path={ICONS.chevLeft} size={16} />
            </button>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Vincular equipo existente</h3>
          </div>

          <div className="input-icon-wrapper" style={{ marginBottom: 12 }}>
            <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
            <input
              className="input"
              placeholder="Buscar equipo..."
              value={linkSearch}
              onChange={e => setLinkSearch(e.target.value)}
              style={{ height: 44 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
            {allEquipment
              .filter(eq =>
                !linkSearch ||
                eq.name.toLowerCase().includes(linkSearch.toLowerCase()) ||
                (eq.serial || '').toLowerCase().includes(linkSearch.toLowerCase()) ||
                (eq.plate || '').toLowerCase().includes(linkSearch.toLowerCase()) ||
                (eq.client?.name || '').toLowerCase().includes(linkSearch.toLowerCase())
              )
              .map(eq => (
                <div
                  key={eq.id}
                  onClick={() => setLinkId(eq.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1.5px solid ${linkId === eq.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: linkId === eq.id ? 'var(--accent-soft)' : 'var(--surface-hover)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon path={ICONS.wrench} size={15} stroke="var(--accent)" strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{[eq.client?.name, eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`].filter(Boolean).join(' · ')}</p>
                  </div>
                  {linkId === eq.id && <Icon path={ICONS.check} size={16} stroke="var(--accent)" strokeWidth={2.5} />}
                </div>
              ))
            }
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 50, fontSize: 15, fontWeight: 700 }}
            onClick={handleLink}
            disabled={!linkId || saving}
          >
            {saving
              ? <><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Vinculando...</>
              : <><Icon path={ICONS.check} size={16} stroke="white" strokeWidth={2.5} /> Vincular QR a este equipo</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
