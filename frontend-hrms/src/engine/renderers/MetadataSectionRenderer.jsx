import React, { useState } from 'react'
import { resolveIcon } from '../registry'
import { ChevronDown, ChevronUp } from 'lucide-react'
import DynamicFieldRenderer from './DynamicFieldRenderer'

export default function MetadataSectionRenderer({
  section,
  values = {},
  errors = {},
  onChange,
  onBlur,
  disabled = false,
  readOnly = false,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const IconComponent = resolveIcon(section.icon)

  // Responsive grid columns based on section.columns
  const gridColClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  }[section.columns || 2] || 'grid-cols-1 md:grid-cols-2'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          {IconComponent && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <IconComponent size={15} />
            </div>
          )}
          <div>
            <h3 className="font-extrabold text-xs md:text-sm text-slate-900 tracking-tight">
              {section.title}
            </h3>
            {section.subtitle && (
              <p className="text-[11px] text-slate-400 font-medium">{section.subtitle}</p>
            )}
          </div>
        </div>

        {section.collapsible && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        )}
      </div>

      {/* Section Body */}
      {!collapsed && (
        <div>
          {children ? (
            children
          ) : (
            <div className={`grid ${gridColClass} gap-4`}>
              {(section.fields || []).map((field) => (
                <div key={field.id} className={field.colSpan === 2 ? 'col-span-full md:col-span-2' : ''}>
                  {readOnly ? (
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-400">{field.label}:</span>
                      <div className="text-xs font-bold text-slate-800">
                        {values[field.id] !== undefined && values[field.id] !== null && values[field.id] !== ''
                          ? String(values[field.id])
                          : '-'}
                      </div>
                    </div>
                  ) : (
                    <DynamicFieldRenderer
                      field={field}
                      value={values[field.id]}
                      onChange={onChange}
                      onBlur={onBlur}
                      error={errors[field.id]}
                      disabled={disabled}
                      readOnly={readOnly}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
