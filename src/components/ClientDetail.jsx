import React, { useEffect, useRef, useContext, useState } from 'react'
import L from 'leaflet'
import { Icon, ICONS, Avatar, StatusBadge, Modal, ConfirmDialog } from './UI.jsx'
import { equipmentAPI, clientsAPI } from '../lib/api.js'
import { Select, SelectItem } from './Primitives.jsx'
import { AddressAutocomplete, LocationMapPicker } from './LocationEditorFields.jsx'
import { ThemeContext } from '../App.jsx'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function ClientMap({ client }) {
  const mapRef  = useRef(null)
  const mapInst = useRef(null)
  const tileRef = useRef(null)
  const { theme } = useContext(ThemeContext)

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return
    const mappedPlaces = (client.locations || []).filter(p => p.lat && p.lng)
    if (!client.lat && !client.lng && mappedPlaces.length === 0) return

    const map = L.map(mapRef.current, {
      center: client.lat && client.lng ? [client.lat, client.lng] : [mappedPlaces[0].lat, mappedPlaces[0].lng],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
    })
    mapInst.current = map

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    tileRef.current = L.tileLayer(tileUrl, {
      attribution: '© <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:#6366f1;border:3px solid #fff;box-shadow:0 2px 8px rgba(99,102,241,.6)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    const coords = []
    if (client.lat && client.lng) {
      coords.push([client.lat, client.lng])
      L.marker([client.lat, client.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong style="font-family:system-ui;font-size:13px">${client.name}</strong>${client.address ? `<p style="font-family:system-ui;font-size:11px;color:#888;margin:4px 0 0">${client.address}</p>` : ''}`, { maxWidth: 200 })
    }

    const placeIcon = L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:5px;background:#1DB954;border:3px solid #fff;box-shadow:0 2px 8px rgba(29,185,84,.55)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    mappedPlaces.forEach(place => {
      coords.push([place.lat, place.lng])
      L.marker([place.lat, place.lng], { icon: placeIcon })
        .addTo(map)
        .bindPopup(`<strong style="font-family:system-ui;font-size:13px">${place.name}</strong>${place.address ? `<p style="font-family:system-ui;font-size:11px;color:#888;margin:4px 0 0">${place.address}</p>` : ''}`, { maxWidth: 220 })
    })
    if (coords.length > 1) map.fitBounds(L.latLngBounds(coords), { padding: [26, 26] })

    return () => { map.remove(); mapInst.current = null }
  }, [client])

  useEffect(() => {
    if (!mapInst.current || !tileRef.current) return
    tileRef.current.setUrl(
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    )
  }, [theme])

  if (!client.lat || !client.lng) return null
  return (
    <div ref={mapRef} style={{ height: 220, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }} />
  )
}

export default function ClientDetail({ client, onClose, onViewEquipment }) {
  const [equipment, setEquipment] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [detail,    setDetail]    = useState(client)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocation,  setEditingLocation]  = useState(null)
  const [locationForm, setLocationForm] = useState({ name: '', type: 'Sucursal', address: '', notes: '', lat: '', lng: '' })
  const [savingLocation, setSavingLocation] = useState(false)
  const [confirmLocation, setConfirmLocation] = useState(null)

  const loadDetail = () => {
    setLoading(true)
    Promise.all([
      clientsAPI.get(client.id).then(setDetail),
      equipmentAPI.list({ clientId: client.id }).then(setEquipment),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { loadDetail() }, [client.id]) // eslint-disable-line

  const current = detail || client
  const locations = current.locations || []
  const hasCoords = !!(current.lat && current.lng)
  const hasMapCoords = hasCoords || locations.some(place => place.lat && place.lng)

  const openNewLocation = () => {
    setLocationForm({ name: '', type: 'Sucursal', address: current.address || '', notes: '', lat: current.lat ? String(current.lat) : '', lng: current.lng ? String(current.lng) : '' })
    setEditingLocation(null)
    setShowLocationForm(true)
  }

  const openEditLocation = (location) => {
    setLocationForm({
      name: location.name || '',
      type: location.type || 'Sucursal',
      address: location.address || '',
      notes: location.notes || '',
      lat: location.lat ? String(location.lat) : '',
      lng: location.lng ? String(location.lng) : '',
    })
    setEditingLocation(location.id)
    setShowLocationForm(true)
  }

  const saveLocation = async () => {
    if (!locationForm.name.trim()) return
    setSavingLocation(true)
    try {
      if (editingLocation) await clientsAPI.updateLocation(current.id, editingLocation, locationForm)
      else await clientsAPI.createLocation(current.id, locationForm)
      setShowLocationForm(false)
      loadDetail()
    } catch (e) { alert(e.message) }
    finally { setSavingLocation(false) }
  }

  const deleteLocation = async () => {
    try {
      await clientsAPI.deleteLocation(current.id, confirmLocation.id)
      loadDetail()
    } catch (e) { alert(e.message) }
    finally { setConfirmLocation(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Client header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={current.name} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</p>
          {current.sector && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{current.sector}</p>}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { label: 'Equipos',  value: equipment.length || current.equipment || 0, color: 'var(--text)' },
          { label: 'Lugares',  value: locations.length, color: 'var(--accent)' },
          { label: 'Vencidos', value: current.overdue || equipment.filter(e => e.status === 'OVERDUE').length, color: (current.overdue || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contact info */}
      {(current.address || current.contact || current.phone) && (
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.address && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Icon path={ICONS.mapPin} size={14} stroke="var(--accent)" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{current.address}</p>
            </div>
          )}
          {current.contact && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon path={ICONS.user} size={14} stroke="var(--text-muted)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{current.contact}</p>
            </div>
          )}
          {current.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon path={ICONS.smartphone} size={14} stroke="var(--text-muted)" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{current.phone}</p>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      {hasMapCoords && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Ubicación y lugares</p>
          <ClientMap key={`${current.id}-${locations.map(l => `${l.id}:${l.updatedAt}`).join('|')}`} client={current} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            {hasCoords ? `${current.lat?.toFixed(5)}, ${current.lng?.toFixed(5)}` : `${locations.filter(p => p.lat && p.lng).length} lugares geolocalizados`}
          </p>
        </div>
      )}

      {!hasMapCoords && (
        <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Icon path={ICONS.mapPin} size={16} stroke="var(--text-muted)" />
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Sin ubicación en el mapa. Edita el cliente y elige una dirección.</p>
        </div>
      )}

      {/* Locations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Lugares ({locations.length})
          </p>
          <button className="btn btn-ghost btn-sm" onClick={openNewLocation}>
            <Icon path={ICONS.plus} size={12} /> Agregar lugar
          </button>
        </div>
        {locations.length === 0 ? (
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 13 }}>
            Sin sucursales, casas, depósitos o lugares registrados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locations.map(place => (
              <div key={place.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(29,185,84,.12)', border: '1px solid rgba(29,185,84,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon path={ICONS.mapPin} size={14} stroke="#1DB954" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>{place.name}</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                    {[place.type, place.address].filter(Boolean).join(' · ') || 'Sin dirección'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{place._count?.equipment || 0} equipos asignados</p>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEditLocation(place)}><Icon path={ICONS.edit} size={12} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmLocation(place)}><Icon path={ICONS.trash} size={12} stroke="var(--danger)" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment list */}
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          Equipos ({equipment.length})
        </p>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)}
          </div>
        ) : equipment.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Sin equipos registrados
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {equipment.map(eq => (
              <div key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon path={ICONS.equipment} size={14} stroke="var(--text-muted)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.name}</p>
                  {(eq.model || eq.plate || eq.serial || eq.place?.name || eq.location) && (
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[eq.model, eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`, eq.place?.name, eq.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <StatusBadge status={eq.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer action */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={onViewEquipment}
      >
        <Icon path={ICONS.equipment} size={14} stroke="white" strokeWidth={2} />
        Ver todos los equipos
      </button>

      <Modal open={showLocationForm} onClose={() => setShowLocationForm(false)} title={editingLocation ? 'Editar lugar' : 'Nuevo lugar'} maxWidth={620}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="label">Nombre del lugar *</label>
            <input className="input mobile-input" placeholder="Ej. Sucursal Pocitos, Depósito Norte..." value={locationForm.name} onChange={e => setLocationForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Tipo</label>
            <Select value={locationForm.type} onValueChange={v => setLocationForm(p => ({ ...p, type: v }))}>
              <SelectItem value="Sucursal">Sucursal</SelectItem>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Depósito">Depósito</SelectItem>
              <SelectItem value="Planta">Planta</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </Select>
          </div>
          <AddressAutocomplete form={locationForm} setForm={setLocationForm} placeholder="Buscar dirección del lugar..." />
          <LocationMapPicker form={locationForm} setForm={setLocationForm} />
          <div className="field">
            <label className="label">Notas</label>
            <textarea className="input mobile-input" rows={3} placeholder="Referencia interna, acceso, piso, portería..." value={locationForm.notes} onChange={e => setLocationForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={() => setShowLocationForm(false)}>Cancelar</button>
            <button className="btn btn-primary mobile-btn-full" onClick={saveLocation} disabled={!locationForm.name.trim() || savingLocation}>
              {savingLocation ? 'Guardando...' : editingLocation ? 'Guardar lugar' : 'Crear lugar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmLocation}
        onClose={() => setConfirmLocation(null)}
        onConfirm={deleteLocation}
        title="Eliminar lugar"
        message={`¿Eliminar "${confirmLocation?.name}"? Los equipos asignados quedarán sin lugar, pero no se eliminarán.`}
      />
    </div>
  )
}
