/**
 * Bi-Directional Metadata & Schema Adapter for Uabindia
 * 
 * Bridges Next.js Enterprise Workspace PageSchema (PageSchema, SectionSchema, FormFieldDefinition)
 * and Vite HRMS Metadata Engine (DEFAULT_SCHEMAS, formSchemaStore, DynamicTableRenderer, DynamicFormRenderer).
 * 
 * Ensures:
 * 1. Both { id, tabId, columnSpan } and { key, span, form.sections[].fields[] } resolve transparently.
 * 2. Table columns accept both { header, alignment, format } and { label, dataType, badgeMap }.
 * 3. Options arrays support both string literals ['A', 'B'] and objects [{ value: 'A', label: 'A' }].
 */

export function normalizeTableColumn(col) {
  if (!col) return col
  const key = col.key || col.id
  const label = col.label || col.header || col.title || key
  const header = col.header || col.label || col.title || key
  const format = col.format || col.type || col.dataType || 'text'
  const type = col.type || col.dataType || col.format || 'text'
  const dataType = col.dataType || col.type || col.format || 'text'
  const align = col.align || col.alignment || 'left'
  const alignment = col.alignment || col.align || 'left'
  const visible = col.visible !== false && col.defaultVisible !== false
  const sortable = col.sortable !== undefined ? col.sortable : true
  const badgeMap = col.badgeMap || col.statusColorMap || null

  return {
    ...col,
    key,
    id: key,
    label,
    header,
    format,
    type,
    dataType,
    align,
    alignment,
    visible,
    sortable,
    badgeMap,
  }
}

export function normalizeField(f, defaultTabId = 'general') {
  if (!f) return f
  const id = f.id || f.key
  const key = f.key || f.id
  const tabId = f.tabId || defaultTabId
  const label = f.label || f.name || f.header || id
  const type = f.type || f.dataType || 'text'
  const dataType = f.dataType || f.type || 'text'
  const span = f.span || f.colSpan || f.columnSpan || 1
  const colSpan = f.colSpan || f.span || f.columnSpan || 1
  const columnSpan = f.columnSpan || f.colSpan || f.span || 1
  const referenceApi = f.referenceApi || f.lookupEndpoint || null

  let normalizedOptions = f.options
  if (Array.isArray(f.options)) {
    normalizedOptions = f.options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : opt.id,
          label: opt.label !== undefined ? opt.label : (opt.name || opt.value || opt.id),
        }
      }
      return { value: opt, label: String(opt) }
    })
  }

  return {
    ...f,
    id,
    key,
    tabId,
    label,
    type,
    dataType,
    span,
    colSpan,
    columnSpan,
    required: !!f.required,
    readOnly: !!f.readOnly,
    placeholder: f.placeholder || '',
    helpText: f.helpText || f.description || '',
    options: normalizedOptions,
    referenceApi,
  }
}

export function normalizeFormSchema(schema) {
  if (!schema) return schema
  const normalized = { ...schema }

  const title = schema.title || schema.label || ''
  const label = schema.label || schema.title || ''
  const id = schema.id || schema.key || schema.pageKey || ''
  const key = schema.key || schema.id || schema.pageKey || ''

  normalized.title = title
  normalized.label = label
  normalized.id = id
  normalized.key = key

  // Case 1: Next.js PageSchema structure with form.sections[].fields[]
  if (schema.form && Array.isArray(schema.form.sections) && schema.form.sections.length > 0) {
    if (!normalized.tabs || normalized.tabs.length === 0) {
      normalized.tabs = schema.form.sections.map(sec => ({
        id: sec.key,
        key: sec.key,
        label: sec.label,
        title: sec.label,
        description: sec.description || '',
        icon: sec.icon || 'Folder',
      }))
    }
    if (!normalized.fields || normalized.fields.length === 0) {
      normalized.fields = schema.form.sections.flatMap(sec =>
        (sec.fields || []).map(f => normalizeField(f, sec.key))
      )
    }
  }

  // Case 2: Vite HRMS flat or tabbed fields array
  if (Array.isArray(normalized.fields)) {
    normalized.fields = normalized.fields.map(f => normalizeField(f, normalized.tabs?.[0]?.id || 'general'))

    // Build form.sections for Next.js schema consumers if missing
    if (!normalized.form) {
      const tabMap = new Map()
      const tabs = Array.isArray(normalized.tabs) && normalized.tabs.length > 0
        ? normalized.tabs
        : [{ id: 'general', label: 'General Information' }]

      tabs.forEach(tab => {
        tabMap.set(tab.id, {
          key: tab.id,
          label: tab.label || tab.title || tab.id,
          description: tab.description || '',
          fields: [],
        })
      })

      normalized.fields.forEach(f => {
        const secId = f.tabId || 'general'
        if (!tabMap.has(secId)) {
          tabMap.set(secId, { key: secId, label: 'Additional Information', fields: [] })
        }
        tabMap.get(secId).fields.push(f)
      })

      normalized.form = { sections: Array.from(tabMap.values()) }
    }
  }

  return normalized
}

export function normalizePageSchema(schema) {
  if (!schema) return schema
  const normalized = normalizeFormSchema(schema)

  // Normalize Table Columns
  if (Array.isArray(normalized.columns)) {
    normalized.columns = normalized.columns.map(normalizeTableColumn)
  }

  // Normalize Table Filters
  if (Array.isArray(normalized.filters)) {
    normalized.filters = normalized.filters.map(filter => {
      let opts = filter.options
      if (Array.isArray(filter.options)) {
        opts = filter.options.map(opt => {
          if (typeof opt === 'object' && opt !== null) {
            return {
              value: opt.value !== undefined ? opt.value : opt.id,
              label: opt.label !== undefined ? opt.label : (opt.name || opt.value),
            }
          }
          return { value: opt, label: String(opt) }
        })
      }
      return {
        ...filter,
        key: filter.key || filter.id,
        label: filter.label || filter.name || filter.key,
        options: opts,
      }
    })
  }

  return normalized
}

