import React, { useState, useEffect } from 'react'
import { Icon, ICONS } from './UI.jsx'

const WMO_CODES = {
  0:  { label: 'Despejado',             emoji: '☀️' },
  1:  { label: 'Mayorm. despejado',     emoji: '🌤️' },
  2:  { label: 'Parcialm. nublado',     emoji: '⛅' },
  3:  { label: 'Nublado',               emoji: '☁️' },
  45: { label: 'Niebla',                emoji: '🌫️' },
  48: { label: 'Niebla helada',         emoji: '🌫️' },
  51: { label: 'Llovizna ligera',       emoji: '🌦️' },
  53: { label: 'Llovizna',              emoji: '🌦️' },
  55: { label: 'Llovizna intensa',      emoji: '🌧️' },
  61: { label: 'Lluvia ligera',         emoji: '🌧️' },
  63: { label: 'Lluvia',                emoji: '🌧️' },
  65: { label: 'Lluvia intensa',        emoji: '🌧️' },
  71: { label: 'Nieve ligera',          emoji: '🌨️' },
  73: { label: 'Nieve',                 emoji: '❄️' },
  75: { label: 'Nieve intensa',         emoji: '❄️' },
  80: { label: 'Chubascos',             emoji: '🌦️' },
  81: { label: 'Chubascos fuertes',     emoji: '⛈️' },
  95: { label: 'Tormenta',              emoji: '⛈️' },
  99: { label: 'Tormenta c/ granizo',   emoji: '⛈️' },
}

function getWeatherInfo(code) {
  return WMO_CODES[code] || { label: 'Variable', emoji: '🌡️' }
}

const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const LEGACY_LOCATION_CACHE_KEY = 'mt_weather_location'
const LOCATION_CACHE_KEY = 'mt_weather_location_v2'
const MANUAL_LOCATION_KEY = 'mt_weather_manual_location'
const DEFAULT_LOCATION = { lat: -34.9011, lng: -56.1645, city: 'Montevideo' }
const SANTIAGO_BOUNDS = { latMin: -34.2, latMax: -32.8, lngMin: -71.3, lngMax: -70.0 }

function isLegacySantiago(location) {
  if (!location) return false
  const city = String(location.city || '').toLowerCase()
  const lat = Number(location.lat)
  const lng = Number(location.lng)
  return city.includes('santiago') || (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= SANTIAGO_BOUNDS.latMin &&
    lat <= SANTIAGO_BOUNDS.latMax &&
    lng >= SANTIAGO_BOUNDS.lngMin &&
    lng <= SANTIAGO_BOUNDS.lngMax
  )
}

function getCachedLocation() {
  try {
    const cached = JSON.parse(localStorage.getItem(LOCATION_CACHE_KEY) || 'null')
    if (Number.isFinite(cached?.lat) && Number.isFinite(cached?.lng) && !isLegacySantiago(cached)) return cached
  } catch (_) {}
  return null
}

function getManualLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem(MANUAL_LOCATION_KEY) || 'null')
    if (Number.isFinite(saved?.lat) && Number.isFinite(saved?.lng)) return saved
  } catch (_) {}
  return null
}

