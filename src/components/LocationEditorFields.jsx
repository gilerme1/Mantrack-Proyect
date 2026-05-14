import React, { useContext, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Icon, ICONS } from './UI.jsx'
import { geocodeAPI } from '../lib/api.js'
import { ThemeContext } from '../App.jsx'

const DEFAULT_MAP_CENTER = [-34.9011, -56.1645]

export function AddressAutocomplete({ form, setForm, placeholder = 'Buscar dirección del lugar...' }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const hasLocation = form.address && form.lat && form.lng

  useEffect(() => {
    const query = form.address?.trim() || ''
    if (query.length < 3 || hasLocation) {
      setSuggestions([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    const timer = window.setTimeout(() => {
      geocodeAPI.suggest(query)
        .then(data => {
          if (cancelled) return
          setSuggestions(data.suggestions || [])
          setOpen(true)
        })
        .catch(() => {
          if (!cancelled) setError('No se pudieron cargar sugerencias')
        })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 280)

    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [form.address, form.lat, form.lng, hasLocation])

  useEffect(() => {
    const close = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const changeAddress = (value) => {
    setForm(p => ({ ...p, address: value, lat: '', lng: '' }))
    setOpen(true)
  }

  const selectSuggestion = async (place) => {
    setForm(p => ({ ...p, address: place.label, lat: '', lng: '' }))
    setOpen(false)
    setLoading(true)
    setError('')
    try {
      const resolved = await geocodeAPI.resolve(place)
      setForm(p => ({
        ...p,
        address: resolved.address,
        lat: String(resolved.lat),
        lng: String(resolved.lng),
      }))
    } catch {
      setError('No se pudo ubicar esa dirección')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setForm(p => ({ ...p, address: '', lat: '', lng: '' }))
    setSuggestions([])
    setError('')
  }

  return (
    <div className="field">
      <label className="label">Dirección</label>
      <div className="address-autocomplete" ref={boxRef}>
        <div className="input-icon-wrapper">
          <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
          <input
            className="input mobile-input"
            placeholder={placeholder}
            value={form.address || ''}
            onChange={e => changeAddress(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>
        {open && (loading || error || suggestions.length > 0) && (
          <div className="address-suggestions">
            {loading && <div className="address-suggestion muted">Buscando direcciones...</div>}
            {!loading && error && <div className="address-suggestion muted">{error}</div>}
            {!loading && suggestions.map(s => (
              <button key={s.magicKey || s.label} type="button" className="address-suggestion" onClick={() => selectSuggestion(s)}>
                <Icon path={ICONS.mapPin} size={13} stroke="var(--accent)" />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}
        {(form.address || hasLocation) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear} style={{ marginTop: 8 }}>
            Limpiar dirección
          </button>
        )}
      </div>
    </div>
  )
}

export function LocationMapPicker({ form, setForm }) {
  const mapRef = useRef(null)
  const mapInst = useRef(null)
  const markerRef = useRef(null)
  const tileRef = useRef(null)
  const { theme } = useContext(ThemeContext)
  const lat = Number(form.lat)
  const lng = Number(form.lng)
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng)

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    const map = L.map(mapRef.current, {
      center: hasLocation ? [lat, lng] : DEFAULT_MAP_CENTER,
      zoom: hasLocation ? 15 : 11,
      zoomControl: true,
      scrollWheelZoom: false,
    })
    mapInst.current = map
    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    tileRef.current = L.tileLayer(tileUrl, { attribution: '© <a href="https://carto.com">CARTO</a>', maxZoom: 19 }).addTo(map)
    map.on('click', e => {
      setForm(p => ({ ...p, lat: String(e.latlng.lat), lng: String(e.latlng.lng) }))
    })
    const refreshSize = () => map.invalidateSize()
    requestAnimationFrame(refreshSize)
    const timers = [120, 320, 700].map(delay => window.setTimeout(refreshSize, delay))
    const observer = new ResizeObserver(refreshSize)
    observer.observe(mapRef.current)
    return () => {
      timers.forEach(window.clearTimeout)
      observer.disconnect()
      map.remove()
      mapInst.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInst.current || !tileRef.current) return
    tileRef.current.setUrl(theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png')
  }, [theme])

  useEffect(() => {
    if (!mapInst.current) return
    mapInst.current.invalidateSize()
    if (!hasLocation) {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null }
      return
    }
    const position = [lat, lng]
    const icon = L.divIcon({
      className: '',
      html: '<div class="client-location-pin"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })
    if (!markerRef.current) {
      markerRef.current = L.marker(position, { icon, draggable: true }).addTo(mapInst.current)
      markerRef.current.on('dragend', e => {
        const next = e.target.getLatLng()
        setForm(p => ({ ...p, lat: String(next.lat), lng: String(next.lng) }))
      })
    } else {
      markerRef.current.setLatLng(position)
    }
    window.setTimeout(() => {
      mapInst.current?.invalidateSize()
      mapInst.current?.setView(position, Math.max(mapInst.current.getZoom(), 15), { animate: true })
    }, 40)
  }, [form.lat, form.lng, hasLocation, lat, lng, setForm])

  const useMapCenter = () => {
    if (!mapInst.current) return
    const center = mapInst.current.getCenter()
    setForm(p => ({ ...p, lat: String(center.lat), lng: String(center.lng) }))
  }

  return (
    <div className="field">
      <label className="label">Mapa del lugar</label>
      <div className="client-location-map" ref={mapRef} />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginTop: 8 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {hasLocation ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Busca una dirección o haz click en el mapa.'}
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={useMapCenter}>Usar centro</button>
      </div>
    </div>
  )
}
