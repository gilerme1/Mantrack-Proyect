import React, { useState, useEffect } from 'react'
import { Icon, ICONS } from './UI.jsx'
import { Select, SelectItem } from './Primitives.jsx'

const CACHE_KEY = 'mt_currency_cache'
const CACHE_TTL = 60 * 60 * 1000 // 1 hora


function fmtResult(val, to) {
  return val.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtRate(val, to) {
  return val.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

export default function CurrencyWidget() {
  const [rates,   setRates]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [updated, setUpdated] = useState(null)
  const [amount,  setAmount]  = useState('1')
  const [from,    setFrom]    = useState('USD')
  const [to,      setTo]      = useState('UYU')

  const fetchRates = async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const { data, ts } = JSON.parse(cached)
          if (Date.now() - ts < CACHE_TTL) {
            setRates(data)
            setUpdated(new Date(ts))
            setLoading(false)
            return
          }
        } catch (_) {}
      }
    }
    try {
      setLoading(true)
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!res.ok) throw new Error('Error API')
      const json = await res.json()
      const now = Date.now()
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.rates, ts: now }))
      setRates(json.rates)
      setUpdated(new Date(now))
    } catch {
      setError('Sin conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRates() }, [])

  const getRate = (f, t) => {
    if (!rates) return 0
    if (f === 'USD') return rates[t]
    return rates[t] / rates[f]
  }

  const allCurrencies = ['USD', 'EUR', 'UYU', 'ARS', 'BRL', 'CLP']

  if (loading) return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
      <div className="spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  if (error || !rates) return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 28 }}>💱</span>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Divisas</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sin conexión</p>
      </div>
    </div>
  )

  const parsedAmount = parseFloat(amount) || 0
  const convertedAmount = parsedAmount * getRate(from, to)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em' }}>Divisas</p>
        <button onClick={() => fetchRates(true)} className="btn btn-ghost btn-icon" title="Actualizar" style={{ padding: 4, opacity: .7 }}>
          <Icon path={ICONS.refresh} size={12} />
        </button>
      </div>

      {/* Conversor */}
      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="input"
            style={{ flex: 1, fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '6px 10px' }}
          />
          <div style={{ width: 90 }}>
            <Select value={from} onValueChange={v => { setFrom(v); if (v === to) setTo(allCurrencies.find(c => c !== v)) }}>
              {allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>⇅</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="input" style={{ flex: 1, fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '6px 10px', color: 'var(--accent)', background: 'var(--accent-soft)', borderColor: 'transparent', cursor: 'default' }}>
            {parsedAmount > 0 ? fmtResult(convertedAmount, to) : '—'}
          </div>
          <div style={{ width: 90 }}>
            <Select value={to} onValueChange={v => { setTo(v); if (v === from) setFrom(allCurrencies.find(c => c !== v)) }}>
              {allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </Select>
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: -2 }}>
          1 {from} = {fmtRate(getRate(from, to), to)} {to}
        </p>
      </div>

      {updated && (
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          Act. {updated.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}
