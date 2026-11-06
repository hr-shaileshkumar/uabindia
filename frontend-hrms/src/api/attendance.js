import api from './axios'

export async function listAttendance(params = {}) {
  const resp = await api.get('/attendance', { params })
  return resp.data
}

export async function getAttendanceCalendar(params = {}) {
  const resp = await api.get('/attendance/calendar', { params })
  return resp.data
}

export async function getAttendanceMasterRoll(params = {}) {
  const resp = await api.get('/attendance/master-roll', { params })
  return resp.data
}

export async function getMasterRollStatus(params = {}) {
  const resp = await api.get('/attendance/master-roll-status', { params })
  return resp.data
}

export async function finalizeMasterRoll(payload) {
  const resp = await api.post('/attendance/finalize-master-roll', payload)
  return resp.data
}

export async function pushToPayroll(payload) {
  const resp = await api.post('/attendance/push-to-payroll', payload)
  return resp.data
}

export async function markAttendance(payload) {
  const resp = await api.post('/attendance/mark', payload)
  return resp.data
}

export default {
  listAttendance,
  getAttendanceCalendar,
  getAttendanceMasterRoll,
  getMasterRollStatus,
  finalizeMasterRoll,
  pushToPayroll,
  markAttendance,
}
