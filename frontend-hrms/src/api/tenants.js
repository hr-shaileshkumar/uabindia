import api from './axios'

export async function listTenants() {
  const resp = await api.get('/tenants')
  return resp.data
}

export async function searchTenants(params = {}) {
  const resp = await api.get('/tenants', { params })
  return resp.data
}

export async function getTenant(id) {
  const resp = await api.get(`/tenants/${id}`)
  return resp.data
}

export async function createTenant(payload) {
  const resp = await api.post('/tenants', payload, {
    successMessage: 'Tenant created successfully',
  })
  return resp.data
}

export async function updateTenant(id, payload) {
  const resp = await api.put(`/tenants/${id}`, payload, {
    successMessage: 'Tenant updated successfully',
  })
  return resp.data
}

export async function updateTenantStatus(id, isActive) {
  const resp = await api.post(`/tenants/${id}/status`, { isActive }, {
    successMessage: isActive ? 'Tenant activated successfully' : 'Tenant deactivated successfully',
  })
  return resp.data
}

export async function deleteTenant(id) {
  const resp = await api.delete(`/tenants/${id}`, {
    successMessage: 'Tenant deleted successfully',
  })
  return resp.data
}

export async function uploadTenantLogo(id, file) {
  const form = new FormData()
  form.append('file', file)
  const resp = await api.post(`/tenants/${id}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    successMessage: 'Tenant logo uploaded successfully',
  })
  return resp.data
}

export async function removeTenantLogo(id) {
  const resp = await api.delete(`/tenants/${id}/logo`, {
    successMessage: 'Tenant logo removed successfully',
  })
  return resp.data
}
