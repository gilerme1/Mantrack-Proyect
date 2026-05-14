import React from 'react'
import { createPortal } from 'react-dom'

export const Icon = ({ path, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 1.6, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink: 0, ...style }}>
    {Array.isArray(path) ? path.map((d, i) => <path key={i} d={d} />) : <path d={path} />}
  </svg>
)

export const ICONS = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  clients:   ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  equipment: ['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  reports:   ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  qr:        ['M3 3h6v6H3z','M15 3h6v6h-6z','M3 15h6v6H3z','M15 15h2v2h-2z','M19 15v2','M15 19h2','M19 19v2','M21 19h-2'],
  alert:     ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
  chevRight: 'M9 18l6-6-6-6', chevLeft: 'M15 18l-6-6 6-6', chevDown: 'M6 9l6 6 6-6',
  plus:      ['M12 5v14','M5 12h14'],
  search:    ['M21 21l-4.35-4.35','M17 11A6 6 0 105 11a6 6 0 0012 0z'],
  bell:      ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9','M13.73 21a2 2 0 01-3.46 0'],
  settings:  ['M12 15a3 3 0 100-6 3 3 0 000 6z','M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'],
  wrench:    'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  clock:     ['M12 22a10 10 0 100-20 10 10 0 000 20z','M12 6v6l4 2'],
  check:     'M20 6L9 17l-5-5',
  close:     ['M18 6L6 18','M6 6l12 12'],
  arrowUp:   ['M12 19V5','M5 12l7-7 7 7'],
  arrowDown: ['M12 5v14','M19 12l-7 7-7-7'],
  download:  ['M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4','M7 10l5 5 5-5','M12 15V3'],
  edit:      ['M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7','M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z'],
  trash:     ['M3 6h18','M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 12a3 3 0 100-6 3 3 0 000 6z'],
  smartphone:['M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2z','M12 18h.01'],
  menu:      ['M3 12h18','M3 6h18','M3 18h18'],
  filter:    'M22 3H2l8 9.46V19l4 2V12.46z',
  share:     ['M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8','M16 6l-4-4-4 4','M12 2v13'],
  logout:    ['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4','M16 17l5-5-5-5','M21 12H9'],
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75'],
  sun:       ['M12 17a5 5 0 100-10 5 5 0 000 10z','M12 1v2','M12 21v2','M4.22 4.22l1.42 1.42','M18.36 18.36l1.42 1.42','M1 12h2','M21 12h2','M4.22 19.78l1.42-1.42','M18.36 5.64l1.42-1.42'],
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  mapPin:    ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z','M12 10a1 1 0 100-2 1 1 0 000 2z'],
  wind:      ['M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2'],
  droplet:   ['M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'],
  trendUp:   ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  trendDown: ['M23 18l-9.5-9.5-5 5L1 6','M17 18h6v-6'],
  refresh:   ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
  camera:    ['M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z','M12 17a4 4 0 100-8 4 4 0 000 8z'],
  image:     ['M21 19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2z','M8.5 9.5a1 1 0 100-2 1 1 0 000 2z','M21 15l-5-5L5 21'],
  layers:    ['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  clipboard: ['M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2','M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z'],
  calendar:  ['M8 2v4','M16 2v4','M3 8h18','M21 6H3a1 1 0 00-1 1v13a1 1 0 001 1h18a1 1 0 001-1V7a1 1 0 00-1-1z'],
  user:      ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2','M12 11a4 4 0 100-8 4 4 0 000 8z'],
}

const AVATAR_COLORS = [
  ['#6366F1','#818CF8'],['#A855F7','#C084FC'],['#22C55E','#4ADE80'],
  ['#F59E0B','#FCD34D'],['#EF4444','#F87171'],['#0EA5E9','#38BDF8'],['#EC4899','#F472B6'],
]
export const Avatar = ({ name = '?', size = 28 }) => {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const [c1, c2] = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${c1}22 0%, ${c2}22 100%)`,
      border: `1.5px solid ${c1}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: c1, flexShrink: 0,
      letterSpacing: '-.01em',
    }}>
      {initials}
    </div>
  )
}

const STATUS_MAP = {
  ACTIVE: { label: 'Activo', cls: 'badge-success' }, active: { label: 'Activo', cls: 'badge-success' },
  OVERDUE: { label: 'Vencido', cls: 'badge-danger' }, overdue: { label: 'Vencido', cls: 'badge-danger' },
  PENDING: { label: 'Pendiente', cls: 'badge-warning' }, pending: { label: 'Pendiente', cls: 'badge-warning' },
  SCHEDULED: { label: 'Programado', cls: 'badge-accent' }, scheduled: { label: 'Programado', cls: 'badge-accent' },
  COMPLETED: { label: 'Completado', cls: 'badge-muted' }, completed: { label: 'Completado', cls: 'badge-muted' },
  INACTIVE: { label: 'Inactivo', cls: 'badge-muted' }, inactive: { label: 'Inactivo', cls: 'badge-muted' },
}
export const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, cls: 'badge-muted' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}

export const Sparkline = ({ data, color = 'var(--accent)', height = 36, width = 80 }) => {
  if (!data?.length) return null
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 6) - 3}`).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color} fillOpacity=".1" stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

export const StatCard = ({ label, value, sub, subUp, color = 'var(--accent)', sparkData }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    {/* Top accent line with glow */}
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, opacity: .9 }} />
    {/* Ambient glow in corner */}
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color, opacity: .06, filter: 'blur(24px)', pointerEvents: 'none' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</p>
        <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1, color: 'var(--text)' }}>{value}</p>
        {sub && (
          <p style={{ fontSize: 12, marginTop: 7, color: subUp === true ? 'var(--success)' : subUp === false ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
            {subUp !== undefined && <Icon path={subUp ? ICONS.arrowUp : ICONS.arrowDown} size={11} strokeWidth={2.5} />}{sub}
          </p>
        )}
      </div>
      {sparkData && <Sparkline data={sparkData} color={color} />}
    </div>
  </div>
)

export const Modal = ({ open, onClose, title, children, maxWidth = 480 }) => {
  if (!open) return null
  return createPortal(
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ padding: 6 }}><Icon path={ICONS.close} size={16} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export const EmptyState = ({ icon, title, desc, action }) => (
  <div className="empty-state">
    <div style={{ width: 48, height: 48, background: 'var(--accent-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon path={icon} size={22} stroke="var(--accent)" />
    </div>
    <div><p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{title}</p><p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{desc}</p></div>
    {action}
  </div>
)

export const BarChart = ({ data, color = 'var(--accent)' }) => {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ width: '100%', background: d.current ? color : `${color}30`, borderRadius: '4px 4px 0 0', height: `${(d.value / max) * 56}px`, transition: 'height .5s ease', minHeight: 4 }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export const Donut = ({ segments, size = 72, strokeWidth = 9 }) => {
  const r = (size - strokeWidth) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r
  const total = segments.reduce((a, b) => a + b.value, 0)
  let cumulative = 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ
        const offset = -((total - cumulative) / total) * circ
        cumulative += seg.value
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" />
      })}
    </svg>
  )
}

export const SearchInput = ({ value, onChange, placeholder = 'Buscar...', width = 240 }) => (
  <div className="input-icon-wrapper" style={{ width }}>
    <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
    <input className="input" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
)

export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Eliminar', danger = true }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth={400}>
    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
    </div>
  </Modal>
)
