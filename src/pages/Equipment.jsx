import React, { useState, useEffect, useCallback } from 'react'
import { Icon, ICONS, StatusBadge, SearchInput, Modal, EmptyState, ConfirmDialog } from '../components/UI.jsx'
import { Select, SelectItem } from '../components/Primitives.jsx'
import { equipmentAPI, clientsAPI, openQRAPI } from '../lib/api.js'
import { EquipmentQRCanvas, equipmentQRUrl, legacyEquipmentQRUrl } from '../components/EquipmentQR.jsx'
import ReportWizard from '../components/ReportWizard.jsx'
import ReportDetail from '../components/ReportDetail.jsx'
import { REPORT_TYPE_LABEL } from '../lib/reportMeta.js'
import useIsMobile from '../hooks/useIsMobile.js'

export default function Equipment({ selectedClient, setActive, setSelectedEquip, onClearSelectedClient, initialStatusFilter = 'all', autoOpenEquipId, onDeepLinkHandled }) {
  const [equipment, setEquipment] = useState([])
  const [clients,   setClients]   = useState([])
  const [clientLocations, setClientLocations] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState(initialStatusFilter)
  const [clientId,  setClientId]  = useState(selectedClient?.id || 'all')
  const [showForm,  setShowForm]  = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [viewItem,  setViewItem]  = useState(null)
  const [reportEquip, setReportEquip] = useState(null)
  const [viewReportId, setViewReportId] = useState(null)
  const [qrItem,    setQrItem]    = useState(null)
  const [confirm,   setConfirm]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [qrSaving,  setQrSaving]  = useState(false)
  const [form,      setForm]      = useState({ name:'', clientId:'', locationId:'', model:'', serial:'', plate:'', location:'', status:'ACTIVE', generateQR:false, openQR:null })

  const isMobile = useIsMobile()

  const load = useCallback(() => {
    setLoading(true)
    equipmentAPI.list({ status: status !== 'all' ? status : '', clientId: clientId !== 'all' ? clientId : '', search })
      .then(setEquipment).finally(() => setLoading(false))
  }, [search, status, clientId])

  useEffect(() => { load() }, [load])
  useEffect(() => { clientsAPI.list().then(setClients) }, [])
  useEffect(() => {
    setClientId(selectedClient?.id || 'all')
  }, [selectedClient?.id])
  useEffect(() => {
    if (!form.clientId) {
      setClientLocations([])
      return
    }
    let cancelled = false
    clientsAPI.get(form.clientId)
      .then(client => { if (!cancelled) setClientLocations(client.locations || []) })
      .catch(() => { if (!cancelled) setClientLocations([]) })
    return () => { cancelled = true }
  }, [form.clientId])

  // Auto-open detail when arriving via QR deep link
  useEffect(() => {
    if (!autoOpenEquipId) return
    equipmentAPI.get(autoOpenEquipId)
      .then(eq => setViewItem(eq))
      .catch(() => {})
      .finally(() => onDeepLinkHandled?.())
  }, [autoOpenEquipId]) // eslint-disable-line

  const openNew  = () => { setForm({ name:'', clientId:selectedClient?.id || '', locationId:'', model:'', serial:'', plate:'', location:'', status:'ACTIVE', generateQR:false, openQR:null }); setEditing(null); setShowForm(true) }
  const openEdit = (e) => { setForm({ name:e.name, clientId:e.clientId, locationId:e.locationId || e.place?.id || '', model:e.model||'', serial:e.serial||'', plate:e.plate||'', location:e.location||'', status:e.status, generateQR:false, openQR:e.openQR || null }); setEditing(e.id); setShowForm(true) }
  const openDetail = async (eq) => {
    setViewItem(eq)
    if (!eq?.id || eq.reports) return
    const full = await equipmentAPI.get(eq.id).catch(() => null)
    if (full) setViewItem(full)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.clientId) return
    setSaving(true)
    try {
      if (editing) await equipmentAPI.update(editing, form)
      else {
        const created = await equipmentAPI.create(form)
        if (form.generateQR) await openQRAPI.generateForEquipment(created.id)
      }
      setShowForm(false); load()
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await equipmentAPI.delete(confirm.id); load() }
    catch (e) { alert(e.message) }
    finally { setConfirm(null) }
  }

  const refreshEquipment = async (id) => {
    const eq = await equipmentAPI.get(id)
    setViewItem(v => v?.id === id ? eq : v)
    setQrItem(q => q?.id === id ? eq : q)
    return eq
  }

  const ensureQR = async (eq) => {
    if (eq.openQR?.id) return eq
    setQrSaving(true)
    try {
      await openQRAPI.generateForEquipment(eq.id)
      const updated = await refreshEquipment(eq.id)
      load()
      return updated
    } catch (e) {
      alert(e.message)
      return eq
    } finally {
      setQrSaving(false)
    }
  }

  const getEquipmentQRText = (eq) => (
    eq?.openQR?.id ? equipmentQRUrl(eq.openQR.id) : legacyEquipmentQRUrl(eq?.id)
  )

  const getEquipmentQRLabel = (eq) => (
    eq?.openQR?.id ? 'QR asignado' : 'QR del equipo'
  )

  const formatReportDate = (value) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  const openQRModal = async (eq) => {
    const full = eq.openQR ? eq : await equipmentAPI.get(eq.id).catch(() => eq)
    setQrItem(full)
  }

  /* ── Mobile card for one equipment item ── */
  const EquipCard = ({ eq }) => (
    <div
      className="equip-mobile-card"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon path={ICONS.wrench} size={18} stroke="var(--accent)" strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{eq.name}</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[eq.client?.name, eq.place?.name].filter(Boolean).join(' · ')}</p>
        </div>
        <StatusBadge status={eq.status} />
      </div>

      {/* Details row */}
      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        {eq.model && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Modelo</p>
            <p style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.model}</p>
          </div>
        )}
        {eq.serial && (
          <div style={{ flex: 1, minWidth: 0, paddingLeft: eq.model ? 12 : 0 }}>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>N° Serie</p>
            <p style={{ fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{eq.serial}</p>
          </div>
        )}
        {eq.plate && (
          <div style={{ flex: 1, minWidth: 0, paddingLeft: (eq.model || eq.serial) ? 12 : 0 }}>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Matrícula</p>
            <p style={{ fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.plate}</p>
          </div>
        )}
        {eq.lastMaint && (
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 12 }}>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Último mant.</p>
            <p style={{ fontSize: 12.5, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              {new Date(eq.lastMaint).toLocaleDateString('es-CL',{day:'2-digit',month:'short'})}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, justifyContent: 'center', height: 38 }}
          onClick={() => openDetail(eq)}
        >
          <Icon path={ICONS.eye} size={13} /> Ver
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, justifyContent: 'center', height: 38 }}
          onClick={() => openEdit(eq)}
        >
          <Icon path={ICONS.edit} size={13} /> Editar
        </button>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center', height: 38 }}
          onClick={() => openQRModal(eq)}
        >
          <Icon path={ICONS.qr} size={13} stroke="white" /> QR
        </button>
        <button
          className="btn btn-ghost btn-sm btn-icon"
          style={{ height: 38, width: 38, color: 'var(--danger)', borderColor: 'rgba(239,68,68,.15)', flexShrink: 0 }}
          onClick={() => setConfirm(eq)}
        >
          <Icon path={ICONS.trash} size={14} stroke="var(--danger)" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="animate-up" style={{ padding: isMobile ? '16px 12px' : 24 }}>
      {selectedClient && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid rgba(91,106,240,.2)', borderRadius: 10 }}>
          <Icon path={ICONS.filter} size={14} stroke="var(--accent)" />
          <p style={{ fontSize: 13, color: 'var(--accent)', flex: 1 }}>Filtrando: <strong>{selectedClient.name}</strong></p>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => { setClientId('all'); onClearSelectedClient?.() }}>Quitar</button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', minWidth: 0, alignItems: 'stretch' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 150px', minWidth: 0 }}>
            <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
            <input
              className="input"
              placeholder="Buscar equipo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: isMobile ? 44 : undefined }}
            />
          </div>
          <div style={{ flex: '1 1 130px', minWidth: 120, maxWidth: isMobile ? '100%' : 160 }}>
            <Select value={status} onValueChange={setStatus}>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="OVERDUE">Vencidos</SelectItem>
              <SelectItem value="SCHEDULED">Programados</SelectItem>
              <SelectItem value="INACTIVE">Inactivos</SelectItem>
            </Select>
          </div>
          {!isMobile && (
            <div style={{ width: 190 }}>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </Select>
            </div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={openNew}
          style={{ height: isMobile ? 44 : undefined, flexShrink: 0 }}
        >
          <Icon path={ICONS.plus} size={14} stroke="white" strokeWidth={2.5} />
          {isMobile ? 'Nuevo' : 'Nuevo equipo'}
        </button>
      </div>

      {isMobile && (
        <div style={{ marginBottom: 14 }}>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectItem value="all">Todos los clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </Select>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: isMobile ? 140 : 60, borderRadius: isMobile ? 16 : 8 }} />)}
        </div>
      ) : equipment.length === 0 ? (
        <EmptyState icon={ICONS.equipment} title="Sin equipos" desc="No hay equipos que coincidan con los filtros."
          action={<button className="btn btn-primary" onClick={openNew}><Icon path={ICONS.plus} size={14} stroke="white" /> Agregar equipo</button>}
        />
      ) : isMobile ? (
        /* ── Mobile: card list ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {equipment.map(eq => <EquipCard key={eq.id} eq={eq} />)}
        </div>
      ) : (
        /* ── Desktop: table ── */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>{['Equipo','Cliente / lugar','Modelo','Último mant.','Próximo','Estado',''].map(h=><th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {equipment.map(eq => (
                  <tr key={eq.id} onClick={() => openDetail(eq)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: 'var(--accent-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon path={ICONS.wrench} size={14} stroke="var(--accent)" />
                        </div>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 500 }}>{eq.name}</p>
                          {(eq.serial || eq.plate) && <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{[eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`].filter(Boolean).join(' · ')}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <p>{eq.client?.name}</p>
                      {eq.place?.name && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{eq.place.name}</p>}
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{eq.model || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{eq.lastMaint ? new Date(eq.lastMaint).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'2-digit'}) : '—'}</td>
                    <td style={{ fontSize: 12, color: eq.status === 'OVERDUE' ? 'var(--danger)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{eq.nextMaint ? new Date(eq.nextMaint).toLocaleDateString('es-CL',{day:'2-digit',month:'short'}) : (eq.status === 'OVERDUE' ? 'Vencido' : '—')}</td>
                    <td><StatusBadge status={eq.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(eq)}><Icon path={ICONS.edit} size={12} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openQRModal(eq)}><Icon path={ICONS.qr} size={12} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirm(eq)}><Icon path={ICONS.trash} size={12} stroke="var(--danger)" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Detalle del equipo" maxWidth={480}>
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: 'var(--accent-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon path={ICONS.wrench} size={20} stroke="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{viewItem.name}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{[viewItem.client?.name, viewItem.place?.name].filter(Boolean).join(' · ')}</p>
              </div>
              <StatusBadge status={viewItem.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                {l:'Modelo',      v:viewItem.model||'—'},
                {l:'N° Serie',    v:viewItem.serial||'—'},
                {l:'Matrícula',   v:viewItem.plate||'—'},
                {l:'Lugar',       v:viewItem.place?.name||'—'},
                {l:'Ubicación interna', v:viewItem.location||'—'},
                {l:'Último mant.',v:viewItem.lastMaint?new Date(viewItem.lastMaint).toLocaleDateString('es-CL'):'—'},
              ].map(f=>(
                <div key={f.l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>{f.l}</p>
                  <p style={{ fontSize: 13.5, fontWeight: 500 }}>{f.v}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 6, background: '#fff', borderRadius: 8, lineHeight: 0 }}>
                <EquipmentQRCanvas text={getEquipmentQRText(viewItem)} size={78} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700 }}>{getEquipmentQRLabel(viewItem)}</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEquipmentQRText(viewItem)}</p>
                {!viewItem.openQR?.id && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Compatible con Códigos QR → Por equipo.</p>}
              </div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>Historial de reportes</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{viewItem.reports?.length ? `Últimos ${viewItem.reports.length} registros` : 'Sin reportes todavía'}</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setReportEquip(viewItem)}>
                  <Icon path={ICONS.plus} size={13} stroke="white" /> Nuevo reporte
                </button>
              </div>
              {!viewItem.reports ? (
                <div className="skeleton" style={{ height: 52, borderRadius: 10 }} />
              ) : viewItem.reports.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: '14px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                  Los reportes asociados a este equipo van a aparecer acá.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 260, overflowY: 'auto' }}>
                  {viewItem.reports.map(report => (
                    <button
                      key={report.id}
                      className="btn btn-ghost"
                      onClick={() => setViewReportId(report.id)}
                      style={{ height: 'auto', justifyContent: 'flex-start', padding: '9px 10px', borderRadius: 9 }}
                    >
                      <Icon path={ICONS.reports} size={13} />
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700 }}>{REPORT_TYPE_LABEL[report.type] || report.type}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{[report.tech?.name, formatReportDate(report.createdAt)].filter(Boolean).join(' · ')}</p>
                      </div>
                      <StatusBadge status={report.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => openQRModal(viewItem)}>
                <Icon path={ICONS.qr} size={14} /> Ver QR
              </button>
              <button className="btn btn-primary" onClick={() => { openEdit(viewItem); setViewItem(null) }}>
                <Icon path={ICONS.edit} size={14} stroke="white" /> Editar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!reportEquip} onClose={() => setReportEquip(null)} title="Nuevo reporte" maxWidth={580}>
        {reportEquip && (
          <ReportWizard
            prefillEquipId={reportEquip.id}
            onClose={() => setReportEquip(null)}
            onSaved={() => { const id = reportEquip.id; setReportEquip(null); refreshEquipment(id); load() }}
          />
        )}
      </Modal>

      <Modal open={!!viewReportId} onClose={() => setViewReportId(null)} title="Detalle del reporte" maxWidth={620}>
        {viewReportId && <ReportDetail reportId={viewReportId} onClose={() => setViewReportId(null)} />}
      </Modal>

      {/* Create / Edit form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar equipo' : 'Nuevo equipo'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="label">Nombre del equipo *</label>
            <input className="input mobile-input" placeholder="Ej. Compresor Atlas C-12" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
          </div>
          {selectedClient && !editing ? (
            <div className="field">
              <label className="label">Cliente</label>
              <div style={{ border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 13, fontWeight: 650, color: 'var(--text-secondary)' }}>
                {selectedClient.name}
              </div>
            </div>
          ) : (
            <div className="field">
              <label className="label">Cliente *</label>
              <Select value={form.clientId} onValueChange={v => setForm(p=>({...p,clientId:v,locationId:''}))} placeholder="Seleccionar cliente...">
                {clients.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </Select>
            </div>
          )}
          <div className="field">
            <label className="label">Lugar del cliente</label>
            <Select value={form.locationId || 'none'} onValueChange={v => setForm(p=>({...p,locationId:v === 'none' ? '' : v}))} placeholder="Seleccionar lugar...">
              <SelectItem value="none">Sin lugar asignado</SelectItem>
              {clientLocations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}{loc.type ? ` · ${loc.type}` : ''}</SelectItem>
              ))}
            </Select>
            {form.clientId && clientLocations.length === 0 && (
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>Este cliente todavía no tiene lugares creados.</p>
            )}
          </div>
          <div className="mobile-form-row">
            <div className="field"><label className="label">Modelo</label><input className="input mobile-input" placeholder="Marca y modelo" value={form.model} onChange={e => setForm(p=>({...p,model:e.target.value}))} /></div>
            <div className="field"><label className="label">N° de serie</label><input className="input mobile-input" placeholder="Serial..." value={form.serial} onChange={e => setForm(p=>({...p,serial:e.target.value}))} /></div>
          </div>
          <div className="field">
            <label className="label">Matrícula</label>
            <input className="input mobile-input" placeholder="Ej. ABC 1234, STP 456..." value={form.plate} onChange={e => setForm(p=>({...p,plate:e.target.value.toUpperCase()}))} />
          </div>
          <div className="field">
            <label className="label">Ubicación interna</label>
            <input className="input mobile-input" placeholder="Ej. Sala de máquinas, piso 2, sector bombas" value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} />
          </div>
          <div className="field">
            <label className="label">Estado</label>
            <Select value={form.status} onValueChange={v => setForm(p=>({...p,status:v}))}>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="SCHEDULED">Programado</SelectItem>
              <SelectItem value="OVERDUE">Vencido</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
            </Select>
          </div>
          {editing && (
            <div className="field">
              <label className="label">QR del equipo</label>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                {form.openQR?.id ? (
                  <>
                    <div style={{ padding: 5, background: '#fff', borderRadius: 8, lineHeight: 0 }}>
                      <EquipmentQRCanvas qrId={form.openQR.id} size={70} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700 }}>QR asignado</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{equipmentQRUrl(form.openQR.id)}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setQrItem(form)} type="button">Ver</button>
                  </>
                ) : (
                  <>
                    <div style={{ padding: 5, background: '#fff', borderRadius: 8, lineHeight: 0 }}>
                      <EquipmentQRCanvas text={legacyEquipmentQRUrl(editing)} size={70} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 700 }}>QR del equipo</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Usa el mismo QR de “Por equipo”.</p>
                    </div>
                    <button className="btn btn-primary btn-sm" type="button" disabled={qrSaving} onClick={async () => {
                      const updated = await ensureQR({ id: editing })
                      setForm(p => ({ ...p, openQR: updated.openQR }))
                    }}>
                      {qrSaving ? 'Generando...' : 'Generar QR'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {!editing && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.generateQR} onChange={e => setForm(p => ({ ...p, generateQR: e.target.checked }))} />
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 700 }}>Generar QR para este equipo</p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Opcional: podés usar sólo número de serie, matrícula, QR o todo junto.</p>
              </div>
            </label>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            <button className="btn btn-primary mobile-btn-full" onClick={handleSave} disabled={!form.name.trim()||!form.clientId||saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear equipo'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!qrItem} onClose={() => setQrItem(null)} title="QR del equipo" maxWidth={420}>
        {qrItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: 15, fontWeight: 800 }}>{qrItem.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{[qrItem.client?.name, qrItem.place?.name].filter(Boolean).join(' · ')}</p>
            </div>
            {qrItem.openQR?.id ? (
              <>
                <div style={{ padding: 14, background: '#fff', borderRadius: 16, lineHeight: 0 }}>
                  <EquipmentQRCanvas qrId={qrItem.openQR.id} size={180} />
                </div>
                <p style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{equipmentQRUrl(qrItem.openQR.id)}</p>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>
                    <Icon path={ICONS.download} size={14} stroke="white" /> Imprimir
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigator.clipboard?.writeText(equipmentQRUrl(qrItem.openQR.id)).then(() => alert('URL copiada'))}>
                    <Icon path={ICONS.clipboard} size={14} /> Copiar URL
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ padding: 14, background: '#fff', borderRadius: 16, lineHeight: 0 }}>
                  <EquipmentQRCanvas text={legacyEquipmentQRUrl(qrItem.id)} size={180} />
                </div>
                <p style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{legacyEquipmentQRUrl(qrItem.id)}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>Este es el QR por ID de equipo, el mismo que ves en Códigos QR. Si necesitás una etiqueta abierta reasignable, podés generar un QR asignado.</p>
                <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 130 }} onClick={() => window.print()}>
                    <Icon path={ICONS.download} size={14} stroke="white" /> Imprimir
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', minWidth: 130 }} onClick={() => navigator.clipboard?.writeText(legacyEquipmentQRUrl(qrItem.id)).then(() => alert('URL copiada'))}>
                    <Icon path={ICONS.clipboard} size={14} /> Copiar URL
                  </button>
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} disabled={qrSaving} onClick={async () => setQrItem(await ensureQR(qrItem))}>
                    <Icon path={ICONS.qr} size={14} /> {qrSaving ? 'Generando...' : 'Generar QR asignado'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar equipo"
        message={`¿Eliminar "${confirm?.name}"? Sus reportes también serán eliminados.`}
      />
    </div>
  )
}
