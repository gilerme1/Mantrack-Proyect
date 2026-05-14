// src/components/ReportDetail.jsx
import React, { useState, useEffect, useContext } from 'react'
import { Icon, ICONS, StatusBadge } from './UI.jsx'
import { reportsAPI } from '../lib/api.js'
import { REPORT_TYPE_LABEL } from '../lib/reportMeta.js'
import { BrandingContext } from '../lib/branding.js'

function safeParseJson(str) {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReportDetail({ reportId, onClose, onEdit }) {
  const { branding } = useContext(BrandingContext)
  const [report,    setReport]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)

  useEffect(() => {
    reportsAPI.get(reportId).then(setReport).finally(() => setLoading(false))
  }, [reportId])

  const checklist = safeParseJson(report?.checklistJson)
  const photos    = safeParseJson(report?.photosJson) || []

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      const { generateReportPDF } = await import('../lib/pdfGenerator.js')
      await generateReportPDF({ report, branding })
    }
    finally { setGenerating(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spin" style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  if (!report) return (
    <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Reporte no encontrado</div>
  )

  const conformes   = checklist ? Object.values(checklist).filter(v => v === true).length  : 0
  const noConformes = checklist ? Object.values(checklist).filter(v => v === false).length : 0
  const totalItems  = report.template?.sections?.reduce((a, s) => a + s.items.length, 0) || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          ['Equipo',   report.equipment?.name],
          ['Cliente',  report.equipment?.client?.name],
          ['Técnico',  report.tech?.name],
          ['Fecha',    formatDate(report.createdAt)],
          ['Tipo',     REPORT_TYPE_LABEL[report.type] || report.type],
          ['Estado',   null],
          report.duration && ['Duración', `${report.duration} min`],
          report.template?.name && ['Plantilla', report.template.name],
        ].filter(Boolean).map(([label, val], i) => (
          <div key={i} style={{ background: 'var(--surface-hover)', borderRadius: 8, padding: '10px 12px' }}>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</p>
            {label === 'Estado'
              ? <StatusBadge status={report.status} />
              : <p style={{ fontSize: 13, fontWeight: 500 }}>{val || '—'}</p>
            }
          </div>
        ))}
      </div>

      {/* Checklist summary bar */}
      {checklist && totalItems > 0 && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Checklist:</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon path={ICONS.check} size={13} stroke="var(--success)" strokeWidth={2.5} /> {conformes} conformes
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon path={ICONS.close} size={12} stroke="var(--danger)" strokeWidth={2.5} /> {noConformes} no conformes
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {totalItems} ítems totales</span>
          <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, minWidth: 80, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${totalItems ? ((conformes / totalItems) * 100) : 0}%`, background: 'var(--success)', borderRadius: 3, transition: 'width .5s' }} />
          </div>
        </div>
      )}

      {/* Checklist sections */}
      {report.template?.sections?.length > 0 && checklist && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Checklist de verificación</p>
          {report.template.sections.map(section => (
            <div key={section.id} style={{ marginBottom: 14 }}>
              <div style={{ background: 'var(--accent-soft)', borderRadius: 8, padding: '6px 12px', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{section.title}</span>
              </div>
              {section.items.map(item => {
                const val = checklist[item.id]
                const isCheck = item.type === 'CHECK'
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderBottom: '1px solid var(--border-light)' }}>
                    {isCheck ? (
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${val === true ? 'var(--success)' : val === false ? 'var(--danger)' : 'var(--border)'}`, background: val === true ? 'rgba(34,197,94,.12)' : val === false ? 'rgba(239,68,68,.1)' : 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {val === true  && <Icon path={ICONS.check} size={11} stroke="var(--success)" strokeWidth={2.5} />}
                        {val === false && <Icon path={ICONS.close} size={10} stroke="var(--danger)"  strokeWidth={2.5} />}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--accent)', flexShrink: 0, minWidth: 60 }}>{val || '—'}</span>
                    )}
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
                    {isCheck && val !== undefined && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: val === true ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                        {val === true ? 'Conforme' : 'No conforme'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <div style={{ marginBottom: 20, padding: '12px 14px', background: 'var(--surface-hover)', borderRadius: 10, borderLeft: '3px solid var(--accent)' }}>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Observaciones</p>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.notes}</p>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Fotografías ({photos.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {photos.map((p, i) => (
              <div key={i} onClick={() => setLightboxPhoto(p)} style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
                <img src={p.dataUrl || p} alt={p.caption || `Foto ${i+1}`} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                {p.caption && <p style={{ fontSize: 10.5, color: 'var(--text-muted)', padding: '4px 7px', background: 'var(--surface)' }}>{p.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost" onClick={() => onEdit?.(report)}>
          <Icon path={ICONS.edit} size={14} /> Editar
        </button>
        <button className="btn btn-primary" onClick={handleGeneratePDF} disabled={generating}>
          {generating
            ? <><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Generando...</>
            : <><Icon path={ICONS.download} size={14} /> Generar PDF</>
          }
        </button>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div onClick={() => setLightboxPhoto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={lightboxPhoto.dataUrl || lightboxPhoto} alt={lightboxPhoto.caption || ''} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
          {lightboxPhoto.caption && <p style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: 13, background: 'rgba(0,0,0,.6)', padding: '6px 14px', borderRadius: 20 }}>{lightboxPhoto.caption}</p>}
          <button onClick={() => setLightboxPhoto(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon path={ICONS.close} size={18} stroke="white" />
          </button>
        </div>
      )}
    </div>
  )
}
