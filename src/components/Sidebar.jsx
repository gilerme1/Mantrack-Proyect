import React, { useContext } from 'react'
import { Icon, ICONS } from './UI.jsx'
import { BrandingContext, resolveLogoIcon, resolveLogoFull } from '../lib/branding.js'
import { ThemeContext } from '../App.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: ICONS.dashboard },
  { id: 'clients',   label: 'Clientes',     icon: ICONS.clients   },
  { id: 'equipment', label: 'Equipos',      icon: ICONS.equipment },
  { id: 'reports',   label: 'Reportes',     icon: ICONS.reports   },
  { id: 'qr',        label: 'Códigos QR',   icon: ICONS.qr        },
  { id: 'settings',  label: 'Configuración',icon: ICONS.settings  },
]

export default function Sidebar({ active, setActive, collapsed }) {
  const { branding } = useContext(BrandingContext)
  const { theme } = useContext(ThemeContext)
  const isDark = theme === 'dark'
  const { src: iconSrc, filter: iconFilter } = resolveLogoIcon(branding, isDark)
  const { src: fullSrc, filter: fullFilter } = resolveLogoFull(branding, isDark)

  return (
    <aside style={{
      width: collapsed ? 56 : 220,
      minHeight: '100dvh',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width .22s cubic-bezier(.16,1,.3,1)',
      flexShrink: 0,
      zIndex: 10,
      overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        height: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '0 13px' : '0 14px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {collapsed ? (
          /* Ícono pequeño cuando colapsado */
          <div style={{
            width: 30, height: 30,
            background: iconSrc ? 'transparent' : 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
            boxShadow: iconSrc ? 'none' : '0 2px 12px rgba(99,102,241,.4)',
          }}>
            {iconSrc
              ? <img src={iconSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: iconFilter }} />
              : <Icon path={ICONS.wrench} size={14} stroke="white" strokeWidth={2.2} />
            }
          </div>
        ) : fullSrc ? (
          /* Logo completo cuando expandido */
          <img
            src={fullSrc}
            alt="logo"
            style={{ maxWidth: 160, maxHeight: 38, objectFit: 'contain', display: 'block', filter: fullFilter }}
          />
        ) : (
          /* Fallback sin logo: ícono + nombre */
          <>
            <div style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 12px rgba(99,102,241,.4)',
            }}>
              <Icon path={ICONS.wrench} size={14} stroke="white" strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <span style={{
                fontWeight: 800, fontSize: 14.5,
                letterSpacing: '-.025em',
                display: 'block',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{branding.appName}</span>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -1, letterSpacing: '.03em', fontWeight: 500 }}>v1.1</p>
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(item => (
          <div
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => setActive(item.id)}
            title={collapsed ? item.label : undefined}
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '9px' : '9px 12px',
              gap: collapsed ? 0 : 10,
            }}
          >
            <Icon
              path={item.icon}
              size={16}
              strokeWidth={active === item.id ? 2.2 : 1.7}
            />
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}
      </nav>

    </aside>
  )
}
