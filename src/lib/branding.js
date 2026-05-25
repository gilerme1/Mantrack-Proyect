import { createContext, useContext } from 'react'

export const BRANDING_KEY = 'mt_branding'

export const DEFAULT_BRANDING = {
  appName:             'MantTrack',
  appSlogan:           'Gestión de Mantenimiento',
  logoDataUrl:         null,  // ícono cuadrado, modo claro
  logoDarkDataUrl:     null,  // ícono cuadrado, modo oscuro (opcional)
  logoFullDataUrl:     null,  // logo completo, modo claro
  logoFullDarkDataUrl: null,  // logo completo, modo oscuro (opcional)
  industry:            'GENERAL',
}

/** Devuelve src + filter CSS para mostrar el logo correctamente según el tema. */
export function resolveLogoIcon(branding, isDark) {
  const src = isDark && branding.logoDarkDataUrl
    ? branding.logoDarkDataUrl
    : branding.logoDataUrl
  const filter = isDark && !branding.logoDarkDataUrl && branding.logoDataUrl
    ? 'brightness(0) invert(1)'
    : undefined
  return { src, filter }
}

export function resolveLogoFull(branding, isDark) {
  const base = branding.logoFullDataUrl || branding.logoDataUrl
  const darkBase = branding.logoFullDarkDataUrl || branding.logoDarkDataUrl
  const src = isDark && darkBase ? darkBase : base
  const filter = isDark && !darkBase && base
    ? 'brightness(0) invert(1)'
    : undefined
  return { src, filter }
}

export function loadBranding() {
  try {
    const stored = localStorage.getItem(BRANDING_KEY)
    if (stored) return { ...DEFAULT_BRANDING, ...JSON.parse(stored) }
  } catch (_) {}
  return { ...DEFAULT_BRANDING }
}

export function saveBranding(data) {
  localStorage.setItem(BRANDING_KEY, JSON.stringify(data))
}

export const BrandingContext = createContext({
  branding: DEFAULT_BRANDING,
  setBranding: () => {},
})

export function useBranding() {
  return useContext(BrandingContext)
}
