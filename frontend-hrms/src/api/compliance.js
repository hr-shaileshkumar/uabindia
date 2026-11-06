import api from './axios'

export async function getComplianceFilings(companyId, year) {
  const params = {}
  if (companyId) params.companyId = companyId
  if (year) params.year = year
  const resp = await api.get('/compliance/filings', { params })
  return resp.data
}

export async function recordComplianceFiling(payload) {
  const resp = await api.post('/compliance/filings', payload, {
    successMessage: 'Statutory compliance filing recorded successfully',
  })
  return resp.data
}

export default {
  getComplianceFilings,
  recordComplianceFiling,
}
