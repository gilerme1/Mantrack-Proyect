import React, { useState, useContext } from 'react'
import { Icon, ICONS, Avatar } from './UI.jsx'
import { ThemeContext } from '../App.jsx'
import { BrandingContext } from '../lib/branding.js'

const PAGE_TITLES = {
  dashboard: 'Trabajo de campo',
  clients:   'Clientes',
  equipment: 'Equipos',
  reports:   'Reportes',
  qr:        'Códigos QR',
  settings:  'Configuración',
}

export default function MobileTopbar({ active, user, onLogout }) {
  const [showUser, setShowUser] = useState(false)
  const { theme, toggleTheme } = useContext(ThemeContext)
  const { branding } = useContext(BrandingContext)

  return (
    <header style={{
      height: 56,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          background: 'var(--accent)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {branding.logoDataUrl
            ? <img src={branding.logoDataUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon path={ICONS.wrench} size={13} stroke="white" strokeWidth={2} />
          }
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.02em', color: 'var(--text)' }}>
          {PAGE_TITLES[active] || branding.appName}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-icon"
          style={{ padding: 7 }}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <Icon path={theme === 'dark' ? ICONS.sun : ICONS.moon} size={16} />
        </button>

        <button
          onClick={() => setShowUser(!showUser)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 8,
          }}
        >
          <Avatar name={user?.name || 'U'} size={30} />
        </button>

        {showUser && (
          <>
            <div
              onClick={() => setShowUser(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            />
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              background: 'var(--surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              width: 220,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 50,
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</p>
                <span style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, display: 'block' }}>
                  {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'MANAGER' ? 'Manager' : 'Técnico'}
                </span>
              </div>
              <div style={{ padding: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', gap: 8, color: 'var(--danger)' }}
                  onClick={() => { setShowUser(false); onLogout() }}
                >
                  <Icon path={ICONS.logout} size={14} stroke="var(--danger)" /> Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
