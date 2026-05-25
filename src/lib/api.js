// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')
const OFFLINE_QUEUE_KEY = 'mt_offline_queue'

let _token = localStorage.getItem('mt_token') || null

export const setToken  = (t) => { _token = t; t ? localStorage.setItem('mt_token', t) : localStorage.removeItem('mt_token') }
export const getToken  = ()  => _token
export const isLoggedIn= ()  => !!_token

function getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]') }
  catch { return [] }
}

function setOfflineQueue(items) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('mt:offline-queue', { detail: { count: items.length } }))
}

function queueOfflineWrite(method, path, body) {
  if (!['POST', 'PUT'].includes(method)) return null
  if (!['/reports', '/equipment', '/clients'].some(prefix => path.startsWith(prefix))) return null
  const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, method, path, body, createdAt: new Date().toISOString() }
  setOfflineQueue([...getOfflineQueue(), item])
  return { offlineQueued: true, id: item.id, message: 'Guardado sin conexión. Se sincronizará al volver internet.' }
}

export async function syncOfflineQueue() {
  if (!_token || !navigator.onLine) return { synced: 0, remaining: getOfflineQueue().length }
  const queue = getOfflineQueue()
  const remaining = []
  let synced = 0

  for (const item of queue) {
    try {
      const res = await fetch(`${BASE}${item.path}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${_token}` },
        body: item.body ? JSON.stringify(item.body) : undefined,
      })
      if (res.ok) synced += 1
      else remaining.push(item)
    } catch {
      remaining.push(item)
    }
  }

  setOfflineQueue(remaining)
  return { synced, remaining: remaining.length }
}

export const offlineQueue = {
  count: () => getOfflineQueue().length,
  sync: syncOfflineQueue,
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  if (!navigator.onLine) {
    const queued = queueOfflineWrite(method, path, body)
    if (queued) return queued
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch (err) {
    const queued = queueOfflineWrite(method, path, body)
    if (queued) return queued
    throw err
  }
  if (res.status === 401) { setToken(null); window.location.reload(); return }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error de servidor')
  return data
}

async function publicReq(path) {
  const res = await fetch(`${BASE}${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error de servidor')
  return data
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { syncOfflineQueue().catch(() => {}) })
  if (navigator.onLine) window.setTimeout(() => { syncOfflineQueue().catch(() => {}) }, 1200)
}

export const auth = {
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  me:    ()                => req('GET',  '/auth/me'),
  users: ()                => req('GET',  '/auth/users'),
  createUser: (data)       => req('POST', '/auth/users', data),
  updateUser: (id, data)   => req('PUT',  `/auth/users/${id}`, data),
  deleteUser: (id)         => req('DELETE', `/auth/users/${id}`),
}

export const clientsAPI = {
  list:   (search)   => req('GET',    `/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  get:    (id)       => req('GET',    `/clients/${id}`),
  create: (data)     => req('POST',   '/clients', data),
  update: (id, data) => req('PUT',    `/clients/${id}`, data),
  delete: (id)       => req('DELETE', `/clients/${id}`),
  createLocation: (clientId, data)       => req('POST',   `/clients/${clientId}/locations`, data),
  updateLocation: (clientId, locId, data) => req('PUT',    `/clients/${clientId}/locations/${locId}`, data),
  deleteLocation: (clientId, locId)       => req('DELETE', `/clients/${clientId}/locations/${locId}`),
}

export const geocodeAPI = {
  suggest: (query) => req('GET', `/geocode/suggest?q=${encodeURIComponent(query)}`),
  resolve: (place) => req('POST', '/geocode/resolve', place),
}

export const searchAPI = {
  global: (query) => req('GET', `/search?q=${encodeURIComponent(query)}`),
}

export const equipmentAPI = {
  list:   (p = {})   => { const q = new URLSearchParams(Object.entries(p).filter(([,v])=>v)).toString(); return req('GET', `/equipment${q?`?${q}`:''}`) },
  get:    (id)       => req('GET',    `/equipment/${id}`),
  create: (data)     => req('POST',   '/equipment', data),
  update: (id, data) => req('PUT',    `/equipment/${id}`, data),
  delete: (id)       => req('DELETE', `/equipment/${id}`),
}

export const reportsAPI = {
  list:   (p = {})   => { const q = new URLSearchParams(Object.entries(p).filter(([,v])=>v)).toString(); return req('GET', `/reports${q?`?${q}`:''}`) },
  get:    (id)       => req('GET',    `/reports/${id}`),
  create: (data)     => req('POST',   '/reports', data),
  update: (id, data) => req('PUT',    `/reports/${id}`, data),
  delete: (id)       => req('DELETE', `/reports/${id}`),
}

export const templatesAPI = {
  list:   (p = {})   => { const q = new URLSearchParams(Object.entries(p).filter(([,v])=>v)).toString(); return req('GET', `/templates${q?`?${q}`:''}`) },
  get:    (id)       => req('GET',    `/templates/${id}`),
  create: (data)     => req('POST',   '/templates', data),
  update: (id, data) => req('PUT',    `/templates/${id}`, data),
  delete: (id)       => req('DELETE', `/templates/${id}`),
}

export const statsAPI = { dashboard: () => req('GET', '/stats') }

export const openQRAPI = {
  list:            ()                   => req('GET',    '/openqr'),
  get:             (id)                 => req('GET',    `/openqr/${id}`),
  generate:        (count, label)       => req('POST',   '/openqr/generate', { count, label }),
  generateForEquipment: (equipmentId)   => req('POST',   '/openqr/for-equipment', { equipmentId }),
  assignExisting:  (id, equipmentId)    => req('PUT',    `/openqr/${id}/assign-existing`, { equipmentId }),
  assignNew:       (id, equipData)      => req('POST',   `/openqr/${id}/assign-new`, equipData),
  unassign:        (id)                 => req('PUT',    `/openqr/${id}/unassign`),
  delete:          (id)                 => req('DELETE', `/openqr/${id}`),
}

export const publicAPI = {
  latestByQR:        (id) => publicReq(`/public/qr/${id}/latest-report`),
  latestByEquipment: (id) => publicReq(`/public/equipment/${id}/latest-report`),
}
