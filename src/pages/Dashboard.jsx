import React, { Suspense, lazy, useState, useEffect } from 'react'
import { StatusBadge, Avatar, Icon, ICONS } from '../components/UI.jsx'
import { statsAPI } from '../lib/api.js'
import WeatherWidget   from '../components/WeatherWidget.jsx'
import CurrencyWidget  from '../components/CurrencyWidget.jsx'

const ClientMapWidget = lazy(() => import('../components/ClientMapWidget.jsx'))

function KpiCard({ label, value, sub, subUp, color, icon, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0, cursor: 'pointer', padding: '20px 22px', transition: 'border-color .15s, background .15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = 'var(--surface-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon path={icon} size={20} stroke={color} strokeWidth={1.7} />
        </div>
        <div
          onClick={e => { e.stopPropagation(); onClick?.() }}
          style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}12` }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)' }}
        >
          <Icon path={ICONS.chevRight} size={13} stroke="var(--text-muted)" strokeWidth={2.2} />
        </div>
      </div>

      {/* Value */}
      <p style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-.05em', lineHeight: 1, color: 'var(--text)', marginBottom: 7 }}>{value}</p>

      {/* Label */}
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: sub ? 5 : 0 }}>{label}</p>

      {/* Sub */}
      {sub && (
        <p style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
          color: subUp === true ? 'var(--success)' : subUp === false ? 'var(--danger)' : 'var(--text-muted)' }}>
          {subUp !== undefined && <Icon path={subUp ? ICONS.arrowUp : ICONS.arrowDown} size={11} strokeWidth={2.5} />}
          {sub}
        </p>
      )}

      {/* Bottom accent bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2.5, background: `linear-gradient(90deg, ${color}80, ${color}00)` }} />
    </div>
  )
}

const STATUS_META = [
  { key: 'active', label: 'Activos', filter: 'ACTIVE', color: '#1DB954', tone: 'rgba(29,185,84,.14)' },
  { key: 'overdue', label: 'Vencidos', filter: 'OVERDUE', color: '#FB7185', tone: 'rgba(251,113,133,.14)' },
  { key: 'scheduled', label: 'Programados', filter: 'SCHEDULED', color: '#A78BFA', tone: 'rgba(167,139,250,.16)' },
  { key: 'inactive', label: 'Inactivos', filter: 'INACTIVE', color: 'var(--text-muted)', tone: 'rgba(114,114,160,.14)' },
]

function StatusRing({ segments, total }) {
  const size = 148
  const stroke = 16
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let cursor = 0

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {total > 0 && segments.filter(s => s.value > 0).map(seg => {
          const dash = (seg.value / total) * circ
          const el = (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-cursor}
              strokeLinecap="round"
            />
          )
          cursor += dash
          return el
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 850, letterSpacing: '-.05em', lineHeight: 1 }}>{total}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 4 }}>equipos</span>
      </div>
    </div>
  )
}

function EquipmentStatusPanel({ data, onFilter }) {
  const total = STATUS_META.reduce((sum, item) => sum + (data[item.key] || 0), 0)
  const risk = data.overdue || 0
  const scheduled = data.scheduled || 0
  const activePct = total ? Math.round(((data.active || 0) / total) * 100) : 0
  const healthLabel = risk > 0 ? `${risk} requieren atención` : `${activePct}% operativo`

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>Salud de equipos</p>
          <p style={{ fontSize: 12, color: risk > 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 4 }}>{healthLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className="badge" style={{ background: 'rgba(251,113,133,.14)', color: '#FB7185' }}>{risk} venc.</span>
          <span className="badge" style={{ background: 'rgba(167,139,250,.16)', color: '#A78BFA' }}>{scheduled} prog.</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
        <StatusRing segments={STATUS_META.map(s => ({ ...s, value: data[s.key] || 0 }))} total={total} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STATUS_META.map(item => {
            const value = data[item.key] || 0
            const pct = total ? Math.round((value / total) * 100) : 0
            return (
              <button key={item.key} type="button" onClick={() => onFilter(item.filter)}
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 12, padding: '9px 10px', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = item.color }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 650 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                    {item.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{value} · {pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 99 }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MaintenanceTrendPanel({ data, growthPct, onClick, onMonthClick }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const avg = Math.round(total / Math.max(data.length, 1))
  const best = data.reduce((acc, d) => d.value > acc.value ? d : acc, data[0] || { label: '—', value: 0 })
  const current = data.find(d => d.current) || data[data.length - 1] || { value: 0 }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>Mantenimientos por mes</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Últimos 6 meses · {total} reportes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 30, fontWeight: 850, lineHeight: 1, letterSpacing: '-.05em', color: 'var(--success)' }}>{current.value}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>este mes</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClick} style={{ flexShrink: 0 }}>Ver todos</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 9, alignItems: 'end', height: 145 }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * 105, d.value > 0 ? 14 : 4)
          return (
            <button
              key={`${d.label}-${i}`}
              type="button"
              onClick={e => { e.stopPropagation(); onMonthClick?.({ dateFrom: d.dateFrom, dateTo: d.dateTo, label: d.label }) }}
              title={`Ver reportes de ${d.label}`}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, minWidth: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: d.current ? 'var(--success)' : 'var(--text-secondary)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{d.value}</span>
              <div style={{ height: h, borderRadius: '10px 10px 4px 4px', background: d.current ? 'linear-gradient(180deg, var(--success), #4ade80)' : 'linear-gradient(180deg, rgba(99,102,241,.7), rgba(99,102,241,.22))', boxShadow: d.current ? '0 8px 24px rgba(34,197,94,.26)' : 'none', border: d.current ? '1px solid rgba(74,222,128,.45)' : '1px solid rgba(99,102,241,.18)' }} />
              <span style={{ fontSize: 10.5, color: d.current ? 'var(--text)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', textTransform: 'capitalize' }}>{d.label}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Promedio</p>
          <p style={{ fontSize: 16, fontWeight: 800 }}>{avg}/mes</p>
        </div>
        <div>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Mejor mes</p>
          <p style={{ fontSize: 16, fontWeight: 800 }}>{best.label} · {best.value}</p>
        </div>
        <div>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Tendencia</p>
          <p style={{ fontSize: 16, fontWeight: 800, color: growthPct > 0 ? 'var(--success)' : growthPct < 0 ? 'var(--danger)' : 'var(--text)' }}>{growthPct !== null ? `${growthPct > 0 ? '+' : ''}${growthPct}%` : '—'}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ setActive, onOpenEquipment, onOpenReport, onOpenReportMonth, onOpenClient }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    statsAPI.dashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 28, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
      {Array.from({length:8}).map((_,i) => (
        <div key={i} className="skeleton" style={{ height: i < 4 ? 140 : 220, borderRadius: 18 }} />
      ))}
    </div>
  )

  if (error) return (
    <div style={{ padding: 28 }}>
      <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
        <p style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 600 }}>Error al cargar datos</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Verifica que el servidor API esté corriendo en el puerto 3001.</p>
      </div>
    </div>
  )

  const { kpis, equipmentByStatus, monthly, recentReports, upcomingEquip } = data

  return (
    <div className="animate-up" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Alerta de equipos vencidos */}
      {kpis.overdueEquipment > 0 && (
        <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon path={ICONS.alert} size={16} stroke="var(--danger)" />
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--danger)', flex: 1 }}>
            <strong>{kpis.overdueEquipment} equipos</strong> con mantenimiento vencido requieren atención inmediata.
          </p>
          <button className="btn btn-sm" onClick={() => setActive('equipment', 'OVERDUE')} style={{ background: 'var(--danger)', color: '#fff', flexShrink: 0 }}>
            Ver equipos
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        <KpiCard label="Clientes"       value={kpis.clients}          sub="activos"                                                                                color="var(--accent)"  icon={ICONS.clients}   onClick={() => setActive('clients')} />
        <KpiCard label="Equipos"        value={kpis.totalEquipment}   sub="en seguimiento"                                                                        color="var(--purple)"  icon={ICONS.equipment} onClick={() => setActive('equipment')} />
        <KpiCard label="Vencidos"       value={kpis.overdueEquipment} sub={kpis.overdueEquipment > 0 ? 'Requieren atención' : 'Sin incidencias'}                  color="var(--danger)"  icon={ICONS.alert}     onClick={() => setActive('equipment', 'OVERDUE')} subUp={kpis.overdueEquipment > 0 ? false : undefined} />
        <KpiCard label="Mantenimientos" value={kpis.reportsThisMonth} sub={kpis.growthPct !== null ? `${kpis.growthPct > 0 ? '+' : ''}${kpis.growthPct}% vs mes anterior` : 'este mes'} color="var(--success)" icon={ICONS.reports}  onClick={() => setActive('reports')} subUp={kpis.growthPct > 0 ? true : kpis.growthPct < 0 ? false : undefined} />
      </div>

      {/* Fila central: Gráficos + Próximos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: 16, alignItems: 'stretch' }}>
        <MaintenanceTrendPanel data={monthly} growthPct={kpis.growthPct} onClick={() => setActive('reports')} onMonthClick={onOpenReportMonth} />
        <EquipmentStatusPanel data={equipmentByStatus} onFilter={(status) => setActive('equipment', status)} />

        {/* Próximos mantenimientos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Próximos mantenimientos</p>
            <Icon path={ICONS.clock} size={15} stroke="var(--text-muted)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {upcomingEquip.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin mantenimientos programados.</p>
              : upcomingEquip.map(eq => (
                <button
                  key={eq.id}
                  type="button"
                  className="dashboard-list-row"
                  onClick={() => onOpenEquipment?.(eq.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{eq.client?.name}</p>
                  </div>
                  <div style={{ background: 'var(--accent-soft)', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {new Date(eq.nextMaint).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </button>
              ))
            }
          </div>
        </div>
      </div>

      {/* Mapa + widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'stretch', minHeight: 400 }}>
        <Suspense fallback={<div className="card skeleton" style={{ minHeight: 400 }} />}>
          <ClientMapWidget onOpenClient={onOpenClient} />
        </Suspense>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WeatherWidget />
          <CurrencyWidget />
        </div>
      </div>

      {/* Actividad reciente – feed simple */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Actividad reciente</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setActive('reports')}>Ver todos</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentReports.slice(0, 5).map((r, i) => (
            <button key={r.id} type="button" className="dashboard-activity-row" onClick={() => onOpenReport?.(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px',
              borderBottom: i < Math.min(recentReports.length, 5) - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <Avatar name={r.tech?.name || '?'} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.equipment?.name}
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {r.equipment?.client?.name}</span>
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {r.tech?.name} · {r.type}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <StatusBadge status={r.status} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(r.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
