import React, { useState, useEffect } from 'react'
import { Icon, ICONS } from './UI.jsx'

export default function PWABanner() {
  const [prompt,    setPrompt]    = useState(null)
  const [visible,   setVisible]   = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); setVisible(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone
    if (isIOS) setTimeout(() => setVisible(true), 2000)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible || installed) return null
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !prompt

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setVisible(false)
  }

  return (
    <div className="pwa-banner">
      <div style={{ width: 40, height: 40, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon path={ICONS.wrench} size={18} stroke="white" strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>Instalar MantTrack</p>
        {isIOS
          ? <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>Toca <strong>Compartir</strong> → <strong>Agregar a pantalla de inicio</strong></p>
          : <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Acceso rápido desde tu dispositivo</p>
        }
      </div>
      {!isIOS && <button className="btn btn-primary btn-sm" onClick={handleInstall} style={{ flexShrink: 0 }}>Instalar</button>}
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setVisible(false)} style={{ flexShrink: 0 }}><Icon path={ICONS.close} size={14} /></button>
    </div>
  )
}
