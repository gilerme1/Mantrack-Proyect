export const PUBLIC_APP_ORIGIN = (
  import.meta.env.VITE_PUBLIC_APP_URL ||
  'https://mantenimiento.andresprunell.com.uy'
).replace(/\/+$/, '')

export function publicQRUrl(qrId) {
  return `${PUBLIC_APP_ORIGIN}/public/qr/${qrId}`
}

export function publicEquipmentUrl(equipmentId) {
  return `${PUBLIC_APP_ORIGIN}/public/equipo/${equipmentId}`
}
