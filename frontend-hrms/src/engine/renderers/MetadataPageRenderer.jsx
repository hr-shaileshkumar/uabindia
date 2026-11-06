import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Edit3 } from 'lucide-react'
import { resolveIcon } from '../registry'
import MetadataTabRenderer from './MetadataTabRenderer'
import MetadataSectionRenderer from './MetadataSectionRenderer'
import RelatedRecordsRenderer from './RelatedRecordsRenderer'
import MetadataActionRenderer from './MetadataActionRenderer'
import MetadataLoadingState from './MetadataLoadingState'
import MetadataErrorState from './MetadataErrorState'
import MetadataPermissionGuard from './MetadataPermissionGuard'

export default function MetadataPageRenderer({
  schema,
  data = null,
  loading = false,
  error = null,
  onRefresh,
  onAction,
  breadcrumbs = [],
  heroContent = null,
  customTabs = {},
  className = '',
}) {
  const navigate = useNavigate()
  const tabs = schema?.tabs || []
  const [activeTabId, setActiveTabId] = useState(() => {
    const defaultTab = tabs.find(t => t.isDefault)
    return defaultTab?.id || tabs[0]?.id || ''
  })

  if (loading) {
    return <MetadataLoadingState type="profile" />
  }

  if (error) {
    return <MetadataErrorState title="Failed to load page" message={error} onRetry={onRefresh} />
  }

  // Find active tab metadata
  const currentTab = tabs.find(t => t.id === activeTabId)
  const isRelatedTab = currentTab?.isRelated
  const relationDef = isRelatedTab
    ? (schema?.relations || []).find(r => r.tabId === activeTabId || r.id === currentTab.relationKey)
    : null

  const sectionsForActiveTab = schema?.sections?.[activeTabId] || []

  return (
    <div className={`space-y-4 antialiased pb-8 w-full select-none ${className}`}>
      {/* 1. BREADCRUMBS & TOP BAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          {breadcrumbs.length > 0 && breadcrumbs[0]?.href && (
            <button
              type="button"
              onClick={() => navigate(breadcrumbs[0].href)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition shadow-2xs cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <div>
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-300">/</span>}
                    {bc.href ? (
                      <Link to={bc.href} className="hover:text-purple-700 transition">
                        {bc.label}
                      </Link>
                    ) : (
                      <span className="text-purple-700 font-mono">{bc.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
              {schema?.title || 'Overview'}
            </h1>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {(schema?.actions || []).map((action, idx) => (
            <MetadataActionRenderer
              key={action.key || idx}
              action={action}
              contextData={data}
              onAction={onAction}
            />
          ))}
        </div>
      </div>

      {/* 2. OPTIONAL HERO SUMMARY */}
      {heroContent}

      {/* 3. TABS NAVIGATION */}
      {tabs.length > 0 && (
        <MetadataTabRenderer
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
        />
      )}

      {/* 4. ACTIVE TAB CONTENT */}
      <MetadataPermissionGuard
        requiredRole={currentTab?.requiredRole}
        restrictedRole={currentTab?.restrictedRole}
        requiredPermission={currentTab?.permission}
        showNotice={true}
      >
        {/* Custom Tab Override (if provided by caller) */}
        {customTabs[activeTabId] ? (
          customTabs[activeTabId]
        ) : isRelatedTab && relationDef ? (
          /* Related Records Table Renderer */
          <RelatedRecordsRenderer
            relation={relationDef}
            parentId={data?.id || data?.employeeId}
            parentEntity={schema?.entityType || 'employee'}
            parentData={data}
            onAction={onAction}
          />
        ) : sectionsForActiveTab.length > 0 ? (
          /* Schema Sections */
          <div className="space-y-4 animate-in fade-in duration-150">
            {sectionsForActiveTab.map((section) => (
              <MetadataSectionRenderer
                key={section.id}
                section={section}
                values={data || {}}
                readOnly={true}
              />
            ))}
          </div>
        ) : (
          /* Fallback empty view for tabs without custom or section schema */
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
            No sections configured for this tab in metadata.
          </div>
        )}
      </MetadataPermissionGuard>
    </div>
  )
}
