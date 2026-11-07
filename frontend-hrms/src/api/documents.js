import api from './axios'

export async function getEmployeeDocuments(employeeId, category = null) {
  const params = { employeeId }
  if (category && category !== 'ALL') {
    params.category = category
  }
  const res = await api.get('/api/v1/documents', { params })
  return res.data
}

export async function uploadEmployeeDocument(formData) {
  const res = await api.post('/api/v1/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

export function getDocumentDownloadUrl(documentId) {
  const baseURL = api.defaults.baseURL || ''
  return `${baseURL}/api/v1/documents/${documentId}/download`
}

