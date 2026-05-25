import React, { useEffect, useRef } from 'react'
import { publicEquipmentUrl, publicQRUrl } from '../lib/publicUrls.js'

export function equipmentQRUrl(qrId) {
  return publicQRUrl(qrId)
}

export function legacyEquipmentQRUrl(equipmentId) {
  return publicEquipmentUrl(equipmentId)
}

export function EquipmentQRCanvas({ qrId, text, size = 150 }) {
  const ref = useRef(null)
  const qrText = text || (qrId ? equipmentQRUrl(qrId) : '')

  useEffect(() => {
    if (!ref.current || !qrText) return
    let cancelled = false
    import('qrcode').then(QRCode => {
      if (cancelled) return
      QRCode.toCanvas(ref.current, qrText, {
        width: size,
        margin: 2,
        color: { dark: '#111827', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      })
    })
    return () => { cancelled = true }
  }, [qrText, size])

  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} />
}
