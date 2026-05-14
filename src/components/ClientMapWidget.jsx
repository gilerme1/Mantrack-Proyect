import React, { useCallback, useEffect, useRef, useState, useContext } from 'react'
import L from 'leaflet'
import { clientsAPI } from '../lib/api.js'
import { ThemeContext } from '../App.jsx'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const STATUS_COLOR = {
  ok:      '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
}

function clientColor(c) {
  if (c.overdue > 0) return STATUS_COLOR.danger
  return STATUS_COLOR.ok
}

export default function ClientMapWidget({ onOpenClient }) {
  const mapRef         = useRef(null)
  const mapInst        = useRef(null)
  const boundsRef      = useRef(null)
  const onOpenClientRef = useRef(onOpenClient)
  const { theme }      = useContext(ThemeContext)
  const [places,  setPlaces]    = useState([])
  const [loading, setLoading]   = useState(true)
  const tileLayerRef = useRef(null)

  useEffect(() => { onOpenClientRef.current = onOpenClient }, [onOpenClient])

  useEffect(() => {
    clientsAPI.list().then(data => {
      setPlaces(data.flatMap(c => [
        ...(c.lat && c.lng ? [{
          id: `${c.id}-main`,
          kind: 'client',
          clientId: c.id,
          name: c.name,
          clientName: c.name,
          sector: c.sector,
          address: c.address,
          lat: c.lat,
          lng: c.lng,
          active: c.active,
          overdue: c.overdue,
        }] : []),
        ...((c.locations || []).filter(l => l.lat && l.lng).map(l => ({
          id: l.id,
          kind: 'place',
          clientId: c.id,
          name: l.name,
          type: l.type,
          clientName: c.name,
          address: l.address,
          lat: l.lat,
          lng: l.lng,
          active: c.active,
          overdue: c.overdue,
        }))),
      ]))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current || mapInst.current) return

    const withCoords = places.filter(c => c.lat && c.lng)
    if (withCoords.length === 0) return

    const center = withCoords.length === 1
      ? [withCoords[0].lat, withCoords[0].lng]
      : [
          withCoords.reduce((s, c) => s + c.lat, 0) / withCoords.length,
          withCoords.reduce((s, c) => s + c.lng, 0) / withCoords.length,
        ]

    const map = L.map(mapRef.current, {
      center,
      zoom: withCoords.length === 1 ? 10 : 5,
      zoomControl: true,
      scrollWheelZoom: false,
    })
    mapInst.current = map

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '© <a href="https://carto.com">CARTO</a>',
      maxZoom: 18,
    }).addTo(map)

    withCoords.forEach(c => {
      const color = c.kind === 'place' ? '#6366f1' : clientColor(c)
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;border-radius:${c.kind === 'place' ? '4px' : '50%'};background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      })
      const marker = L.marker([c.lat, c.lng], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:140px">
          <strong style="font-size:13px">${c.name}</strong>
          <p style="font-size:11px;color:#666;margin:4px 0 0">${c.kind === 'place' ? c.clientName : (c.sector || '')}</p>
          ${c.type ? `<p style="font-size:11px;color:#666;margin:2px 0 0">${c.type}</p>` : ''}
          ${c.address ? `<p style="font-size:11px;color:#888;margin:2px 0 0">${c.address}</p>` : ''}
          <p style="font-size:11px;margin:6px 0 0">
            <span style="color:#22C55E">${c.active} activos</span>
            ${c.overdue > 0 ? ` · <span style="color:#EF4444">${c.overdue} vencidos</span>` : ''}
          </p>
          <button data-client-id="${c.clientId}" style="margin-top:8px;width:100%;padding:5px 0;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">
            Ver cliente →
          </button>
        </div>
      `, { maxWidth: 220 })
    })

    map.on('popupopen', (e) => {
      const btn = e.popup.getElement()?.querySelector('[data-client-id]')
      if (btn) {
        btn.onclick = () => {
          map.closePopup()
          onOpenClientRef.current?.(btn.dataset.clientId)
        }
      }
    })

    if (withCoords.length > 1) {
      const bounds = L.latLngBounds(withCoords.map(c => [c.lat, c.lng]))
      boundsRef.current = bounds
      map.fitBounds(bounds, { padding: [30, 30] })
    } else if (withCoords.length === 1) {
      boundsRef.current = null
    }

    return () => { map.remove(); mapInst.current = null }
  }, [loading, places])

  useEffect(() => {
    if (!mapInst.current || !tileLayerRef.current) return
    tileLayerRef.current.setUrl(
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    )
  }, [theme])

  const withCoords = places.filter(c => c.lat && c.lng)

  const handleCenter = useCallback(() => {
    const map = mapInst.current
    if (!map) return
    if (boundsRef.current) {
      map.fitBounds(boundsRef.current, { padding: [30, 30] })
    } else if (withCoords.length === 1) {
      map.setView([withCoords[0].lat, withCoords[0].lng], 10)
    }
  }, [withCoords])

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Mapa de clientes y lugares</p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{withCoords.length} puntos ubicados</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR.ok }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cliente</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 3, background: '#6366f1' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lugar</span>
          </div>
          {!loading && withCoords.length > 0 && (
            <button
              onClick={handleCenter}
              title="Centrar mapa"
              style={{
                marginLeft: 4,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                lineHeight: 1,
              }}
            >
              Centrar
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div className="spin" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
        </div>
      )}

      {!loading && withCoords.length === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 200 }}>
          <span style={{ fontSize: 32 }}>🗺️</span>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin ubicaciones asignadas</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Agrega direcciones a los clientes para verlos aquí</p>
        </div>
      )}

      <div ref={mapRef} style={{ flex: 1, minHeight: 200, display: withCoords.length > 0 && !loading ? 'block' : 'none' }} />
    </div>
  )
}
