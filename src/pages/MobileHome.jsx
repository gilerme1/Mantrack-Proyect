import React, { useState, useEffect } from 'react'
import { Icon, ICONS, StatusBadge, Avatar, Modal } from '../components/UI.jsx'
import { equipmentAPI, reportsAPI } from '../lib/api.js'
import ReportWizard from '../components/ReportWizard.jsx'

function QuickAction({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '14px 8px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'all .15s',
      }}
      onTouchStart={e => e.currentTarget.style.background = 'var(--surface-hover)'}
      onTouchEnd={e => e.currentTarget.style.background = 'var(--surface)'}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: `${color}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon path={icon} size={18} stroke={color} strokeWidth={1.8} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </button>
  )
}

function TechActionButton({ icon, title, subtitle, tone = 'surface', grow = 1, onClick }) {
  const isPrimary = tone === 'primary'
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        flex: `${grow} 1 0`,
        minHeight: 0,
        background: isPrimary ? 'var(--accent)' : 'var(--surface)',
        border: isPrimary ? 'none' : '1px solid var(--border)',
        borderRadius: isPrimary ? 22 : 20,
        padding: isPrimary ? '24px 20px' : '20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        boxShadow: isPrimary ? '0 12px 34px rgba(99,102,241,.34)' : 'none',
        textAlign: 'left',
        transition: 'transform .15s, background .15s',
      }}
      onTouchStart={e => {
        e.currentTarget.style.transform = 'scale(.985)'
        if (!isPrimary) e.currentTarget.style.background = 'var(--surface-hover)'
      }}
      onTouchEnd={e => {
        e.currentTarget.style.transform = 'scale(1)'
        if (!isPrimary) e.currentTarget.style.background = 'var(--surface)'
      }}
    >
      <div style={{
        width: isPrimary ? 66 : 56,
        height: isPrimary ? 66 : 56,
        borderRadius: isPrimary ? 18 : 16,
        background: isPrimary ? 'rgba(255,255,255,.20)' : 'var(--accent-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon path={icon} size={isPrimary ? 34 : 25} stroke={isPrimary ? 'white' : 'var(--accent)'} strokeWidth={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: isPrimary ? 26 : 19, fontWeight: 850, color: isPrimary ? 'white' : 'var(--text)', letterSpacing: '-.02em' }}>{title}</p>
        <p style={{ fontSize: isPrimary ? 14.5 : 13.5, color: isPrimary ? 'rgba(255,255,255,.78)' : 'var(--text-muted)', marginTop: 5, lineHeight: 1.25 }}>{subtitle}</p>
      </div>
      <Icon path={ICONS.chevRight} size={20} stroke={isPrimary ? 'rgba(255,255,255,.7)' : 'var(--text-muted)'} strokeWidth={2} />
    </button>
  )
}

function EquipmentCard({ eq, onReport, onEdit }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'var(--accent-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon path={ICONS.wrench} size={16} stroke="var(--accent)" strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.client?.name}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <StatusBadge status={eq.status} />
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onReport(eq)}
          title="Nuevo reporte"
          style={{ padding: 6 }}
        >
          <Icon path={ICONS.plus} size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

function ReportCard({ r }) {
  const formatDate = (d) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <Avatar name={r.tech?.name || '?'} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.equipment?.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{r.equipment?.client?.name}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <StatusBadge status={r.status} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatDate(r.createdAt)}</span>
      </div>
    </div>
  )
}

export default function MobileHome({ setActive, user }) {
  const [equipment,     setEquipment]     = useState([])
  const [recentReports, setRecentReports] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching,     setSearching]     = useState(false)
  const [showWizard,   setShowWizard]   = useState(false)
  const [prefillEquip, setPrefillEquip] = useState(null)
  const [apiError,     setApiError]     = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = user?.name?.split(' ')[0] || ''

  useEffect(() => {
    Promise.all([
      equipmentAPI.list(),
      reportsAPI.list(),
    ]).then(([eqRes, rpRes]) => {
      const eqList = Array.isArray(eqRes) ? eqRes : (eqRes.equipment || [])
      setEquipment(eqList.slice(0, 5))
      setRecentReports((rpRes.reports || []).slice(0, 4))
    }).catch(() => setApiError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await equipmentAPI.list({ search: search.trim() })
      const list = Array.isArray(res) ? res : (res.equipment || [])
      setSearchResults(list)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const openReportFor = (eq) => {
    setPrefillEquip(eq?.id || null)
    setShowWizard(true)
  }

  const clearSearch = () => {
    setSearch('')
    setSearchResults(null)
  }

  if (user?.role === 'TECH') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 14px 24px', minHeight: 'calc(100dvh - 120px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: '62dvh' }}>
          <TechActionButton
            icon={ICONS.qr}
            title="Escanear"
            subtitle="QR de equipo o etiqueta abierta"
            tone="primary"
            grow={1.45}
            onClick={() => setActive('qr')}
          />
          <TechActionButton
            icon={ICONS.reports}
            title="Agregar reporte"
            subtitle="Registrar mantenimiento o inspección"
            grow={1}
            onClick={() => openReportFor(null)}
          />
          <TechActionButton
            icon={ICONS.equipment}
            title="Agregar equipo"
            subtitle="Crear un equipo nuevo en campo"
            grow={1}
            onClick={() => setActive('equipment')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Buscar equipo</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Serie, matrícula o nombre..."
              value={search}
              onChange={e => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null) }}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, fontSize: 16, minHeight: 50 }}
            />
            <button className="btn btn-primary" onClick={handleSearch} disabled={!search.trim() || searching} style={{ width: 52, padding: 0, minHeight: 50 }}>
              {searching
                ? <div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} />
                : <Icon path={ICONS.search} size={17} stroke="white" />
              }
            </button>
          </div>
        </div>

        {searchResults !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>No se encontró el equipo.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setActive('equipment')}>
                  <Icon path={ICONS.plus} size={13} stroke="white" /> Agregar equipo
                </button>
              </div>
            ) : searchResults.map(eq => (
              <div key={eq.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Icon path={ICONS.wrench} size={16} stroke="var(--accent)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>{eq.name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{[eq.client?.name, eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`].filter(Boolean).join(' · ')}</p>
                  </div>
                  <StatusBadge status={eq.status} />
                </div>
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => openReportFor(eq)}>
                  <Icon path={ICONS.plus} size={13} stroke="white" /> Agregar reporte
                </button>
              </div>
            ))}
          </div>
        )}

        {apiError && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--danger)' }}>Sin conexión con el servidor. Si la app ya fue abierta antes, la PWA seguirá cargando en modo offline con datos cacheados.</p>
          </div>
        )}

        <Modal open={showWizard} onClose={() => { setShowWizard(false); setPrefillEquip(null) }} title="Nuevo reporte" maxWidth={580}>
          <ReportWizard
            onClose={() => { setShowWizard(false); setPrefillEquip(null) }}
            onSaved={() => { setShowWizard(false); setPrefillEquip(null) }}
            prefillEquipId={prefillEquip}
          />
        </Modal>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Greeting */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{greeting}, {firstName}</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--text)' }}>Trabajo de campo</h2>
      </div>

      {/* QR Scan Button */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={() => setActive('qr')}
          className="mobile-hero-btn"
          style={{
            width: '100%',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 18,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(99,102,241,.35)',
            transition: 'transform .15s',
          }}
          onTouchStart={e => e.currentTarget.style.transform = 'scale(.98)'}
          onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{
            width: 52,
            height: 52,
            background: 'rgba(255,255,255,.2)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon path={ICONS.qr} size={26} stroke="white" strokeWidth={1.8} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: '-.02em' }}>Escanear QR</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Identifica un equipo por código</p>
          </div>
          <Icon path={ICONS.chevRight} size={18} stroke="rgba(255,255,255,.6)" strokeWidth={2} style={{ marginLeft: 'auto' }} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', gap: 8, height: 46 }}>
          <input
            className="input"
            placeholder="Buscar por serie, matrícula o nombre..."
            value={search}
            onChange={e => { setSearch(e.target.value); if (!e.target.value) setSearchResults(null) }}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, fontSize: 16 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={!search.trim() || searching}
            style={{ width: 46, padding: 0, flexShrink: 0, alignSelf: 'stretch' }}
          >
            {searching
              ? <div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} />
              : <Icon path={ICONS.search} size={16} stroke="white" strokeWidth={2.5} />
            }
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults !== null && (
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {searchResults.length === 0 ? 'Sin resultados' : `${searchResults.length} resultado${searchResults.length !== 1 ? 's' : ''}`}
            </p>
            <button className="btn btn-ghost btn-sm" onClick={clearSearch}>Limpiar</button>
          </div>
          {searchResults.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>No se encontró ningún equipo con ese criterio.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setActive('equipment')}>
                <Icon path={ICONS.plus} size={13} stroke="white" /> Crear equipo
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(eq => (
                <div
                  key={eq.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon path={ICONS.wrench} size={16} stroke="var(--accent)" strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{eq.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{eq.client?.name}</p>
                      {(eq.serial || eq.plate) && (
                        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{[eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`].filter(Boolean).join(' · ')}</p>
                      )}
                    </div>
                    <StatusBadge status={eq.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setActive('equipment')}
                    >
                      <Icon path={ICONS.eye} size={13} /> Ver
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => openReportFor(eq)}
                    >
                      <Icon path={ICONS.plus} size={13} stroke="white" /> Reporte
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {searchResults === null && (
        <>
          <div style={{ padding: '20px 16px 0' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Acciones rápidas</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <QuickAction
                icon={ICONS.reports}
                label="Nuevo reporte"
                color="var(--accent)"
                onClick={() => openReportFor(null)}
              />
              <QuickAction
                icon={ICONS.equipment}
                label="Nuevo equipo"
                color="var(--purple)"
                onClick={() => setActive('equipment')}
              />
              <QuickAction
                icon={ICONS.clients}
                label="Nuevo cliente"
                color="var(--success)"
                onClick={() => setActive('clients')}
              />
            </div>
          </div>

          {/* Recent Equipment */}
          {!loading && equipment.length > 0 && (
            <div style={{ padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Equipos recientes</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setActive('equipment')}>Ver todos</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {equipment.map(eq => (
                  <EquipmentCard key={eq.id} eq={eq} onReport={openReportFor} onEdit={() => setActive('equipment')} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Reports */}
          {!loading && recentReports.length > 0 && (
            <div style={{ padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Reportes recientes</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setActive('reports')}>Ver todos</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentReports.map(r => (
                  <ReportCard key={r.id} r={r} />
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => (
                <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14 }} />
              ))}
            </div>
          )}
        </>
      )}

      {/* API error banner */}
      {apiError && (
        <div style={{ margin: '16px 16px 0', background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon path={ICONS.alert} size={15} stroke="var(--danger)" />
          <p style={{ fontSize: 13, color: 'var(--danger)', flex: 1 }}>No se pudo conectar con el servidor. Verifica que la API esté corriendo en el puerto 3001.</p>
        </div>
      )}

      {/* Bottom safe area */}
      <div style={{ height: 24 }} />

      {/* Report Wizard */}
      <Modal open={showWizard} onClose={() => { setShowWizard(false); setPrefillEquip(null) }} title="Nuevo reporte" maxWidth={580}>
        <ReportWizard
          onClose={() => { setShowWizard(false); setPrefillEquip(null) }}
          onSaved={() => { setShowWizard(false); setPrefillEquip(null) }}
          prefillEquipId={prefillEquip}
        />
      </Modal>
    </div>
  )
}
