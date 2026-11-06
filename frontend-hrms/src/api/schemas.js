import api from './axios'

/**
 * Fetch a published schema from SQL Server database
 */
export async function fetchSchemaFromDb(schemaId, tenantId = 'default') {
  try {
    const resp = await api.get(`/schemas/${schemaId}`, { params: { tenantId } })
    if (resp?.data?.schemaJson) {
      const parsed = typeof resp.data.schemaJson === 'string'
        ? JSON.parse(resp.data.schemaJson)
        : resp.data.schemaJson
      return {
        ...parsed,
        version: resp.data.version || parsed.version,
        publishedAt: resp.data.publishedAt,
        updatedAt: resp.data.updatedAt,
      }
    }
    return null
  } catch (err) {
    // 404 is normal if not yet published to DB
    return null
  }
}

/**
 * Save / publish a schema to SQL Server database
 */
export async function saveSchemaToDb(schemaId, schemaObj, tenantId = 'default') {
  try {
    const payload = {
      schemaJson: JSON.stringify(schemaObj),
      entityType: schemaObj.entityType || schemaId.replace('_form', '').replace('_directory', ''),
    }
    const resp = await api.post(`/schemas/${schemaId}`, payload, { params: { tenantId } })
    return resp.data
  } catch (err) {
    console.warn(`[saveSchemaToDb] Could not sync ${schemaId} to database:`, err)
    return null
  }
}

/**
 * List all schemas registered in database
 */
export async function fetchAllSchemasFromDb(tenantId = 'default') {
  try {
    const resp = await api.get('/schemas', { params: { tenantId } })
    return resp?.data || []
  } catch {
    return []
  }
}
