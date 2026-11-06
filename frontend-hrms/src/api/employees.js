import api from './axios'

export async function listEmployees(params = {}) {
  const resp = await api.get('/employees', { params })
  return resp.data
}

export async function getEmployee(id) {
  const resp = await api.get(`/employees/${id}`)
  return resp.data
}

export async function createEmployee(payload) {
  const resp = await api.post('/employees', payload, {
    successMessage: 'Employee saved successfully',
  })
  return resp.data
}

export async function updateEmployee(id, payload) {
  const resp = await api.put(`/employees/${id}`, payload, {
    successMessage: 'Employee updated successfully',
  })
  return resp.data
}

export async function deleteEmployee(id) {
  const resp = await api.delete(`/employees/${id}`, {
    successMessage: 'Employee deleted successfully',
  })
  return resp.data
}

export default {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
}
