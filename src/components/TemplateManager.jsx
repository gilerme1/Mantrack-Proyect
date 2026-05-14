// src/components/TemplateManager.jsx
import React, { useState, useEffect } from 'react'
import { Icon, ICONS } from './UI.jsx'
import { Select, SelectItem } from './Primitives.jsx'
import { templatesAPI } from '../lib/api.js'
import { INDUSTRY_OPTIONS, EQUIPMENT_TYPE_LABEL } from '../lib/reportMeta.js'

const REPORT_TYPE_OPTIONS = [
  { value: 'MAINTENANCE',  label: 'Mantenimiento' },
  { value: 'INSTALLATION', label: 'Instalación'   },
  { value: 'PREVENTIVO',   label: 'Preventivo'    },
  { value: 'CORRECTIVO',   label: 'Correctivo'    },
  { value: 'INSPECCION',   label: 'Inspección'    },
]

const EQUIPMENT_TYPE_OPTIONS = [
  { value: '',          label: 'General / Otro' },
  { value: 'AC_SPLIT',  label: 'Aire Acondicionado Split' },
  { value: 'COLD_ROOM', label: 'Cámara de Frío'  },
  { value: 'CCTV',      label: 'Sistema CCTV'    },
  { value: 'VEHICLE',   label: 'Vehículo'        },
  { value: 'INDUSTRIAL',label: 'Equipo Industrial'},
]

function blankTemplate() {
  return {
    name: '', industry: 'GENERAL', equipmentType: '', reportType: 'MAINTENANCE',
    sections: [{ title: 'Sección 1', items: [{ label: '', type: 'CHECK', required: false }] }],
  }
}

