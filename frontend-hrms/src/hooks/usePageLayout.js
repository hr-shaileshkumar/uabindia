import { useState, useEffect, useCallback, useMemo } from 'react'
import { getUiLayout } from '../api/layout'

/**
 * Enterprise hook to bind any page/table/form directly to SQL Server metadata
 * (dbo.UiLayoutPages, UiLayoutTabs, UiLayoutSections, UiLayoutFields, UiLayoutTableColumns).
 * - Fetches live layout from /api/ui-layout/:pageKey
 * - Subscribes to real-time SignalR broadcasts
 * - Provides resolved columns, fields, tabs, and page title
 * - Allows graceful fallback to default columns/fields if DB layout is still loading or empty
 */
export function usePageLayout(pageKey, defaultColumns = [], defaultFields = []) {
  const [layout, setLayout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(null)

  const loadLayout = useCallback(async (isMounted = { current: true }) => {
    if (!pageKey) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await getUiLayout(pageKey)
      if (isMounted.current && data) {
        setLayout(data)
        setVersion(data.version)
        setError(null)
      }
    } catch (err) {
      if (isMounted.current) {
        console.warn(`[usePageLayout] Failed to load layout for ${pageKey}, falling back to defaults`, err)
        setError(err)
      }
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [pageKey])

  useEffect(() => {
    const isMounted = { current: true }
    loadLayout(isMounted)

    // Listen for real-time SignalR events
    const handleLayoutChange = (e) => {
      const detail = e.detail
      if (!detail || detail.pageKey === pageKey || detail.schemaId === pageKey) {
        console.log(`⚡ [usePageLayout] Refreshing ${pageKey} layout due to real-time change:`, detail)
        loadLayout(isMounted)
      }
    }

    window.addEventListener('hrms:layout-synced', handleLayoutChange)
    window.addEventListener('hrms:metadata-updated', handleLayoutChange)
    window.addEventListener('app:context-changed', handleLayoutChange)

    return () => {
      isMounted.current = false
      window.removeEventListener('hrms:layout-synced', handleLayoutChange)
      window.removeEventListener('hrms:metadata-updated', handleLayoutChange)
      window.removeEventListener('app:context-changed', handleLayoutChange)
    }
  }, [pageKey, loadLayout])

  // Resolve columns: normalize DB columns (ColumnKey/HeaderText) with code defaults (key/header)
  const columns = useMemo(() => {
    if (layout?.tableColumns && Array.isArray(layout.tableColumns) && layout.tableColumns.length > 0) {
      return [...layout.tableColumns]
        .filter(c => c.isVisible !== false && c.IsVisible !== false)
        .map(c => ({
          ...c,
          key: c.key || c.columnKey || c.ColumnKey,
          columnKey: c.key || c.columnKey || c.ColumnKey,
          header: c.header || c.headerText || c.HeaderText || c.key || c.columnKey || c.ColumnKey,
          headerText: c.header || c.headerText || c.HeaderText || c.key || c.columnKey || c.ColumnKey,
          format: c.format || c.displayFormat || c.DisplayFormat,
          width: c.width || c.Width,
          alignment: c.alignment || c.Alignment || 'left'
        }))
        .sort((a, b) => (a.sortOrder ?? a.SortOrder ?? 0) - (b.sortOrder ?? b.SortOrder ?? 0))
    }
    return defaultColumns.map(c => ({
      ...c,
      columnKey: c.key || c.columnKey,
      headerText: c.header || c.headerText
    }))
  }, [layout, defaultColumns])

  // Resolve fields: flatten all fields across tabs and sections with key/label normalization
  const fields = useMemo(() => {
    const list = []
    if (layout?.tabs && Array.isArray(layout.tabs)) {
      layout.tabs.forEach(tab => {
        (tab.sections || []).forEach(sec => {
          (sec.fields || []).forEach(f => {
            const fieldKey = f.key || f.fieldKey || f.FieldKey
            const fieldLabel = f.label || f.fieldLabel || f.FieldLabel
            list.push({
              ...f,
              key: fieldKey,
              fieldKey,
              label: fieldLabel,
              fieldLabel,
              type: f.type || f.fieldType || f.FieldType || 'text',
              fieldType: f.type || f.fieldType || f.FieldType || 'text',
              tabKey: tab.tabKey || tab.TabKey,
              sectionKey: sec.sectionKey || sec.SectionKey
            })
          })
        })
      })
    }
    if (list.length > 0) {
      return list.sort((a, b) => (a.sortOrder ?? a.SortOrder ?? 0) - (b.sortOrder ?? b.SortOrder ?? 0))
    }
    return defaultFields
  }, [layout, defaultFields])

  const tabs = useMemo(() => {
    if (layout?.tabs && Array.isArray(layout.tabs) && layout.tabs.length > 0) {
      return [...layout.tabs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }
    return []
  }, [layout])

  return {
    layout,
    loading,
    error,
    version,
    pageTitle: layout?.pageTitle,
    columns,
    fields,
    tabs,
    refreshLayout: () => loadLayout({ current: true })
  }
}
