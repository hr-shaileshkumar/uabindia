import axios from './axios'

export async function getImportEntities() {
  const response = await axios.get('/api/import/entities')
  return response.data
}

export async function getImportSchema(entityType) {
  const response = await axios.get(`/api/import/schema/${entityType}`)
  return response.data
}

export async function downloadImportTemplate(entityType, format = 'xlsx') {
  const response = await axios.get(`/api/import/template/${entityType}?format=${format}`, {
    responseType: 'blob'
  })
  
  const blob = new Blob([response.data], {
    type: format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${entityType}_template.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function validateImportFile(file, entityType, companyId, projectId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('entityType', entityType)
  if (companyId) formData.append('companyId', companyId)
  if (projectId) formData.append('projectId', projectId)

  const response = await axios.post('/api/import/validate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

export async function commitImport(file, entityType, importValidOnly, companyId, projectId) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('entityType', entityType)
  formData.append('importValidOnly', String(importValidOnly))
  if (companyId) formData.append('companyId', companyId)
  if (projectId) formData.append('projectId', projectId)

  const response = await axios.post('/api/import/commit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}
