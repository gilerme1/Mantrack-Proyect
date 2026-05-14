import React, { useEffect, useRef } from 'react'

export function equipmentQRUrl(qrId) {
  return `${window.location.origin}/qr/${qrId}`
}

export function legacyEquipmentQRUrl(equipmentId) {
  return `${window.location.origin}/equipo/${equipmentId}`
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
