// src/components/ReportWizard.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Icon, ICONS } from './UI.jsx'
import { Select, SelectItem, DatePicker } from './Primitives.jsx'
import { equipmentAPI, auth as authAPI, templatesAPI, reportsAPI } from '../lib/api.js'
import { INDUSTRY_OPTIONS, EQUIPMENT_TYPE_LABEL } from '../lib/reportMeta.js'
import useIsMobile from '../hooks/useIsMobile.js'

const REPORT_TYPES = [
  { value: 'MAINTENANCE',  label: 'Mantenimiento', icon: ICONS.wrench   },
  { value: 'INSTALLATION', label: 'Instalación',   icon: ICONS.layers   },
  { value: 'PREVENTIVO',   label: 'Preventivo',    icon: ICONS.check    },
  { value: 'CORRECTIVO',   label: 'Correctivo',    icon: ICONS.alert    },
  { value: 'INSPECCION',   label: 'Inspección',    icon: ICONS.eye      },
]

const STEPS = [
  { label: 'Equipo',    icon: ICONS.equipment },
  { label: 'Plantilla', icon: ICONS.clipboard },
  { label: 'Checklist', icon: ICONS.check     },
  { label: 'Fotos',     icon: ICONS.camera    },
]

const PHOTO_MAX_EDGE = 1600
const PHOTO_WEBP_QUALITY = 0.78
const PHOTO_MAX_SOURCE_SIZE = 30 * 1024 * 1024

function safeParseJson(str, fallback) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function loadImageFromFile(file) {
  const objectUrl = URL.createObjectURL(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = objectUrl
  })
}

async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Some mobile browsers do not support options for createImageBitmap.
    }
  }
  return loadImageFromFile(file)
}

async function compressPhoto(file) {
  if (!file.type.startsWith('image/')) return null
  if (file.size > PHOTO_MAX_SOURCE_SIZE) {
    throw new Error(`${file.name} supera ${formatFileSize(PHOTO_MAX_SOURCE_SIZE)}.`)
  }

  const image = await decodeImage(file)
  const sourceWidth = image.width
  const sourceHeight = image.height
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.drawImage(image, 0, 0, width, height)
  image.close?.()

  let blob = await canvasToBlob(canvas, 'image/webp', PHOTO_WEBP_QUALITY)
  let mimeType = 'image/webp'
  if (!blob) {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.82)
    mimeType = 'image/jpeg'
  }
  if (!blob) throw new Error(`No se pudo convertir ${file.name}.`)

  return {
    dataUrl: await blobToDataUrl(blob),
    caption: '',
    name: file.name,
    mimeType,
    originalSize: file.size,
    size: blob.size,
    width,
    height,
  }
}

