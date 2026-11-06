/**
 * Uabindia HRMS Metadata-Driven Architecture
 * Schema Validator & Type Definitions
 * 
 * Enforces strict validation of UI metadata schemas:
 * - Pages, Tabs, Sections
 * - Fields, Forms, Tables, Columns
 * - Relations, Actions, Role Permissions
 */

export const ALLOWED_FIELD_TYPES = [
  'text',
  'number',
  'email',
  'phone',
  'date',
  'select',
  'multiselect',
  'boolean',
  'textarea',
  'file',
  'currency',
  'badge',
  'ref_select',
]

export const ALLOWED_COLUMN_FORMATS = [
  'text',
  'code',
  'date',
  'currency',
  'badge',
  'avatar',
  'link',
  'actions',
  'boolean',
  'contact',
]

export const ALLOWED_ACTION_VARIANTS = [
  'primary',
  'secondary',
  'danger',
  'outline',
  'ghost',
]

/**
 * Validates a field definition schema.
 * Returns an array of error messages (empty if valid).
 */
export function validateFieldDefinition(field, index = 0) {
  const errors = []
  if (!field || typeof field !== 'object') {
    errors.push(`Field at index ${index} must be an object.`)
    return errors
  }

  if (!field.id || typeof field.id !== 'string') {
    errors.push(`Field at index ${index} is missing a required string 'id'.`)
  }

  if (!field.label || typeof field.label !== 'string') {
    errors.push(`Field '${field.id || index}' is missing a required string 'label'.`)
  }

  if (!field.type || !ALLOWED_FIELD_TYPES.includes(field.type)) {
    errors.push(
      `Field '${field.id || index}' has invalid type '${field.type}'. Allowed: ${ALLOWED_FIELD_TYPES.join(', ')}`
    )
  }

  if (field.type === 'select' || field.type === 'multiselect') {
    if (!field.options && !field.referenceApi) {
      errors.push(`Field '${field.id}' of type '${field.type}' must define 'options' or 'referenceApi'.`)
    }
  }

  return errors
}

/**
 * Validates a table column definition schema.
 */
export function validateColumnDefinition(col, index = 0) {
  const errors = []
  if (!col || typeof col !== 'object') {
    errors.push(`Column at index ${index} must be an object.`)
    return errors
  }

  if (!col.key && !col.id) {
    errors.push(`Column at index ${index} is missing a required 'key' or 'id'.`)
  }

  if (!col.label) {
    errors.push(`Column '${col.key || col.id || index}' is missing a required 'label'.`)
  }

  if (col.format && !ALLOWED_COLUMN_FORMATS.includes(col.format)) {
    errors.push(
      `Column '${col.key || col.id}' has invalid format '${col.format}'. Allowed: ${ALLOWED_COLUMN_FORMATS.join(', ')}`
    )
  }

  return errors
}

/**
 * Validates a full metadata schema (Form or Table or Page).
 * Detects duplicate IDs, missing fields, or invalid configurations.
 */
export function validateMetadataSchema(schema) {
  const errors = []
  const warnings = []

  if (!schema || typeof schema !== 'object') {
    return { isValid: false, errors: ['Schema must be a valid non-null object.'], warnings }
  }

  if (!schema.id) {
    errors.push("Schema must have an 'id'.")
  }

  if (!schema.title) {
    warnings.push("Schema is recommended to have a 'title'.")
  }

  // Validate Fields (if present)
  if (Array.isArray(schema.fields)) {
    const fieldIdSet = new Set()
    schema.fields.forEach((field, idx) => {
      const fieldErrors = validateFieldDefinition(field, idx)
      errors.push(...fieldErrors)

      if (field.id) {
        if (fieldIdSet.has(field.id)) {
          errors.push(`Duplicate field ID '${field.id}' detected in schema '${schema.id}'.`)
        } else {
          fieldIdSet.add(field.id)
        }
      }
    })
  }

  // Validate Tabs (if present)
  if (Array.isArray(schema.tabs)) {
    const tabIdSet = new Set()
    schema.tabs.forEach((tab, idx) => {
      if (!tab.id) {
        errors.push(`Tab at index ${idx} is missing an 'id'.`)
      } else if (tabIdSet.has(tab.id)) {
        errors.push(`Duplicate tab ID '${tab.id}' detected.`)
      } else {
        tabIdSet.add(tab.id)
      }
    })

    // Check that field tabIds point to valid tabs
    if (Array.isArray(schema.fields)) {
      schema.fields.forEach(field => {
        if (field.tabId && !tabIdSet.has(field.tabId)) {
          warnings.push(
            `Field '${field.id}' references tabId '${field.tabId}' which is not in tabs list.`
          )
        }
      })
    }
  }

  // Validate Columns (if table schema)
  if (Array.isArray(schema.columns)) {
    const colKeySet = new Set()
    schema.columns.forEach((col, idx) => {
      const colErrors = validateColumnDefinition(col, idx)
      errors.push(...colErrors)

      const key = col.key || col.id
      if (key) {
        if (colKeySet.has(key)) {
          errors.push(`Duplicate column key '${key}' detected.`)
        } else {
          colKeySet.add(key)
        }
      }
    })
  }

  // Validate Relations (if present)
  if (Array.isArray(schema.relations)) {
    schema.relations.forEach((rel, idx) => {
      if (!rel.id || !rel.entity || !rel.relationshipKey) {
        errors.push(
          `Relation at index ${idx} must specify 'id', 'entity', and 'relationshipKey'.`
        )
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
