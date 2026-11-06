import api from './axios'
import defaultLogo from '../assets/logo.png'

export async function getCurrentBranding() {
  const resp = await api.get('/branding/current')
  return normalizeBranding(resp.data)
}

export function normalizeBranding(value = {}) {
  return {
    tenantId: value.tenantId || value.TenantId || '',
    companyName: value.companyName || value.CompanyName || '',
    logoUrl: value.logoUrl || value.LogoUrl || '',
  }
}

export function assetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  if (url.startsWith('/')) return url
  return `/${url}`
}

export function brandingLogoUrl(brandingOrUser) {
  return assetUrl(brandingOrUser?.logoUrl || brandingOrUser?.LogoUrl) || defaultLogo
}

export { defaultLogo }
