import api from './axios'

export async function getTrainingPrograms(status) {
  const resp = await api.get('/training/programs', { params: { status } })
  return resp.data || []
}

export async function createTrainingProgram(payload) {
  const resp = await api.post('/training/programs', payload)
  return resp.data
}

export async function getAllNominations(programId) {
  const resp = await api.get('/training/nominations', { params: { programId } })
  return resp.data || []
}

export async function getProgramNominations(programId) {
  const resp = await api.get(`/training/programs/${programId}/nominations`)
  return resp.data || []
}

export async function nominateEmployee(payload) {
  const resp = await api.post('/training/nominations', payload)
  return resp.data
}

export async function updateNominationAttendance(id, payload) {
  const resp = await api.put(`/training/nominations/${id}/attendance`, payload)
  return resp.data
}
