import api from './axios'

export const listProjects = async (params = {}) => {
  const resp = await api.get('/projects', { params })
  const d = resp?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.projects)) return d.projects
  if (Array.isArray(d?.items)) return d.items
  if (Array.isArray(d?.records)) return d.records
  if (Array.isArray(d?.data)) return d.data
  return []
}

export const getProject = async (id) => {
  const resp = await api.get(`/projects/${id}`)
  return resp.data
}

export const createProject = async (payload) => {
  const resp = await api.post('/projects', payload, {
    successMessage: 'Project created successfully',
  })
  return resp.data
}

export const updateProject = async (id, payload) => {
  const resp = await api.put(`/projects/${id}`, payload, {
    successMessage: 'Project updated successfully',
  })
  return resp.data
}

export const updateProjectStatus = async (id, isActive) => {
  const resp = await api.post(`/projects/${id}/status`, { isActive }, {
    successMessage: isActive ? 'Project activated successfully' : 'Project deactivated successfully',
  })
  return resp.data
}

export const deleteProject = async (id) => {
  const resp = await api.delete(`/projects/${id}`, {
    successMessage: 'Project deleted successfully',
  })
  return resp.data
}
