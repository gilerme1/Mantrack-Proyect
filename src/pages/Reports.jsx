// src/pages/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { Icon, ICONS, StatusBadge, Avatar, SearchInput, Modal, EmptyState, ConfirmDialog } from '../components/UI.jsx'
import { Select, SelectItem, DatePicker } from '../components/Primitives.jsx'
import ReportWizard from '../components/ReportWizard.jsx'
import ReportDetail from '../components/ReportDetail.jsx'
import { reportsAPI } from '../lib/api.js'
import { REPORT_TYPE_LABEL } from '../lib/reportMeta.js'
import useIsMobile from '../hooks/useIsMobile.js'

const TYPES    = ['MAINTENANCE','INSTALLATION','PREVENTIVO','CORRECTIVO','INSPECCION']
const STATUSES = ['COMPLETED','PENDING','IN_PROGRESS']

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function Reports({ autoOpenReportId, initialDateRange, onDateRangeChange, onAutoOpenHandled }) {
  const [data,         setData]         = useState({ total: 0, reports: [] })
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [dateFrom,     setDateFrom]     = useState(initialDateRange?.dateFrom || '')
  const [dateTo,       setDateTo]       = useState(initialDateRange?.dateTo || '')
  const [showWizard,   setShowWizard]   = useState(false)
  const [editingReport,setEditingReport]= useState(null)
  const [viewId,       setViewId]       = useState(null)
  const [confirm,      setConfirm]      = useState(null)

  const isMobile = useIsMobile()

  const load = useCallback(() => {
    setLoading(true)
    reportsAPI.list({
      status: statusFilter !== 'all' ? statusFilter : '',
      type:   typeFilter   !== 'all' ? typeFilter   : '',
      dateFrom,
      dateTo,
      search,
    }).then(setData).finally(() => setLoading(false))
  }, [search, statusFilter, typeFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!autoOpenReportId) return
    setViewId(autoOpenReportId)
    onAutoOpenHandled?.()
  }, [autoOpenReportId]) // eslint-disable-line

  useEffect(() => {
    setDateFrom(initialDateRange?.dateFrom || '')
    setDateTo(initialDateRange?.dateTo || '')
  }, [initialDateRange?.dateFrom, initialDateRange?.dateTo]) // eslint-disable-line

  const handleDelete = async () => {
    try { await reportsAPI.delete(confirm.id); load() }
    catch (e) { alert(e.message) }
    finally { setConfirm(null) }
  }

  const openEdit = async (reportOrId) => {
    try {
      const full = typeof reportOrId === 'string' ? await reportsAPI.get(reportOrId) : await reportsAPI.get(reportOrId.id)
      setEditingReport(full)
      setViewId(null)
      setShowWizard(true)
    } catch (e) {
      alert(e.message)
    }
  }

  const { reports } = data
  const dateFilterActive = !!(dateFrom || dateTo)
  const updateDateFrom = (value) => {
    setDateFrom(value)
    onDateRangeChange?.(value || dateTo ? { dateFrom: value, dateTo } : null)
  }
  const updateDateTo = (value) => {
    setDateTo(value)
    onDateRangeChange?.(dateFrom || value ? { dateFrom, dateTo: value } : null)
  }
  const clearDates = () => { setDateFrom(''); setDateTo(''); onDateRangeChange?.(null) }
  const completed    = reports.filter(r => r.status === 'COMPLETED').length
  const pending      = reports.filter(r => r.status === 'PENDING').length
  const withChecklist= reports.filter(r => r.checklistJson).length

  return (
    <div className="animate-up" style={{ padding: isMobile ? '16px 12px' : 24 }}>

      {/* KPI mini bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',         value: data.total,    color: 'var(--text)'    },
          { label: 'Completados',   value: completed,     color: 'var(--success)' },
          { label: 'Pendientes',    value: pending,       color: 'var(--warning)' },
          { label: 'Con checklist', value: withChecklist, color: 'var(--accent)'  },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: isMobile ? '8px 14px' : '10px 16px',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flex: isMobile ? '1 1 0' : undefined,
          }}>
            <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--text-muted)', lineHeight: 1.2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', minWidth: 0, alignItems: 'stretch' }}>
          <div className="input-icon-wrapper" style={{ flex: '1 1 140px', minWidth: 0 }}>
            <Icon path={ICONS.search} size={14} stroke="var(--text-muted)" className="icon" />
            <input
              className="input"
              placeholder="Buscar reporte..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: isMobile ? 44 : undefined }}
            />
          </div>
          <div style={{ flex: '1 1 120px', minWidth: 110 }}>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectItem value="all">Tipo</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t}>{REPORT_TYPE_LABEL[t] || t}</SelectItem>)}
            </Select>
          </div>
          <div style={{ flex: '1 1 110px', minWidth: 100 }}>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectItem value="all">Estado</SelectItem>
              <SelectItem value="COMPLETED">Completados</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
            </Select>
          </div>
          <div style={{ flex: '0 1 150px', minWidth: 135 }}>
            <DatePicker value={dateFrom} onChange={updateDateFrom} placeholder="Desde..." />
          </div>
          <div style={{ flex: '0 1 150px', minWidth: 135 }}>
            <DatePicker value={dateTo} onChange={updateDateTo} placeholder="Hasta..." />
          </div>
          {dateFilterActive && (
            <button className="btn btn-ghost" onClick={clearDates} style={{ height: isMobile ? 44 : undefined, flexShrink: 0 }}>
              Limpiar fecha
            </button>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowWizard(true)}
          style={{ height: isMobile ? 44 : undefined, flexShrink: 0 }}
        >
          <Icon path={ICONS.plus} size={14} stroke="white" strokeWidth={2.5} />
          {isMobile ? 'Nuevo' : 'Nuevo reporte'}
        </button>
      </div>

      {dateFilterActive && (
        <div style={{ marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-soft)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 10, padding: '8px 12px', color: 'var(--accent)', fontSize: 12.5, fontWeight: 650 }}>
          <Icon path={ICONS.clock} size={13} stroke="var(--accent)" />
          {dateFrom || 'Inicio'} → {dateTo || 'Hoy'}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: isMobile ? 100 : 64, borderRadius: 12 }} />)}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={ICONS.reports}
          title="Sin reportes"
          desc="No hay reportes que coincidan con los filtros."
          action={
            <button className="btn btn-primary" onClick={() => setShowWizard(true)}>
              <Icon path={ICONS.plus} size={14} stroke="white" /> Crear reporte
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reports.map(r => isMobile ? (
            /* ── Mobile report card ── */
            <div
              key={r.id}
              onClick={() => setViewId(r.id)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon path={ICONS.reports} size={16} stroke="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{r.equipment?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{r.equipment?.client?.name}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              {/* Bottom row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={r.tech?.name || '?'} size={22} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.tech?.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-muted">{REPORT_TYPE_LABEL[r.type] || r.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatDate(r.createdAt)}</span>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ padding: 5 }}
                    onClick={e => { e.stopPropagation(); openEdit(r) }}
                  >
                    <Icon path={ICONS.edit} size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    style={{ padding: 5, color: 'var(--danger)', borderColor: 'rgba(239,68,68,.12)' }}
                    onClick={e => { e.stopPropagation(); setConfirm(r) }}
                  >
                    <Icon path={ICONS.trash} size={13} stroke="var(--danger)" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── Desktop report row ── */
            <div key={r.id} onClick={() => setViewId(r.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon path={ICONS.reports} size={17} stroke="var(--accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.equipment?.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {r.equipment?.client?.name}
                  {r.template?.name && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>· {r.template.name}</span>}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Avatar name={r.tech?.name || '?'} size={24} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.tech?.name}</span>
              </div>
              <span className="badge badge-muted" style={{ flexShrink: 0 }}>{REPORT_TYPE_LABEL[r.type] || r.type}</span>
              {r.checklistJson && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Icon path={ICONS.clipboard} size={12} stroke="var(--accent)" />
                  <span style={{ fontSize: 11, color: 'var(--accent)' }}>Checklist</span>
                </div>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{formatDate(r.createdAt)}</span>
              <StatusBadge status={r.status} />
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                  <Icon path={ICONS.edit} size={12} />
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.15)' }} onClick={() => setConfirm(r)}>
                  <Icon path={ICONS.trash} size={12} stroke="var(--danger)" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wizard modal */}
      <Modal open={showWizard} onClose={() => { setShowWizard(false); setEditingReport(null) }} title={editingReport ? 'Editar reporte' : 'Nuevo reporte'} maxWidth={580}>
        <ReportWizard
          editingReport={editingReport}
          onClose={() => { setShowWizard(false); setEditingReport(null) }}
          onSaved={() => { setShowWizard(false); setEditingReport(null); load() }}
        />
      </Modal>

      {/* Detail modal */}
      <Modal open={!!viewId} onClose={() => setViewId(null)} title="Detalle del reporte" maxWidth={620}>
        {viewId && <ReportDetail reportId={viewId} onClose={() => setViewId(null)} onEdit={openEdit} />}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar reporte"
        message={`¿Eliminar el reporte de "${confirm?.equipment?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  )
}