export default function ReportWizard({ onClose, onSaved, prefillEquipId, editingReport }) {
  const [step,      setStep]      = useState(0)
  const [equipment, setEquipment] = useState([])
  const [users,     setUsers]     = useState([])
  const [templates, setTemplates] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState(null)
  const photoInputRef = useRef()

  const isMobile = useIsMobile()

  const [equipId,  setEquipId]  = useState(prefillEquipId || '')
  const [techId,   setTechId]   = useState('')
  const [type,     setType]     = useState('MAINTENANCE')
  const [date,     setDate]     = useState(() => new Date().toISOString().slice(0,10))
  const [duration, setDuration] = useState('')
  const [status,   setStatus]   = useState('COMPLETED')

  const [templateId, setTemplateId] = useState('')
  const [checklist,  setChecklist]  = useState({})
  const [photos,     setPhotos]     = useState([])
  const [processingPhotos, setProcessingPhotos] = useState(false)
  const [notes,      setNotes]      = useState('')

  useEffect(() => {
    if (!editingReport) return
    setEquipId(editingReport.equipmentId || editingReport.equipment?.id || '')
    setTechId(editingReport.techId || editingReport.tech?.id || '')
    setType(editingReport.type || 'MAINTENANCE')
    setDate(editingReport.createdAt ? new Date(editingReport.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
    setDuration(editingReport.duration ? String(editingReport.duration) : '')
    setStatus(editingReport.status || 'COMPLETED')
    setTemplateId(editingReport.templateId || editingReport.template?.id || '')
    setChecklist(safeParseJson(editingReport.checklistJson, {}) || {})
    setPhotos(safeParseJson(editingReport.photosJson, []) || [])
    setNotes(editingReport.notes || '')
  }, [editingReport])

  useEffect(() => {
    setLoading(true)
    Promise.all([equipmentAPI.list(), authAPI.users()])
      .then(([eqRes, uRes]) => {
        setEquipment(Array.isArray(eqRes) ? eqRes : (eqRes.equipment || eqRes))
        setUsers(uRes)
      }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!type) return
    const reportType = ['MAINTENANCE','INSTALLATION','PREVENTIVO','CORRECTIVO','INSPECCION'].includes(type) ? type : 'MAINTENANCE'
    templatesAPI.list({ reportType }).then(setTemplates).catch(() => {})
  }, [type])

  const selectedTemplate = templates.find(t => t.id === templateId)

  const handlePhotoFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(file => file.type.startsWith('image/'))
    if (!files.length) return
    setProcessingPhotos(true)
    setError(null)
    try {
      const converted = []
      for (const file of files) {
        const photo = await compressPhoto(file)
        if (photo) converted.push(photo)
      }
      setPhotos(p => [...p, ...converted])
    } catch (err) {
      setError(err.message || 'No se pudieron procesar las imágenes.')
    } finally {
      setProcessingPhotos(false)
    }
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const payload = {
        equipmentId:   equipId,
        techId,
        type,
        status,
        duration:      duration ? parseInt(duration) : null,
        templateId:    templateId || null,
        checklistJson: Object.keys(checklist).length ? JSON.stringify(checklist) : null,
        photosJson:    photos.length ? JSON.stringify(photos) : null,
        notes:         notes.trim() || null,
      }
      if (editingReport?.id) await reportsAPI.update(editingReport.id, payload)
      else await reportsAPI.create(payload)
      onSaved?.()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const canNext = [
    equipId && techId && type,
    true, true, true,
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, position: 'relative' }}>
            {i > 0 && (
              <div style={{ position: 'absolute', left: 0, top: 14, height: 2, width: '50%', background: i <= step ? 'var(--accent)' : 'var(--border)' }} />
            )}
            {i < STEPS.length - 1 && (
              <div style={{ position: 'absolute', right: 0, top: 14, height: 2, width: '50%', background: i < step ? 'var(--accent)' : 'var(--border)' }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i <= step ? 'var(--accent)' : 'var(--surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', zIndex: 1, transition: 'background .2s',
              border: i === step ? '2px solid rgba(99,102,241,.4)' : 'none',
              boxShadow: i === step ? '0 0 12px rgba(99,102,241,.35)' : 'none',
            }}>
              {i < step
                ? <Icon path={ICONS.check} size={13} stroke="white" strokeWidth={2.5} />
                : <Icon path={s.icon} size={13} stroke={i === step ? 'white' : 'var(--text-muted)'} strokeWidth={i === step ? 2 : 1.5} />
              }
            </div>
            <span style={{ fontSize: 10, color: i === step ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i === step ? 600 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Step 0: Equipment + type ── */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="label">Equipo *</label>
            <Select value={equipId} onValueChange={setEquipId} placeholder="Seleccionar equipo...">
              {equipment.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {[e.name, e.plate && `Matr. ${e.plate}`, e.serial && `#${e.serial}`, e.client?.name].filter(Boolean).join(' — ')}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="field">
            <label className="label">Técnico *</label>
            <Select value={techId} onValueChange={setTechId} placeholder="Seleccionar técnico...">
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </Select>
          </div>

          {/* Report type — responsive grid */}
          <div className="field">
            <label className="label">Tipo de trabajo *</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
              gap: 8,
            }}>
              {REPORT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    padding: isMobile ? '12px 6px' : '10px 6px',
                    borderRadius: 10,
                    border: `1.5px solid ${type === t.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: type === t.value ? 'var(--accent-soft)' : 'var(--surface-hover)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all .15s',
                  }}
                >
                  <Icon path={t.icon} size={isMobile ? 18 : 15} stroke={type === t.value ? 'var(--accent)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: isMobile ? 11 : 10.5, color: type === t.value ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: type === t.value ? 600 : 400, textAlign: 'center', lineHeight: 1.2 }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date/duration/status — stacked on mobile */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: 12,
          }}>
            <div className="field">
              <label className="label">Fecha</label>
              <DatePicker value={date} onChange={setDate} />
            </div>
            <div className="field">
              <label className="label">Duración (min)</label>
              <input className="input mobile-input" type="number" min="1" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Estado</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Template selection ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Selecciona una plantilla, o continúa sin plantilla.</p>
          <div
            onClick={() => setTemplateId('')}
            style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${!templateId ? 'var(--accent)' : 'var(--border)'}`, background: !templateId ? 'var(--accent-soft)' : 'var(--surface-hover)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Icon path={ICONS.close} size={15} stroke={!templateId ? 'var(--accent)' : 'var(--text-muted)'} />
            <span style={{ fontSize: 13, color: !templateId ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: !templateId ? 600 : 400 }}>Sin plantilla (reporte libre)</span>
          </div>
          {templates.map(t => (
            <div key={t.id} onClick={() => setTemplateId(t.id)}
              style={{ padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${templateId === t.id ? 'var(--accent)' : 'var(--border)'}`, background: templateId === t.id ? 'var(--accent-soft)' : 'var(--surface-hover)', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, transition: 'all .15s' }}
            >
              <Icon path={ICONS.clipboard} size={16} stroke={templateId === t.id ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: templateId === t.id ? 'var(--accent)' : 'var(--text)' }}>{t.name}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  {INDUSTRY_OPTIONS.find(i => i.value === t.industry)?.label || t.industry}
                  {t.equipmentType && ` · ${EQUIPMENT_TYPE_LABEL[t.equipmentType] || t.equipmentType}`}
                  {' · '}{t.sections?.length || 0} secciones, {t.sections?.reduce((a, s) => a + (s.items?.length || 0), 0)} ítems
                </p>
                {t.isSystem && <span style={{ fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 4, padding: '1px 5px', marginTop: 3, display: 'inline-block' }}>Sistema</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 2: Checklist ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {!selectedTemplate ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <Icon path={ICONS.clipboard} size={32} stroke="var(--text-muted)" />
              <p style={{ marginTop: 10, fontSize: 13 }}>No seleccionaste plantilla.<br />Puedes agregar notas en el siguiente paso.</p>
            </div>
          ) : selectedTemplate.sections.map(section => (
            <div key={section.id} style={{ marginBottom: 18 }}>
              <div style={{ background: 'var(--accent-soft)', borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{section.title}</span>
              </div>
              {section.items.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 10 : 12,
                  padding: isMobile ? '10px 4px' : '8px 4px',
                  borderBottom: '1px solid var(--border-light)',
                }}>
                  {item.type === 'CHECK' ? (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button type="button"
                        onClick={() => setChecklist(c => ({ ...c, [item.id]: true }))}
                        style={{
                          width: isMobile ? 36 : 26, height: isMobile ? 36 : 26,
                          borderRadius: 8,
                          border: `1.5px solid ${checklist[item.id] === true ? 'var(--success)' : 'var(--border)'}`,
                          background: checklist[item.id] === true ? 'rgba(34,197,94,.15)' : 'var(--surface-hover)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <Icon path={ICONS.check} size={isMobile ? 16 : 13} stroke={checklist[item.id] === true ? 'var(--success)' : 'var(--text-muted)'} strokeWidth={2.5} />
                      </button>
                      <button type="button"
                        onClick={() => setChecklist(c => ({ ...c, [item.id]: false }))}
                        style={{
                          width: isMobile ? 36 : 26, height: isMobile ? 36 : 26,
                          borderRadius: 8,
                          border: `1.5px solid ${checklist[item.id] === false ? 'var(--danger)' : 'var(--border)'}`,
                          background: checklist[item.id] === false ? 'rgba(239,68,68,.12)' : 'var(--surface-hover)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <Icon path={ICONS.close} size={isMobile ? 15 : 12} stroke={checklist[item.id] === false ? 'var(--danger)' : 'var(--text-muted)'} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <input className="input" style={{ width: isMobile ? '100%' : 120, maxWidth: isMobile ? 140 : 120, padding: '6px 8px', fontSize: 13, flexShrink: 0 }}
                      placeholder="—" value={checklist[item.id] || ''}
                      onChange={e => setChecklist(c => ({ ...c, [item.id]: e.target.value }))} />
                  )}
                  <span style={{ fontSize: isMobile ? 14 : 13, color: 'var(--text-secondary)', flex: 1, lineHeight: 1.3 }}>
                    {item.label}
                    {item.required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}
                  </span>
                  {item.type === 'CHECK' && checklist[item.id] !== undefined && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: checklist[item.id] === true ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                      {checklist[item.id] === true ? 'OK' : 'No'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 3: Photos + notes ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="label">Observaciones / Notas</label>
            <textarea
              className="input mobile-input"
              rows={isMobile ? 3 : 4}
              placeholder="Describe el trabajo realizado, condiciones encontradas, materiales usados..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          <div>
            <label className="label" style={{ marginBottom: 10 }}>Fotografías</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                  <img src={p.dataUrl} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                  {(p.size || p.originalSize) && (
                    <div style={{ position: 'absolute', left: 5, top: 5, borderRadius: 999, background: 'rgba(0,0,0,.64)', color: 'white', fontSize: 9.5, fontWeight: 700, padding: '2px 6px', letterSpacing: 0 }}>
                      {p.mimeType === 'image/webp' ? 'WEBP' : 'IMG'} · {formatFileSize(p.size || p.originalSize)}
                    </div>
                  )}
                  <input
                    placeholder="Descripción"
                    value={p.caption}
                    onChange={e => setPhotos(ps => ps.map((ph, j) => j === i ? { ...ph, caption: e.target.value } : ph))}
                    style={{ width: '100%', border: 'none', borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '4px 6px', fontSize: 11, color: 'var(--text-secondary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon path={ICONS.close} size={11} stroke="white" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              {/* Add photo button */}
              <div
                onClick={() => !processingPhotos && photoInputRef.current.click()}
                style={{ aspectRatio: '4/3', border: '2px dashed var(--border-light)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: processingPhotos ? 'wait' : 'pointer', background: 'var(--surface-hover)', transition: 'border-color .15s', opacity: processingPhotos ? .7 : 1 }}
                onTouchStart={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onTouchEnd={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
              >
                {processingPhotos
                  ? <div className="spin" style={{ width: isMobile ? 24 : 20, height: isMobile ? 24 : 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
                  : <Icon path={ICONS.camera} size={isMobile ? 24 : 20} stroke="var(--text-muted)" />
                }
                <span style={{ fontSize: isMobile ? 12 : 10.5, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {processingPhotos ? 'Optimizando...' : 'Agregar foto'}
                </span>
              </div>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple capture="environment" style={{ display: 'none' }}
              onChange={e => { handlePhotoFiles(e.target.files); e.target.value = '' }} />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {!isMobile && <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>}
        <div style={{ flex: 1 }} />
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)} style={{ height: isMobile ? 44 : undefined }}>
            <Icon path={ICONS.chevLeft} size={14} /> Atrás
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext[step]}
            style={{ height: isMobile ? 44 : undefined, minWidth: isMobile ? 110 : undefined }}
          >
            Siguiente <Icon path={ICONS.chevRight} size={14} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || processingPhotos}
            style={{ height: isMobile ? 44 : undefined, minWidth: isMobile ? 140 : undefined }}
          >
            {saving
              ? <><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Guardando...</>
              : <><Icon path={ICONS.check} size={14} /> {editingReport ? 'Guardar cambios' : 'Guardar reporte'}</>
            }
          </button>
        )}
      </div>
    </div>
  )
}
