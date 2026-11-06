import api from './axios'

const fallbackSettings = {
  providerName: 'Uabindia HRMS Service Provider',
  brandName: 'Uabindia HRMS',
  baseDomain: 'your-domain.com',
  country: 'India',
  defaultPlanName: 'Standard',
  defaultMaxUsers: 50,
  defaultMaxProjects: 10,
}

export async function getPlatformSettings() {
  const resp = await api.get('/platform-settings')
  return normalizePlatformSettings(resp.data)
}

export async function updatePlatformSettings(payload) {
  const resp = await api.put('/platform-settings', payload, {
    successMessage: 'Provider setup saved successfully',
  })
  return normalizePlatformSettings(resp.data)
}

export async function getDomainPreview(subdomain) {
  const resp = await api.get('/platform-settings/domain-preview', { params: { subdomain } })
  return resp.data
}

export function normalizePlatformSettings(value = {}) {
  return {
    ...fallbackSettings,
    id: value.id || value.Id || '',
    providerName: value.providerName || value.ProviderName || fallbackSettings.providerName,
    brandName: value.brandName || value.BrandName || fallbackSettings.brandName,
    baseDomain: value.baseDomain || value.BaseDomain || fallbackSettings.baseDomain,
    adminPortalUrl: value.adminPortalUrl || value.AdminPortalUrl || '',
    supportEmail: value.supportEmail || value.SupportEmail || '',
    supportPhone: value.supportPhone || value.SupportPhone || '',
    websiteUrl: value.websiteUrl || value.WebsiteUrl || '',
    addressLine1: value.addressLine1 || value.AddressLine1 || '',
    addressLine2: value.addressLine2 || value.AddressLine2 || '',
    city: value.city || value.City || '',
    state: value.state || value.State || '',
    country: value.country || value.Country || fallbackSettings.country,
    postalCode: value.postalCode || value.PostalCode || '',
    taxId: value.taxId || value.TaxId || '',
    logoUrl: value.logoUrl || value.LogoUrl || '',
    defaultPlanName: value.defaultPlanName || value.DefaultPlanName || fallbackSettings.defaultPlanName,
    defaultMaxUsers: Number(value.defaultMaxUsers || value.DefaultMaxUsers || fallbackSettings.defaultMaxUsers),
    defaultMaxProjects: Number(value.defaultMaxProjects || value.DefaultMaxProjects || fallbackSettings.defaultMaxProjects),
    notes: value.notes || value.Notes || '',
  }
}

export function tenantHost(subdomain, settings) {
  const sub = String(subdomain || 'tenant').trim().toLowerCase()
  const domain = String(settings?.baseDomain || fallbackSettings.baseDomain).trim().toLowerCase()
  return `${sub || 'tenant'}.${domain || fallbackSettings.baseDomain}`
}

export { fallbackSettings }
