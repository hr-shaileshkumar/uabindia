import api from './axios'

export async function listCompanies(params = {}) {
  const resp = await api.get('/companies', { params })
  const d = resp?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.items)) return d.items
  if (Array.isArray(d?.records)) return d.records
  if (Array.isArray(d?.companies)) return d.companies
  if (Array.isArray(d?.data)) return d.data
  return []
}

export async function getCompany(id) {
  const resp = await api.get(`/companies/${id}`)
  return resp.data
}

export async function createCompany(payload) {
  const resp = await api.post('/companies', payload, {
    successMessage: 'Company created successfully',
  })
  return resp.data
}

export async function updateCompany(id, payload) {
  const resp = await api.put(`/companies/${id}`, payload, {
    successMessage: 'Company updated successfully',
  })
  return resp.data
}

export async function updateCompanyStatus(id, isActive) {
  const resp = await api.post(`/companies/${id}/status`, { isActive }, {
    successMessage: isActive ? 'Company activated successfully' : 'Company deactivated successfully',
  })
  return resp.data
}

export async function deleteCompany(id) {
  const resp = await api.delete(`/companies/${id}`, {
    successMessage: 'Company deleted successfully',
  })
  return resp.data
}

export async function uploadCompanyLogo(id, file) {
  const form = new FormData()
  form.append('file', file)
  const resp = await api.post(`/companies/${id}/logo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    successMessage: 'Company logo uploaded successfully',
  })
  return resp.data
}

export async function removeCompanyLogo(id) {
  const resp = await api.delete(`/companies/${id}/logo`, {
    successMessage: 'Company logo removed successfully',
  })
  return resp.data
}
