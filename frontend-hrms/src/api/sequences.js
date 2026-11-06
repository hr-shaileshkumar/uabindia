import api from './axios'

export async function getPreviewSequence(entity, companyId) {
  const resp = await api.get('/sequences/preview', {
    params: { entity, companyId },
  })
  return resp.data
}

export async function reserveNextSequence(entity, companyId) {
  const resp = await api.post('/sequences/next', null, {
    params: { entity, companyId },
  })
  return resp.data
}

export async function getCompanySequences(companyId) {
  const resp = await api.get('/sequences', {
    params: { companyId },
  })
  return resp.data
}

export async function updateCompanySequence(companyId, payload) {
  const resp = await api.put('/sequences', payload, {
    params: { companyId },
    successMessage: 'Series sequence configuration updated successfully',
  })
  return resp.data
}

export async function getNextEmployeeCode(companyId, projectId, previewOnly = true) {
  const resp = await api.get('/sequences/next-employee-code', {
    params: { companyId, projectId, previewOnly },
  })
  return resp.data
}

export default {
  getPreviewSequence,
  reserveNextSequence,
  getCompanySequences,
  updateCompanySequence,
  getNextEmployeeCode,
}
