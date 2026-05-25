import React, { useState, useContext } from 'react'
import { Icon, ICONS } from '../components/UI.jsx'
import { auth, setToken } from '../lib/api.js'
import { BrandingContext, resolveLogoFull } from '../lib/branding.js'

export default function Login({ onLogin }) {
  const [email,     setEmail]     = useState('admin@empresa.com')
  const [password,  setPassword]  = useState('admin123')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [logoError, setLogoError] = useState(false)
  const { branding } = useContext(BrandingContext)
  const isDark = document.documentElement.dataset.theme === 'dark'
  const { src: rawLogoSrc, filter: logoFilter } = resolveLogoFull(branding, isDark)
  const logoSrc = logoError ? null : rawLogoSrc

  const handleSubmit = async (event) => {
    event?.preventDefault()
    setError(null); setLoading(true)
    try {
      const { token, user } = await auth.login(email, password)
      setToken(token); onLogin(user)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div className="animate-up" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="logo"
              onError={() => setLogoError(true)}
              style={{ maxWidth: 220, maxHeight: 120, objectFit: 'contain', display: 'block', margin: '0 auto', marginBottom: 18, filter: logoFilter }}
            />
          ) : (
            <div style={{ width: 96, height: 96, background: 'var(--accent)', borderRadius: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 0 40px rgba(99,102,241,.35)' }}>
              <Icon path={ICONS.wrench} size={44} stroke="white" strokeWidth={1.8} />
            </div>
          )}
          {branding.appSlogan && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{branding.appSlogan}</p>
          )}
        </div>
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Iniciar sesión</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="label" htmlFor="login-email">Email</label>
              <input id="login-email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="field">
              <label className="label" htmlFor="login-password">Contraseña</label>
              <input id="login-password" className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--danger)' }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%' }} />Ingresando...</span>
                : 'Ingresar'
              }
            </button>
          </form>
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>Demo</p>
          <p style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>admin@empresa.com / admin123</p>
        </div>
      </div>
    </div>
  )
}
