import api from './axios'

export async function getCompanySetup(companyId) {
  const path = companyId && companyId !== 'current' ? `/company-setup/${companyId}` : '/company-setup/current'
  const resp = await api.get(path)
  return resp.data
}

export async function createCompanySetupItem(companyId, payload) {
  const path = companyId && companyId !== 'current' ? `/company-setup/${companyId}/items` : '/company-setup/current/items'
  const resp = await api.post(path, payload, {
    successMessage: 'Setup item saved successfully',
  })
  return resp.data
}

export async function updateCompanySetupItem(companyId, id, payload) {
  const path = companyId && companyId !== 'current' ? `/company-setup/${companyId}/items/${id}` : `/company-setup/current/items/${id}`
  const resp = await api.put(path, payload, {
    successMessage: 'Setup item updated successfully',
  })
  return resp.data
}

export async function deleteCompanySetupItem(companyId, id) {
  const path = companyId && companyId !== 'current' ? `/company-setup/${companyId}/items/${id}` : `/company-setup/current/items/${id}`
  const resp = await api.delete(path, {
    successMessage: 'Setup item deleted successfully',
  })
  return resp.data
}

export async function seedCompanySetupDefaults() {
  const resp = await api.post('/company-setup/current/seed-defaults', {}, {
    successMessage: 'Default masters seeded successfully',
  })
  return resp.data
}

export async function getNextSetupCode(companyId, itemType) {
  const path = companyId && companyId !== 'current' ? `/company-setup/${companyId}/next-code` : '/company-setup/current/next-code'
  const resp = await api.get(path, { params: { itemType } })
  return resp.data
}

export default {
  getCompanySetup,
  createCompanySetupItem,
  updateCompanySetupItem,
  deleteCompanySetupItem,
  seedCompanySetupDefaults,
  getNextSetupCode,
}