export default function WeatherWidget() {
  const initialManual = getManualLocation()
  const [current, setCurrent] = useState(null)
  const [daily,   setDaily]   = useState([])
  const [city,    setCity]    = useState(initialManual?.city || getCachedLocation()?.city || DEFAULT_LOCATION.city)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [manualLocation, setManualLocation] = useState(initialManual)
  const [locationPicker, setLocationPicker] = useState(false)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState([])
  const [searchingLocation, setSearchingLocation] = useState(false)

  const fetchWeather = async (location, fallback = false) => {
    try {
      setLoading(true)
      setError(null)
      setUsingFallback(fallback)
      setCity(location.city)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}` +
        `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m` +
        `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum` +
        `&timezone=auto&forecast_days=6`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error API clima')
      const data = await res.json()
      setCurrent(data.current)
      const d = data.daily
      const forecast = []
      for (let i = 1; i <= 5; i++) {
        const date = new Date(d.time[i] + 'T12:00:00')
        forecast.push({
          day:   DAYS_ES[date.getDay()],
          max:   Math.round(d.temperature_2m_max[i]),
          min:   Math.round(d.temperature_2m_min[i]),
          code:  d.weathercode[i],
          rain:  d.precipitation_sum[i],
        })
      }
      setDaily(forecast)
    } catch (e) {
      setError('Sin datos')
    } finally {
      setLoading(false)
    }
  }

  const loadAutomaticLocation = () => {
    const cached = getCachedLocation()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            city: 'Tu ubicación',
          }
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location))
          fetchWeather(location)
        },
        () => fetchWeather(cached || DEFAULT_LOCATION, !cached),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 9000 }
      )
    } else {
      fetchWeather(cached || DEFAULT_LOCATION, !cached)
    }
  }

  useEffect(() => {
    localStorage.removeItem(LEGACY_LOCATION_CACHE_KEY)
    if (manualLocation) {
      fetchWeather(manualLocation)
      return
    }
    loadAutomaticLocation()
  }, [])

  const searchLocations = async () => {
    const q = locationQuery.trim()
    if (q.length < 2) return
    setSearchingLocation(true)
    try {
      const params = new URLSearchParams({ name: q, count: '8', language: 'es', format: 'json' })
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
      if (!res.ok) throw new Error('No se pudo buscar ubicación')
      const data = await res.json()
      const results = (data.results || [])
        .map(item => ({
          lat: item.latitude,
          lng: item.longitude,
          countryCode: item.country_code,
          city: [item.name, item.admin1, item.country].filter(Boolean).join(' · '),
        }))
        .sort((a, b) => (b.countryCode === 'UY') - (a.countryCode === 'UY'))
      setLocationResults(results)
    } catch {
      setLocationResults([])
    } finally {
      setSearchingLocation(false)
    }
  }

  const chooseManualLocation = (location) => {
    localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify(location))
    setManualLocation(location)
    setLocationPicker(false)
    setLocationQuery('')
    setLocationResults([])
    fetchWeather(location)
  }

  const useDeviceLocation = () => {
    localStorage.removeItem(MANUAL_LOCATION_KEY)
    setManualLocation(null)
    setLocationPicker(false)
    loadAutomaticLocation()
  }

  if (loading) return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
      <div className="spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  if (error || !current) return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 28 }}>🌡️</span>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Clima</p>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sin conexión</p>
      </div>
    </div>
  )

  const info = getWeatherInfo(current.weathercode)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Actual */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>Clima</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1 }}>
              {Math.round(current.temperature_2m)}°
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>C</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{info.label}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 38, lineHeight: 1 }}>{info.emoji}</span>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon path={ICONS.droplet} size={11} stroke="var(--accent)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{current.relativehumidity_2m}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon path={ICONS.wind} size={11} stroke="var(--text-muted)" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(current.windspeed_10m)} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon path={ICONS.mapPin} size={11} stroke="var(--text-muted)" />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {city} · ST {Math.round(current.apparent_temperature)}°C
        </span>
        <button className="btn btn-ghost btn-sm" style={{ padding: '3px 7px', fontSize: 10.5 }} onClick={() => setLocationPicker(v => !v)}>
          Cambiar
        </button>
      </div>
      {usingFallback && (
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: -4 }}>
          Activa permisos de ubicación para clima local exacto.
        </p>
      )}
      {manualLocation && (
        <p style={{ fontSize: 10.5, color: 'var(--accent)', marginTop: -4 }}>
          Ubicación de clima guardada manualmente.
        </p>
      )}

      {locationPicker && (
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="input"
              placeholder="Ciudad o localidad..."
              value={locationQuery}
              onChange={e => setLocationQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchLocations()}
              style={{ height: 36, fontSize: 12.5 }}
            />
            <button className="btn btn-primary btn-sm" onClick={searchLocations} disabled={searchingLocation || locationQuery.trim().length < 2}>
              {searchingLocation ? '...' : 'Buscar'}
            </button>
          </div>
          {locationResults.map(location => (
            <button
              key={`${location.lat}-${location.lng}`}
              type="button"
              onClick={() => chooseManualLocation(location)}
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 9, padding: '7px 9px', color: 'var(--text-secondary)', fontSize: 12, textAlign: 'left', cursor: 'pointer' }}
            >
              {location.city}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={useDeviceLocation} style={{ justifyContent: 'center' }}>
            Usar ubicación del dispositivo
          </button>
        </div>
      )}

      {/* Pronóstico 5 días */}
      {daily.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
          {daily.map((d, i) => {
            const di = getWeatherInfo(d.code)
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>{d.day}</span>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{di.emoji}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>{d.max}°</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{d.min}°</span>
                {d.rain > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: 9, color: 'var(--accent)' }}>💧</span>
                    <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{d.rain.toFixed(0)}mm</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