export default function TemplateManager() {
  const [templates, setTemplates]   = useState([])
  const [loading,   setLoading]     = useState(true)
  const [editing,   setEditing]     = useState(null) // null | template obj (with sections)
  const [saving,    setSaving]      = useState(false)
  const [deleting,  setDeleting]    = useState(null)
  const [filterInd, setFilterInd]   = useState('')
  const [error,     setError]       = useState(null)

  const load = () => {
    setLoading(true)
    templatesAPI.list().then(setTemplates).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = templates.filter(t => !filterInd || t.industry === filterInd)

  const handleNew = () => setEditing(blankTemplate())

  const handleEdit = (t) => {
    // Deep clone so we can edit without mutating state
    setEditing(JSON.parse(JSON.stringify(t)))
  }

  const handleSave = async () => {
    if (!editing.name.trim()) { setError('El nombre es requerido'); return }
    setSaving(true); setError(null)
    try {
      if (editing.id) {
        await templatesAPI.update(editing.id, editing)
      } else {
        await templatesAPI.create(editing)
      }
      setEditing(null)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try { await templatesAPI.delete(id); load() }
    catch (err) { alert(err.message) }
    finally { setDeleting(null) }
  }

  // Section & item helpers
  const addSection = () => setEditing(e => ({
    ...e, sections: [...e.sections, { title: `Sección ${e.sections.length + 1}`, items: [{ label: '', type: 'CHECK', required: false }] }],
  }))

  const removeSection = (si) => setEditing(e => ({ ...e, sections: e.sections.filter((_, i) => i !== si) }))

  const updateSection = (si, key, val) => setEditing(e => ({
    ...e, sections: e.sections.map((s, i) => i === si ? { ...s, [key]: val } : s),
  }))

  const addItem = (si) => setEditing(e => ({
    ...e, sections: e.sections.map((s, i) => i === si ? { ...s, items: [...s.items, { label: '', type: 'CHECK', required: false }] } : s),
  }))

  const removeItem = (si, ii) => setEditing(e => ({
    ...e, sections: e.sections.map((s, i) => i === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s),
  }))

  const updateItem = (si, ii, key, val) => setEditing(e => ({
    ...e, sections: e.sections.map((s, i) => i === si ? {
      ...s, items: s.items.map((item, j) => j === ii ? { ...item, [key]: val } : item)
    } : s),
  }))

  // ── Editor view ──────────────────────────────────────────────────────────
  if (editing) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
          <Icon path={ICONS.chevLeft} size={13} /> Volver
        </button>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>
          {editing.id ? 'Editar plantilla' : 'Nueva plantilla'}
          {editing.isSystem && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 4, padding: '2px 6px', verticalAlign: 'middle' }}>Sistema</span>}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label className="label">Nombre de la plantilla *</label>
          <input className="input" value={editing.name} onChange={e => setEditing(v => ({ ...v, name: e.target.value }))} placeholder="Ej: Mantenimiento Split – Verano" />
        </div>
        <div className="field">
          <label className="label">Rubro / Industria</label>
          <Select value={editing.industry} onValueChange={v => setEditing(e => ({ ...e, industry: v }))}>
            {INDUSTRY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </Select>
        </div>
        <div className="field">
          <label className="label">Tipo de equipo</label>
          <Select
            value={editing.equipmentType || '__none__'}
            onValueChange={v => setEditing(e => ({ ...e, equipmentType: v === '__none__' ? '' : v }))}
          >
            <SelectItem value="__none__">General / Otro</SelectItem>
            {EQUIPMENT_TYPE_OPTIONS.filter(o => o.value !== '').map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </Select>
        </div>
        <div className="field">
          <label className="label">Tipo de reporte</label>
          <Select value={editing.reportType} onValueChange={v => setEditing(e => ({ ...e, reportType: v }))}>
            {REPORT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </Select>
        </div>
      </div>

      {/* Sections */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label className="label" style={{ margin: 0 }}>Secciones del checklist</label>
          <button className="btn btn-ghost btn-sm" onClick={addSection}>
            <Icon path={ICONS.plus} size={13} /> Agregar sección
          </button>
        </div>

        {editing.sections.map((section, si) => (
          <div key={si} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12, background: 'var(--surface-hover)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <input className="input" value={section.title}
                onChange={e => updateSection(si, 'title', e.target.value)}
                placeholder={`Sección ${si + 1}`}
                style={{ flex: 1, fontWeight: 600 }} />
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeSection(si)}
                style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.2)' }}
                disabled={editing.sections.length <= 1}>
                <Icon path={ICONS.trash} size={13} stroke="var(--danger)" />
              </button>
            </div>

            {section.items.map((item, ii) => (
              <div key={ii} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ width: 110, flexShrink: 0 }}>
                  <Select value={item.type} onValueChange={v => updateItem(si, ii, 'type', v)}>
                    <SelectItem value="CHECK">Checkbox</SelectItem>
                    <SelectItem value="TEXT">Texto</SelectItem>
                    <SelectItem value="NUMBER">Número</SelectItem>
                  </Select>
                </div>
                <input className="input" value={item.label} onChange={e => updateItem(si, ii, 'label', e.target.value)}
                  placeholder="Descripción del ítem..." style={{ flex: 1, fontSize: 13 }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-muted)', flexShrink: 0, cursor: 'pointer' }}>
                  <input type="checkbox" checked={item.required} onChange={e => updateItem(si, ii, 'required', e.target.checked)} />
                  Req.
                </label>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItem(si, ii)}
                  disabled={section.items.length <= 1}>
                  <Icon path={ICONS.close} size={12} stroke="var(--text-muted)" />
                </button>
              </div>
            ))}

            <button className="btn btn-ghost btn-sm" onClick={() => addItem(si)} style={{ marginTop: 4 }}>
              <Icon path={ICONS.plus} size={12} /> Agregar ítem
            </button>
          </div>
        ))}
      </div>

      {error && <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--danger)' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Guardando...</> : <><Icon path={ICONS.check} size={14} /> Guardar plantilla</>}
        </button>
      </div>
    </div>
  )

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ width: 220 }}>
          <Select value={filterInd || 'all'} onValueChange={v => setFilterInd(v === 'all' ? '' : v)}>
            <SelectItem value="all">Todos los rubros</SelectItem>
            {INDUSTRY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </Select>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={handleNew}>
          <Icon path={ICONS.plus} size={13} /> Nueva plantilla
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
          <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
          <Icon path={ICONS.clipboard} size={28} stroke="var(--text-muted)" />
          <p style={{ marginTop: 8, fontSize: 13 }}>No hay plantillas. Crea una nueva.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', background: 'var(--surface-hover)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <Icon path={ICONS.clipboard} size={16} stroke="var(--accent)" style={{ marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13.5 }}>{t.name}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {INDUSTRY_OPTIONS.find(i => i.value === t.industry)?.label || t.industry}
                  {t.equipmentType && ` · ${EQUIPMENT_TYPE_LABEL[t.equipmentType] || t.equipmentType}`}
                  {' · '}{t.sections?.length || 0} secciones
                  {' · '}{t.sections?.reduce((a, s) => a + (s.items?.length || 0), 0)} ítems
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {t.isSystem && <span style={{ fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 4, padding: '2px 6px' }}>Sistema</span>}
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(t)}>
                  <Icon path={ICONS.edit} size={13} />
                </button>
                {!t.isSystem && (
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                    style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.15)' }}>
                    {deleting === t.id
                      ? <div className="spin" style={{ width: 12, height: 12, border: '2px solid var(--danger)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      : <Icon path={ICONS.trash} size={13} stroke="var(--danger)" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
