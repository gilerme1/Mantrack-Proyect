import { Router } from 'express'

const router = Router()
const ARCGIS_BASE = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer'

router.get('/suggest', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (q.length < 3) return res.json([])

    const params = new URLSearchParams({
      text: q,
      f: 'json',
      maxSuggestions: '6',
      langCode: 'es',
    })

    const response = await fetch(`${ARCGIS_BASE}/suggest?${params}`)
    if (!response.ok) {
      return res.status(502).json({ error: 'No se pudo consultar el servicio de direcciones' })
    }

    const data = await response.json()
    res.json((data.suggestions || []).map((place, index) => ({
      id: place.magicKey || `${place.text}-${index}`,
      label: place.text,
      magicKey: place.magicKey,
    })))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/resolve', async (req, res) => {
  try {
    const text = String(req.body.text || '').trim()
    const magicKey = String(req.body.magicKey || '').trim()
    if (!text || !magicKey) return res.status(400).json({ error: 'Dirección requerida' })

    const params = new URLSearchParams({
      SingleLine: text,
      magicKey,
      f: 'json',
      outSR: '4326',
      maxLocations: '1',
      outFields: 'Match_addr,Addr_type',
      langCode: 'es',
    })

    const response = await fetch(`${ARCGIS_BASE}/findAddressCandidates?${params}`)
    if (!response.ok) {
      return res.status(502).json({ error: 'No se pudo resolver la dirección' })
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    if (!candidate?.location) return res.status(404).json({ error: 'No se encontró esa dirección' })

    const lat = Number(candidate.location.y)
    const lng = Number(candidate.location.x)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(404).json({ error: 'La dirección no tiene ubicación válida' })
    }

    res.json({
      address: candidate.address || text,
      lat,
      lng,
      score: candidate.score,
      type: candidate.attributes?.Addr_type || '',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
