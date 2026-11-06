import api from './axios'

export async function getPayrollRuns(companyId, year) {
  const params = {}
  if (companyId) params.companyId = companyId
  if (year) params.year = year
  const resp = await api.get('/payroll/runs', { params })
  return resp.data
}

export async function getPayrollSlips(runId) {
  const resp = await api.get(`/payroll/runs/${runId}/slips`)
  return resp.data
}

export async function generatePayrollRun(payload) {
  const resp = await api.post('/payroll/runs/generate', payload, {
    successMessage: 'Payroll run generated successfully',
  })
  return resp.data
}

export default {
  getPayrollRuns,
  getPayrollSlips,
  generatePayrollRun,
}
