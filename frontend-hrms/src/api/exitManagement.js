import api from './axios'

export const getResignations = async (params = {}) => {
  const resp = await api.get('/exit/resignations', { params })
  return resp.data
}

export const submitResignation = async (payload) => {
  const resp = await api.post('/exit/resignations', payload, {
    successMessage: 'Resignation submitted successfully',
  })
  return resp.data
}

export const approveResignation = async (id, payload) => {
  const resp = await api.post(`/exit/resignations/${id}/approve`, payload, {
    successMessage: 'Resignation approved and clearance checklist created',
  })
  return resp.data
}

export const getClearances = async (resignationId) => {
  const resp = await api.get(`/exit/resignations/${resignationId}/clearances`)
  return resp.data
}

export const updateClearance = async (clearanceId, payload) => {
  const resp = await api.post(`/exit/clearances/${clearanceId}/action`, payload, {
    successMessage: 'Clearance item updated successfully',
  })
  return resp.data
}

export const getFinalSettlement = async (resignationId) => {
  const resp = await api.get(`/exit/resignations/${resignationId}/settlement`)
  return resp.data
}

export const relieveEmployee = async (resignationId, payload = {}) => {
  const resp = await api.post(`/exit/resignations/${resignationId}/relieve`, payload, {
    successMessage: 'Employee relieved and Full & Final settlement recorded',
  })
  return resp.data
}
