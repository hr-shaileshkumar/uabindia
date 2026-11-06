import api from './axios'

export async function getEssOverview(employeeId) {
  const resp = await api.get('/ess/my-overview', { params: { employeeId } })
  return resp.data
}

export async function getEssLeaves(employeeId) {
  const resp = await api.get('/ess/my-leaves', { params: { employeeId } })
  return resp.data || []
}

export async function applyEssLeave(payload) {
  const resp = await api.post('/ess/apply-leave', payload)
  return resp.data
}

export async function getEssPayslips(employeeId) {
  const resp = await api.get('/ess/my-payslips', { params: { employeeId } })
  return resp.data || []
}

export async function getEssTickets(employeeId) {
  const resp = await api.get('/ess/my-tickets', { params: { employeeId } })
  return resp.data || []
}

export async function createEssTicket(payload) {
  const resp = await api.post('/ess/tickets', payload)
  return resp.data
}

// Aliases for convenience
export const getMyLeaves = getEssLeaves
export const applyLeave = applyEssLeave
export const getMyPayslips = getEssPayslips
export const getMyTickets = getEssTickets
export const raiseTicket = createEssTicket

