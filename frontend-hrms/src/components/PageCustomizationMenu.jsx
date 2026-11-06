import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sliders,
  LayoutTemplate,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import TabSequenceModal from './TabSequenceModal'
import { saveFormSchema } from '../utils/formSchemaStore'

export default function PageCustomizationMenu({
  schema,
  entityType = 'employee',
  schemaId = 'employee_form',
  onSchemaUpdated,
  className = '',
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [tabModalOpen, setTabModalOpen] = useState(false)
  const menuRef = useRef(null)

  // Strict role & permission check:
  // Appears ONLY for SuperAdmin, Admin, or users explicitly granted FormStudio/Customization permission
  const canCustomize = useMemo(() => {
    if (!user) return false
    const role = String(user.roleName || user.role || user.Role || '').toLowerCase().trim()
    if (
      role.includes('superadmin') ||
      role.includes('admin') ||
      role.includes('company admin')
    ) {
      return true
    }

    const allowed = user.allowedPages || user.AllowedPages || []
    if (Array.isArray(allowed)) {
      if (allowed.includes('*')) return true
      return allowed.some(p => {
        const norm = String(p).toLowerCase().trim()
        return ['formstudio', 'customization', 'metadata', 'superadmin', 'admin'].includes(norm)
      })
    }

    return false
  }, [user])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // If user does not have permission, do not render the customization button at all
  if (!canCustomize) {
    return null
  }

  const handleSaveTabSequence = async (updatedTabs) => {
    if (!schema) return
    const updated = {
      ...schema,
      tabs: updatedTabs,
    }

    const ok = await saveFormSchema(entityType, updated)
    if (!ok) {
      throw new Error('Failed to save tab sequence to database.')
    }

    if (onSchemaUpdated) {
      onSchemaUpdated(updated)
    }
  }

  const handleGridColumnsChange = async (colCount) => {
    if (!schema) return
    const updated = {
      ...schema,
      gridColumns: colCount,
      columnsCount: colCount,
    }

    await saveFormSchema(entityType, updated)
    if (onSchemaUpdated) {
      onSchemaUpdated(updated)
    }
  }

  const activeGridCols = Number(schema?.gridColumns || schema?.columnsCount || 2)

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Customization Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(prev => !prev)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer select-none ${
          dropdownOpen
            ? 'border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-600/20'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
        }`}
        title="Page Customization (Super Admin / Admin)"
      >
        <Sliders size={14} className="text-purple-600 shrink-0" />
        <span>Customize</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180 text-purple-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-700">
                <Sparkles size={11} />
                <span>Page Customization</span>
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                What would you like to customize?
              </div>
            </div>
            <span className="text-[10px] font-mono font-black uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
              Admin
            </span>
          </div>

          {/* Action Options */}
          <div className="p-1 space-y-1 mt-1">
            {/* Quick Option: Screen Width Form Columns (1 to 6) */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700">Screen Width Columns</span>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  {activeGridCols} Col{activeGridCols > 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {[1, 2, 3, 4, 5, 6].map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => handleGridColumnsChange(cols)}
                    className={`py-1 text-xs font-mono font-bold rounded-lg transition border cursor-pointer ${
                      activeGridCols === cols
                        ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                    }`}
                    title={`Display form across ${cols} column${cols > 1 ? 's' : ''}`}
                  >
                    {cols}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Controls horizontal field layout density</p>
            </div>

            {/* Option 1: Customize Tabs & Sequence (1, 2, 3) */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false)
                setTabModalOpen(true)
              }}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-purple-50 text-left transition cursor-pointer group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shrink-0 group-hover:bg-purple-200 group-hover:text-purple-800 transition">
                <Sliders size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 flex items-center justify-between">
                  <span>Tabs & 1, 2, 3 Sequence</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-purple-600 transition" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Rename tabs and set display sequence (1st, 2nd, 3rd)
                </div>
              </div>
            </button>

            {/* Option 2: Customize Sections & Columns (Form Studio) */}
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false)
                navigate(`/administration/form-studio?entity=${entityType}`)
              }}
              className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-purple-50 text-left transition cursor-pointer group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 shrink-0 group-hover:bg-indigo-200 group-hover:text-indigo-800 transition">
                <LayoutTemplate size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 flex items-center justify-between">
                  <span>Sections & Columns Studio</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-purple-600 transition" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Add custom fields, drag/reorder, required fields & validations
                </div>
              </div>
            </button>
          </div>

          {/* Footer Info & Access Management Link for Super Admin */}
          <div className="mt-1 pt-2 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Visible to Super Admin & Admin</span>
            </span>
            <Link
              to="/administration/roles"
              onClick={() => setDropdownOpen(false)}
              className="text-purple-600 hover:text-purple-800 font-bold hover:underline"
            >
              Manage Access
            </Link>
          </div>
        </div>
      )}

      {/* Tab Sequence Modal */}
      {schema?.tabs && (
        <TabSequenceModal
          isOpen={tabModalOpen}
          onClose={() => setTabModalOpen(false)}
          tabs={schema.tabs}
          schemaId={schemaId}
          entityType={entityType}
          onSave={handleSaveTabSequence}
        />
      )}
    </div>
  )
}
