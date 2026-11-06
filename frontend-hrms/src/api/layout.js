import api from './axios'

/**
 * Enterprise Database-Driven UI Layout Service
 * All mutations increment Version = Version + 1 and trigger real-time SignalR broadcasts
 */

export async function getUiLayout(pageKey, params = {}) {
  try {
    const resp = await api.get(`/ui-layout/${pageKey}`, {
      params,
      silent: true,
      skipErrorToast: true
    })
    return resp.data
  } catch (err) {
    console.warn(`[getUiLayout] Layout not seeded for ${pageKey}, falling back to code defaults`)
    return null
  }
}

export async function getUiLayoutPages() {
  try {
    const resp = await api.get('/ui-layout/pages')
    return resp.data || []
  } catch (err) {
    console.error('Failed to load UI layout pages:', err)
    return []
  }
}

export async function moveUiField(fieldId, newSectionId, newSortOrder) {
  const resp = await api.put(`/ui-layout/fields/${fieldId}/move`, {
    newSectionId,
    newSortOrder
  })
  return resp.data
}

export async function addUiField(payload) {
  const resp = await api.post('/ui-layout/fields', payload)
  return resp.data
}

export async function updateUiField(fieldId, payload) {
  const resp = await api.put(`/ui-layout/fields/${fieldId}`, payload)
  return resp.data
}

export async function deleteUiField(fieldId) {
  const resp = await api.delete(`/ui-layout/fields/${fieldId}`)
  return resp.data
}

export async function updateUiSection(sectionId, payload) {
  const resp = await api.put(`/ui-layout/sections/${sectionId}`, payload)
  return resp.data
}

export async function reorderUiColumn(columnId, newSortOrder, isVisible = null) {
  const resp = await api.put(`/ui-layout/columns/${columnId}/reorder`, {
    newSortOrder,
    isVisible
  })
  return resp.data
}

export async function addUiColumn(payload) {
  const resp = await api.post('/ui-layout/columns', payload)
  return resp.data
}
