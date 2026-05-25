import React, { useEffect, useState } from 'react'
import { Icon, ICONS, StatusBadge } from '../components/UI.jsx'
import { useBranding } from '../lib/branding.js'
import { publicAPI } from '../lib/api.js'
import { REPORT_TYPE_LABEL } from '../lib/reportMeta.js'

function safeParseJson(value) {
  if (!value) return null
  try { return JSON.parse(value) } catch { return null }
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function DetailItem({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', minWidth: 0 }}>
      <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 13.5, fontWeight: 700, overflowWrap: 'anywhere' }}>{value || '-'}</p>
    </div>
  )
}

export default function PublicReportView({ link }) {
  const { branding } = useBranding()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!link?.id) return
    setLoading(true)
    setError(null)
    const load = link.type === 'public-qr'
      ? publicAPI.latestByQR(link.id)
      : publicAPI.latestByEquipment(link.id)
    load.then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [link])

  const equipment = data?.equipment
  const report = data?.report
  const checklist = safeParseJson(report?.checklistJson)
  const photos = safeParseJson(report?.photosJson) || []

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--text)', padding: '18px 12px 32px' }}>
      <main className="animate-up" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px 4px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon path={ICONS.qr} size={20} stroke="var(--accent)" strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 800 }}>{branding.appName}</p>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Vista pública de mantenimiento</p>
          </div>
        </header>

        {loading && (
          <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando reporte público...</p>
          </div>
        )}

        {!loading && (error || !data) && (
          <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <Icon path={ICONS.alert} size={30} stroke="var(--danger)" />
            <p style={{ fontSize: 17, fontWeight: 800, marginTop: 12 }}>No pudimos abrir este QR</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{error || 'El enlace no existe o fue eliminado.'}</p>
          </section>
        )}

        {!loading && data && !equipment && (
          <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <Icon path={ICONS.qr} size={30} stroke="var(--warning)" />
            <p style={{ fontSize: 17, fontWeight: 800, marginTop: 12 }}>QR sin equipo asignado</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Este código todavía no está vinculado a un equipo.</p>
          </section>
        )}

        {!loading && equipment && (
          <>
            <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon path={ICONS.wrench} size={22} stroke="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 21, lineHeight: 1.2, fontWeight: 850, marginBottom: 4 }}>{equipment.name}</h1>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{equipment.client?.name || 'Cliente no disponible'}</p>
                </div>
                <StatusBadge status={equipment.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 9, marginTop: 16 }}>
                <DetailItem label="Modelo" value={equipment.model} />
                <DetailItem label="Serie" value={equipment.serial} />
                <DetailItem label="Matrícula" value={equipment.plate} />
                <DetailItem label="Ubicación" value={equipment.place?.name || equipment.location} />
              </div>
            </section>

            {!report ? (
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <Icon path={ICONS.reports} size={30} stroke="var(--text-muted)" />
                <p style={{ fontSize: 17, fontWeight: 800, marginTop: 12 }}>Sin reportes públicos todavía</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Cuando se cargue un reporte para este equipo, acá se mostrará el último.</p>
              </section>
            ) : (
              <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Último reporte</p>
                    <h2 style={{ fontSize: 19, fontWeight: 850, marginTop: 4 }}>{REPORT_TYPE_LABEL[report.type] || report.type}</h2>
                    <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(report.createdAt)}</p>
                  </div>
                  <StatusBadge status={report.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 9, marginBottom: 16 }}>
                  <DetailItem label="Técnico" value={report.tech?.name} />
                  <DetailItem label="Duración" value={report.duration ? `${report.duration} min` : null} />
                  <DetailItem label="Plantilla" value={report.template?.name} />
                </div>

                {report.notes && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 7 }}>Trabajo realizado</p>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{report.notes}</p>
                  </div>
                )}

                {report.template?.sections?.length > 0 && checklist && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 800 }}>Checklist</p>
                    {report.template.sections.map(section => (
                      <div key={section.id}>
                        <p style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 7 }}>{section.title}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {section.items.map(item => {
                            const value = checklist[item.id]
                            return (
                              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 10px', background: 'var(--surface-hover)', borderRadius: 9 }}>
                                <span style={{ fontSize: 12.8, color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: value === true || value === 'OK' ? 'var(--success)' : 'var(--text)' }}>
                                  {value === true ? 'OK' : value === false ? 'No' : value || '-'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 16 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 9 }}>Fotos</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
                      {photos.map((photo, index) => (
                        <img key={index} src={photo?.dataUrl || photo} alt={`Foto ${index + 1}`} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
