import React from 'react'
import { Icon, ICONS } from './UI.jsx'

const TABS = [
  { id: 'dashboard', label: 'Inicio',   icon: ICONS.dashboard },
  { id: 'equipment', label: 'Equipos',  icon: ICONS.equipment },
  { id: 'qr',        label: 'Escanear', icon: ICONS.qr,        highlight: true },
  { id: 'reports',   label: 'Reportes', icon: ICONS.reports    },
  { id: 'clients',   label: 'Clientes', icon: ICONS.clients    },
]

export default function MobileNav({ active, setActive }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 64,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id
        if (tab.highlight) {
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                position: 'relative',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isActive ? 'var(--accent)' : 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99,102,241,.45)',
                marginTop: -16,
                transition: 'transform .15s',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
              }}>
                <Icon path={tab.icon} size={20} stroke="white" strokeWidth={1.8} />
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: 'var(--accent)',
                marginTop: 2,
                letterSpacing: '.02em',
              }}>{tab.label}</span>
            </button>
          )
        }
        return (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0 4px',
              transition: 'opacity .15s',
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background .15s',
            }}>
              <Icon
                path={tab.icon}
                size={18}
                stroke={isActive ? 'var(--accent)' : 'var(--text-muted)'}
                strokeWidth={isActive ? 2 : 1.6}
              />
            </div>
            <span style={{
              fontSize: 9.5,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              letterSpacing: '.01em',
            }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
