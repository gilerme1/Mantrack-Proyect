import { createContext, useContext } from 'react'

export const BRANDING_KEY = 'mt_branding'

export const DEFAULT_BRANDING = {
  appName:    'MantTrack',
  appSlogan:  'Gestión de Mantenimiento',
  logoDataUrl: null,
  industry:   'GENERAL',
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
