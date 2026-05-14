import React, { useState, useContext, useEffect, useRef } from 'react'
import { Icon, ICONS, Avatar, StatusBadge } from './UI.jsx'
import { ThemeContext } from '../App.jsx'
import { searchAPI } from '../lib/api.js'

const TYPE_META = {
  client:    { label: 'Cliente', icon: ICONS.clients },
  equipment: { label: 'Equipo',  icon: ICONS.equipment },
  report:    { label: 'Reporte', icon: ICONS.reports },
}

function GlobalSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = window.setTimeout(() => {
      searchAPI.global(q)
        .then(data => {
          if (cancelled) return
          setResults(data.results || [])
          setOpen(true)
        })
        .catch(() => {
          if (!cancelled) setResults([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const close = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleSelect = (item) => {
    setQuery('')
    setResults([])
    setOpen(false)
    onSelect?.(item)
  }

  return (
    <div className="global-search hide-mobile" ref={boxRef}>
      <div className="input-icon-wrapper">
        <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
        <input
          className="input"
          placeholder="Buscar clientes, equipos o reportes..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="global-search-results">
          {loading && (
            <div className="global-search-empty">
              <span className="spin" style={{ width: 14, height: 14, border: '2px solid var(--border-light)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
              Buscando...
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="global-search-empty">Sin resultados</div>
          )}
          {!loading && results.map(item => {
            const meta = TYPE_META[item.type] || TYPE_META.client
            return (
              <button key={`${item.type}-${item.id}`} type="button" className="global-search-item" onClick={() => handleSelect(item)}>
                <div className="global-search-icon">
                  <Icon path={meta.icon} size={14} stroke="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    <span className="badge badge-muted" style={{ flexShrink: 0 }}>{meta.label}</span>
                  </div>
                  {item.subtitle && (
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</p>
                  )}
                </div>
                {item.status && <StatusBadge status={item.status} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SidebarToggle({ collapsed, onToggle }) {
  return (
    <button
      className={`sidebar-toggle hide-mobile ${collapsed ? 'is-collapsed' : 'is-expanded'}`}
      onClick={onToggle}
      title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      aria-pressed={!collapsed}
      type="button"
    >
      <span className="sidebar-toggle-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  )
}

export default function Topbar({ title, breadcrumb, onMenuClick, user, onLogout, collapsed, setCollapsed, onGlobalSearchSelect, canGoBack, onBack, onBreadcrumbHome }) {
  const [showUser, setShowUser] = useState(false)
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <header style={{
      height: 58,
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      position: 'sticky',
      top: 0,
      zIndex: 5,
      gap: 10,
      flexShrink: 0,
    }}>
      {/* Left: collapse (desktop) + hamburger (mobile) + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>

        {/* Mobile hamburger */}
        <button className="btn btn-ghost btn-icon hide-desktop" onClick={onMenuClick} style={{ padding: 7 }}>
          <Icon path={ICONS.menu} size={17} />
        </button>

        {/* Desktop collapse toggle */}
        {setCollapsed && (
          <SidebarToggle collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        )}

        {canGoBack && (
          <button
            className="btn btn-ghost btn-icon"
            onClick={onBack}
            title="Volver"
            style={{ padding: 7, borderRadius: 'var(--radius-sm)' }}
          >
            <Icon path={ICONS.chevLeft} size={15} strokeWidth={2.2} />
          </button>
        )}

        {/* Breadcrumb + title */}
        <div style={{ minWidth: 0 }}>
          {breadcrumb && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
              {breadcrumb.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: .6 }}>/</span>}
                  {i === 0 && breadcrumb.length > 1 ? (
                    <button
                      type="button"
                      onClick={onBreadcrumbHome}
                      style={{
                        border: 0,
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-hover)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                      {b}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: i === breadcrumb.length - 1 ? 'var(--text-secondary)' : 'var(--text-muted)', fontWeight: i === breadcrumb.length - 1 ? 500 : 400 }}>{b}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{title}</h1>
        </div>
      </div>

      <GlobalSearch onSelect={onGlobalSearchSelect} />

      {/* Right: theme + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, position: 'relative' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-icon"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          style={{ padding: 7 }}
        >
          <Icon path={theme === 'dark' ? ICONS.sun : ICONS.moon} size={15} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

        {/* User button */}
        <button
          onClick={() => setShowUser(!showUser)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: showUser ? 'var(--surface-hover)' : 'transparent',
            border: '1px solid',
            borderColor: showUser ? 'var(--border-light)' : 'transparent',
            cursor: 'pointer', padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            transition: 'all .15s ease',
          }}
          onMouseEnter={e => { if (!showUser) { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--border)' }}}
          onMouseLeave={e => { if (!showUser) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}}
        >
          <Avatar name={user?.name || 'U'} size={27} />
          {user && (
            <div style={{ textAlign: 'left' }} className="hide-mobile">
              <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2, color: 'var(--text)' }}>{user.name}</p>
              <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1 }}>
                {user.role === 'ADMIN' ? 'Administrador' : user.role === 'MANAGER' ? 'Manager' : 'Técnico'}
              </p>
            </div>
          )}
        </button>

        {/* User dropdown */}
        {showUser && (
          <>
            <div onClick={() => setShowUser(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              width: 210,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 50,
              animation: 'fadeUp .15s cubic-bezier(.16,1,.3,1)',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user?.name}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</p>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--danger)', border: 'none', background: 'transparent' }}
                  onClick={() => { setShowUser(false); onLogout() }}
                >
                  <Icon path={ICONS.logout} size={13} stroke="var(--danger)" /> Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
