import axios from './axios'

// Universal Master Data API Client
export async function getMasterItems(entity, params = {}) {
  const resp = await axios.get(`/master/${entity}`, { params })
  return resp.data || []
}

export async function createMasterItem(entity, data) {
  const resp = await axios.post(`/master/${entity}`, data)
  return resp.data
}

export async function updateMasterItem(entity, id, data) {
  const resp = await axios.put(`/master/${entity}/${id}`, data)
  return resp.data
}

export async function deleteMasterItem(entity, id) {
  const resp = await axios.delete(`/master/${entity}/${id}`)
  return resp.data
}

export async function getMasterCounts() {
  const resp = await axios.get('/master/counts')
  return resp.data || {}
}
