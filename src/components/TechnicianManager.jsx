import React, { useEffect, useMemo, useState } from 'react'
import { auth, equipmentAPI } from '../lib/api.js'
import { Icon, ICONS, Avatar, ConfirmDialog } from './UI.jsx'
import { Select, SelectItem } from './Primitives.jsx'

const ROLE_LABEL = {
  ADMIN: 'Administrador',
  MANAGER: 'Supervisor',
  TECH: 'Técnico',
}

function blankUser() {
  return { name: '', email: '', password: '', role: 'TECH', equipmentIds: [] }
}

export default function TechnicianManager() {
  const [users, setUsers] = useState([])
  const [equipment, setEquipment] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankUser())
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const load = () => {
    setError(null)
    return Promise.all([auth.users(), equipmentAPI.list()])
      .then(([u, e]) => {
        setUsers(u)
        setEquipment(Array.isArray(e) ? e : [])
      })
      .catch(err => setError(err.message))
  }

  useEffect(() => { load() }, [])

  const techs = users.filter(u => ['ADMIN', 'MANAGER', 'TECH'].includes(u.role))
  const filteredEquipment = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return equipment
    return equipment.filter(eq =>
      [eq.name, eq.serial, eq.plate, eq.model, eq.client?.name, eq.place?.name].filter(Boolean).some(v => String(v).toLowerCase().includes(q))
    )
  }, [equipment, search])

  const startNew = () => {
    setEditing(null)
    setForm(blankUser())
    setError(null)
    setSaved(false)
  }

  const startEdit = (user) => {
    setEditing(user)
    setError(null)
    setSaved(false)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      equipmentIds: user.assignedEquipmentIds || [],
    })
  }

  const toggleEquipment = (id) => {
    setForm(p => ({
      ...p,
      equipmentIds: p.equipmentIds.includes(id)
        ? p.equipmentIds.filter(x => x !== id)
        : [...p.equipmentIds, id],
    }))
  }

  const save = async () => {
    setError(null)
    setSaved(false)
    if (!form.name.trim() || !form.email.trim()) return
    if (!editing && !form.password.trim()) {
      setError('La contraseña es requerida para crear el técnico.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        equipmentIds: form.equipmentIds,
        ...(form.password.trim() ? { password: form.password } : {}),
      }
      if (editing) await auth.updateUser(editing.id, payload)
      else await auth.createUser(payload)
      startNew()
      await load()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await auth.deleteUser(confirm.id)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirm(null)
      if (editing?.id === confirm?.id) startNew()
    }
  }

  return (
    <div className="technician-manager">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>Técnicos y derechos</p>
          <button className="btn btn-primary btn-sm" onClick={startNew}>
            <Icon path={ICONS.plus} size={12} stroke="white" /> Nuevo
          </button>
        </div>

        {techs.map(user => (
          <button
            key={user.id}
            type="button"
            onClick={() => startEdit(user)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              border: `1px solid ${editing?.id === user.id ? 'var(--accent)' : 'var(--border)'}`,
              background: editing?.id === user.id ? 'var(--accent-soft)' : 'var(--bg)',
              borderRadius: 12, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Avatar name={user.name} size={34} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            </div>
            <span className="badge badge-muted">{ROLE_LABEL[user.role] || user.role}</span>
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>{editing ? 'Editar técnico' : 'Nuevo técnico'}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Si no asignas equipos, podrá ver todos los equipos.</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{ background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.22)', borderRadius: 10, padding: '10px 12px', fontSize: 12.5, color: 'var(--success)' }}>
            Técnico guardado correctamente.
          </div>
        )}

        <div className="mobile-form-row">
          <div className="field">
            <label className="label">Nombre</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
        </div>

        <div className="mobile-form-row">
          <div className="field">
            <label className="label">Derechos</label>
            <Select value={form.role} onValueChange={role => setForm(p => ({ ...p, role }))}>
              <SelectItem value="TECH">Técnico</SelectItem>
              <SelectItem value="MANAGER">Supervisor</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
            </Select>
          </div>
          <div className="field">
            <label className="label">{editing ? 'Nueva contraseña' : 'Contraseña'}</label>
            <input className="input" type="password" value={form.password} placeholder={editing ? 'Dejar vacía para no cambiar' : ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          </div>
        </div>

        <div className="field">
          <label className="label">Equipos asignados</label>
          <input className="input" placeholder="Filtrar equipos..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ maxHeight: 230, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredEquipment.map(eq => (
              <label key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.equipmentIds.includes(eq.id)} onChange={() => toggleEquipment(eq.id)} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 650 }}>{eq.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{[eq.client?.name, eq.place?.name, eq.plate && `Matr. ${eq.plate}`, eq.serial && `#${eq.serial}`].filter(Boolean).join(' · ')}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {editing && (
            <button className="btn btn-danger" onClick={() => setConfirm(editing)}>
              <Icon path={ICONS.trash} size={13} /> Eliminar
            </button>
          )}
          <button className="btn btn-ghost" onClick={startNew}>Limpiar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.name.trim() || !form.email.trim()}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Eliminar usuario"
        message={`¿Eliminar a "${confirm?.name}"?`}
      />
    </div>
  )
}
