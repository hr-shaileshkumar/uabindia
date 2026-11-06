import api from './axios'

export async function getLeaveBalances(companyId, employeeId) {
  const params = {}
  if (companyId) params.companyId = companyId
  if (employeeId) params.employeeId = employeeId
  const resp = await api.get('/leaves/balances', { params })
  return resp.data
}

export async function getLeaveApplications(companyId, status) {
  const params = {}
  if (companyId) params.companyId = companyId
  if (status && status !== 'all') params.status = status
  const resp = await api.get('/leaves/applications', { params })
  return resp.data
}

export async function applyLeave(payload) {
  const resp = await api.post('/leaves/applications', payload, {
    successMessage: 'Leave application submitted successfully',
  })
  return resp.data
}

export async function updateLeaveStatus(id, status, rejectionReason) {
  const resp = await api.put(`/leaves/applications/${id}/status`, { status, rejectionReason }, {
    successMessage: `Leave application marked as ${status}`,
  })
  return resp.data
}

export default {
  getLeaveBalances,
  getLeaveApplications,
  applyLeave,
  updateLeaveStatus,
}
