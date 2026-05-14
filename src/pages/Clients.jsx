import React, { useState, useEffect, useCallback } from 'react'
import L from 'leaflet'
import { Icon, ICONS, Avatar, SearchInput, Modal, EmptyState, ConfirmDialog } from '../components/UI.jsx'
import { Select, SelectItem } from '../components/Primitives.jsx'
import ClientDetail from '../components/ClientDetail.jsx'
import { clientsAPI, geocodeAPI } from '../lib/api.js'
import useIsMobile from '../hooks/useIsMobile.js'

const SECTORS = ['Manufactura','Transporte','Minería','Alimentos','Salud','Construcción','Energía','Retail','Otro']
const DEFAULT_MAP_CENTER = [-33.45, -70.66]

function AddressAutocomplete({ form, setForm }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const hasLocation = form.address && form.lat && form.lng

  useEffect(() => {
    const query = form.address.trim()
    if (query.length < 3 || hasLocation) {
      setSuggestions([])
      setLoading(false)
      setError('')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    const timer = window.setTimeout(() => {
      geocodeAPI.suggest(query)
        .then(results => {
          if (cancelled) return
          setSuggestions(results)
          setOpen(true)
        })
        .catch(() => {
          if (cancelled) return
          setSuggestions([])
          setError('No se pudieron cargar direcciones')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [form.address, form.lat, form.lng, hasLocation])

  const handleAddressChange = (value) => {
    setForm(p => ({ ...p, address: value, lat: '', lng: '' }))
    setOpen(true)
  }

  const selectSuggestion = async (place) => {
    setResolving(true)
    setForm(p => ({ ...p, address: place.label, lat: '', lng: '' }))
    setSuggestions([])
    setOpen(false)
    setError('')

    try {
      const resolved = await geocodeAPI.resolve({ text: place.label, magicKey: place.magicKey })
      setForm(p => ({
        ...p,
        address: resolved.address,
        lat: String(resolved.lat),
        lng: String(resolved.lng),
      }))
    } catch {
      setError('No se pudo ubicar esa dirección')
      setOpen(true)
    } finally {
      setResolving(false)
    }
  }

  const clearLocation = () => {
    setForm(p => ({ ...p, address: '', lat: '', lng: '' }))
    setSuggestions([])
    setOpen(false)
    setError('')
  }

  return (
    <div className="field">
      <label className="label">Dirección</label>
      <div className="address-autocomplete">
        <div className="input-icon-wrapper">
          <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
          <input
            className="input mobile-input"
            placeholder="Buscar dirección, ciudad o planta..."
            value={form.address}
            onChange={e => handleAddressChange(e.target.value)}
            onFocus={() => setOpen(true)}
            autoComplete="off"
          />
        </div>

        {open && (suggestions.length > 0 || loading || error) && (
          <div className="address-suggestions">
            {loading && (
              <div className="address-suggestion muted">
                <span className="spin" style={{ width: 14, height: 14, border: '2px solid var(--border-light)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
                Buscando direcciones...
              </div>
            )}
            {!loading && error && <div className="address-suggestion muted">{error}</div>}
            {!loading && suggestions.map(place => (
              <button
                key={place.id}
                type="button"
                className="address-suggestion"
                onMouseDown={e => e.preventDefault()}
                onClick={() => selectSuggestion(place)}
                disabled={resolving}
              >
                <Icon path={ICONS.mapPin} size={14} stroke="var(--accent)" />
                <span>{place.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
        <p style={{ fontSize: 12, color: hasLocation ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon path={hasLocation ? ICONS.check : ICONS.mapPin} size={13} stroke={hasLocation ? 'var(--success)' : 'var(--text-muted)'} />
          {resolving ? 'Asignando ubicación...' : hasLocation ? 'Ubicación asignada al mapa' : 'Elegí una opción para ubicarla en el mapa'}
        </p>
        {(form.address || hasLocation) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearLocation}>Limpiar</button>
        )}
      </div>
    </div>
  )
}

function ClientLocationMap({ form, setForm }) {
  const mapRef = React.useRef(null)
  const mapInst = React.useRef(null)
  const markerRef = React.useRef(null)

  const lat = Number(form.lat)
  const lng = Number(form.lng)
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng)

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return

    const map = L.map(mapRef.current, {
      center: hasLocation ? [lat, lng] : DEFAULT_MAP_CENTER,
      zoom: hasLocation ? 16 : 11,
      zoomControl: true,
      scrollWheelZoom: false,
    })
    mapInst.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', e => {
      setForm(p => ({ ...p, lat: String(e.latlng.lat), lng: String(e.latlng.lng) }))
    })

    window.setTimeout(() => map.invalidateSize(), 80)

    return () => {
      map.remove()
      mapInst.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInst.current) return
    const map = mapInst.current

    if (!hasLocation) {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      return
    }

    const position = [lat, lng]
    if (!markerRef.current) {
      const icon = L.divIcon({
        className: '',
        html: '<div class="client-location-pin"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
      markerRef.current = L.marker(position, { icon, draggable: true }).addTo(map)
      markerRef.current.on('dragend', e => {
        const next = e.target.getLatLng()
        setForm(p => ({ ...p, lat: String(next.lat), lng: String(next.lng) }))
      })
    } else {
      markerRef.current.setLatLng(position)
    }

    map.flyTo(position, Math.max(map.getZoom(), 16), { duration: 0.45 })
  }, [form.lat, form.lng, hasLocation, lat, lng, setForm])

  const useMapCenter = () => {
    if (!mapInst.current) return
    const center = mapInst.current.getCenter()
    setForm(p => ({ ...p, lat: String(center.lat), lng: String(center.lng) }))
  }

  return (
    <div className="field">
      <label className="label">Ubicación en mapa</label>
      <div className="client-location-map" ref={mapRef} />
      <div className="map-picker-footer">
        <p>
          {hasLocation
            ? 'Arrastra el pin o haz click en el mapa para ajustar el punto exacto.'
            : 'Busca una dirección o haz click en el mapa para colocar el pin.'}
        </p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={useMapCenter}>
          Usar centro
        </button>
      </div>
    </div>
  )
}

export default function Clients({ setActive, setSelectedClient, autoOpenClientId, onAutoOpenHandled }) {
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [confirm,  setConfirm]  = useState(null)
  const [form,     setForm]     = useState({ name:'', sector:'', address:'', contact:'', phone:'', lat:'', lng:'' })
  const [saving,     setSaving]     = useState(false)
  const [viewClient, setViewClient] = useState(null)

  const isMobile = useIsMobile()

  const load = useCallback(() => {
    setLoading(true)
    clientsAPI.list(search).then(setClients).finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!autoOpenClientId || loading) return
    const found = clients.find(c => c.id === autoOpenClientId)
    if (found) {
      setViewClient(found)
      onAutoOpenHandled?.()
      return
    }
    clientsAPI.get(autoOpenClientId)
      .then(c => {
        const equipment = c.equipment || []
        setViewClient({
          ...c,
          equipment: equipment.length,
          active: equipment.filter(e => e.status === 'ACTIVE').length,
          overdue: equipment.filter(e => e.status === 'OVERDUE').length,
        })
      })
      .catch(() => {})
      .finally(() => onAutoOpenHandled?.())
  }, [autoOpenClientId, loading, clients]) // eslint-disable-line

  const openNew  = () => { setForm({ name:'', sector:'', address:'', contact:'', phone:'', lat:'', lng:'' }); setEditing(null); setShowForm(true) }
  const openEdit = (c) => { setForm({ name:c.name, sector:c.sector||'', address:c.address||'', contact:c.contact||'', phone:c.phone||'', lat:c.lat||'', lng:c.lng||'' }); setEditing(c.id); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) await clientsAPI.update(editing, form)
      else         await clientsAPI.create(form)
      setShowForm(false); load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await clientsAPI.delete(confirm.id); load() }
    catch (e) { alert(e.message) }
    finally { setConfirm(null) }
  }

  return (
    <div className="animate-up" style={{ padding: isMobile ? '16px 12px' : 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: '1 1 180px', minWidth: 0 }}>
          <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
          <input
            className="input"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ height: isMobile ? 44 : undefined }}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={openNew}
          style={{ height: isMobile ? 44 : undefined, flexShrink: 0 }}
        >
          <Icon path={ICONS.plus} size={14} stroke="white" strokeWidth={2.5} />
          {isMobile ? 'Nuevo' : 'Nuevo cliente'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />)}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={ICONS.clients}
          title="Sin clientes"
          desc="Agrega tu primer cliente para comenzar."
          action={
            <button className="btn btn-primary" onClick={openNew}>
              <Icon path={ICONS.plus} size={14} stroke="white" /> Agregar cliente
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
          {clients.map(c => (
            <div
              key={c.id}
              className="card"
              style={{ cursor: 'pointer', padding: isMobile ? '16px' : 24 }}
              onClick={() => setViewClient(c)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <Avatar name={c.name} size={isMobile ? 40 : 38} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: isMobile ? 15 : 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{c.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{c.sector || '—'}</p>
                  </div>
                </div>
                {c.overdue > 0 && <span className="badge badge-danger" style={{ flexShrink: 0 }}>{c.overdue} venc.</span>}
              </div>

              {(c.address || c.contact) && (
                <div style={{ marginBottom: 12 }}>
                  {c.address && (
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display:'flex', alignItems:'center', gap: 5 }}>
                      <Icon path={ICONS.mapPin} size={11} stroke="var(--text-muted)" />{c.address}
                    </p>
                  )}
                  {c.contact && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: c.address ? 3 : 0 }}>{c.contact}</p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, paddingTop: 10, borderTop: '1px solid var(--border)', marginBottom: 12 }}>
                {[
                  {l:'Equipos',v:c.equipment,col:'var(--text)'},
                  {l:'Lugares',v:c.locationCount || c.locations?.length || 0,col:'var(--accent)'},
                  {l:'Activos', v:c.active,   col:'var(--success)'},
                  {l:'Vencidos',v:c.overdue,  col:'var(--danger)'},
                ].filter(s => s.v > 0 || !['Vencidos', 'Lugares'].includes(s.l)).map(s => (
                  <div key={s.l}>
                    <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{s.l}</p>
                    <p style={{ fontSize: isMobile ? 22 : 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.v}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1, justifyContent: 'center', height: isMobile ? 38 : undefined }}
                  onClick={() => openEdit(c)}
                >
                  <Icon path={ICONS.edit} size={13} /> Editar
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1, justifyContent: 'center', height: isMobile ? 38 : undefined }}
                  onClick={() => setViewClient(c)}
                >
                  <Icon path={ICONS.equipment} size={13} /> Ver
                </button>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.2)', height: isMobile ? 38 : undefined, width: isMobile ? 38 : undefined }}
                  onClick={() => setConfirm(c)}
                >
                  <Icon path={ICONS.trash} size={13} stroke="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client detail modal */}
      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title="Detalle del cliente" maxWidth={560}>
        {viewClient && (
          <ClientDetail
            client={viewClient}
            onClose={() => setViewClient(null)}
            onViewEquipment={() => {
              setSelectedClient(viewClient)
              setViewClient(null)
              setActive('equipment')
            }}
          />
        )}
      </Modal>

      {/* Create / Edit form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar cliente' : 'Nuevo cliente'} maxWidth={620}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="label">Nombre *</label>
            <input className="input mobile-input" placeholder="Ej. Industrias Vega" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
          </div>
          <div className="field">
            <label className="label">Sector</label>
            <Select value={form.sector} onValueChange={v => setForm(p=>({...p,sector:v}))} placeholder="Seleccionar...">
              {SECTORS.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}
            </Select>
          </div>
          <AddressAutocomplete form={form} setForm={setForm} />
          <ClientLocationMap form={form} setForm={setForm} />
          <div className="field">
            <label className="label">Email de contacto</label>
            <input className="input mobile-input" type="email" placeholder="contacto@empresa.com" value={form.contact} onChange={e => setForm(p=>({...p,contact:e.target.value}))} />
          </div>
          <div className="field">
            <label className="label">Teléfono</label>
            <input className="input mobile-input" type="tel" placeholder="+56 9 XXXX XXXX" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button
              className="btn btn-primary mobile-btn-full"
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
            >
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar cliente"
        message={`¿Eliminar a "${confirm?.name}"? Sus equipos y reportes también serán eliminados.`}
      />
    </div>
  )
}
