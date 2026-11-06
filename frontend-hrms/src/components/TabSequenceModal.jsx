import React, { useState, useEffect } from 'react'
import {
  X,
  Sliders,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Tag,
  Hash,
} from 'lucide-react'
import { resolveIcon } from '../engine/registry'

const ICON_OPTIONS = [
  'User',
  'Building2',
  'Briefcase',
  'Phone',
  'CreditCard',
  'Landmark',
  'GraduationCap',
  'History',
  'Sparkles',
  'Clock',
  'CalendarDays',
  'FileCheck2',
  'Laptop',
  'Award',
  'ShieldCheck',
  'Settings2',
]

export default function TabSequenceModal({
  isOpen,
  onClose,
  tabs = [],
  schemaId = 'employee_form',
  entityType = 'employee',
  onSave,
}) {
  const [tabList, setTabList] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Sync tabs on open
  useEffect(() => {
    if (isOpen) {
      setTabList(
        tabs.map(t => ({
          ...t,
          label: t.label || t.title || 'Tab',
          title: t.title || t.label || 'Tab',
          icon: t.icon || 'User',
        }))
      )
      setError('')
      setSuccess(false)
    }
  }, [isOpen, tabs])

  if (!isOpen) return null

  // Rename a tab
  const handleRename = (tabId, newName) => {
    setTabList(prev =>
      prev.map(t => {
        if (t.id === tabId) {
          return { ...t, label: newName, title: newName }
        }
        return t
      })
    )
  }

  // Change icon
  const handleIconChange = (tabId, newIcon) => {
    setTabList(prev =>
      prev.map(t => {
        if (t.id === tabId) {
          return { ...t, icon: newIcon }
        }
        return t
      })
    )
  }

  // Move tab up or down by 1 position
  const handleMove = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= tabList.length) return
    const updated = [...tabList]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp
    setTabList(updated)
  }

  // Move tab to specific sequence position (1-based index)
  const handleJumpSequence = (index, targetSequence) => {
    const targetIdx = targetSequence - 1
    if (targetIdx < 0 || targetIdx >= tabList.length || targetIdx === index) return
    const updated = [...tabList]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIdx, 0, moved)
    setTabList(updated)
  }

  // Reset to original passed tabs
  const handleReset = () => {
    setTabList(
      tabs.map(t => ({
        ...t,
        label: t.label || t.title || 'Tab',
        title: t.title || t.label || 'Tab',
        icon: t.icon || 'User',
      }))
    )
    setError('')
  }

  // Save changes
  const handleSave = async () => {
    // Validation
    const emptyTab = tabList.find(t => !String(t.label || '').trim())
    if (emptyTab) {
      setError('Tab name cannot be empty.')
      return
    }

    try {
      setSaving(true)
      setError('')
      if (onSave) {
        await onSave(tabList)
      }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 900)
    } catch (err) {
      setError(err?.message || 'Failed to save tab sequence.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-white shadow-xs">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Customize Tabs & Sequence
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Rename tabs and define the 1, 2, 3 sequence for display order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live Sequence Ribbon */}
        <div className="px-4 sm:px-5 py-2.5 bg-purple-50/50 border-b border-purple-100/80 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap">
            <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md mr-1">
              Live Sequence:
            </span>
            {tabList.map((t, idx) => (
              <React.Fragment key={t.id}>
                {idx > 0 && <span className="text-slate-300">→</span>}
                <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-purple-200/60 shadow-2xs font-bold text-slate-800">
                  <span className="font-mono text-purple-700 text-[10px]">#{idx + 1}</span>
                  <span>{t.label || t.title}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-4 sm:mx-5 mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-4 sm:mx-5 mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Tab sequence and names updated successfully!</span>
          </div>
        )}

        {/* Tab Items List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {tabList.map((tab, idx) => {
            const IconComp = resolveIcon(tab.icon)
            return (
              <div
                key={tab.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition shadow-2xs"
              >
                {/* Left: Sequence Selector & Icon */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 bg-white border border-purple-200 text-purple-800 px-2 py-1 rounded-xl shadow-2xs">
                    <Hash size={12} className="text-purple-600" />
                    <select
                      value={idx + 1}
                      onChange={(e) => handleJumpSequence(idx, Number(e.target.value))}
                      className="text-xs font-bold bg-transparent cursor-pointer outline-none font-mono"
                      title="Set sequence order number (1, 2, 3...)"
                    >
                      {tabList.map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-purple-700 shadow-2xs shrink-0">
                    {IconComp ? <IconComp size={15} /> : <Tag size={14} />}
                  </div>

                  {/* Tab Icon Picker Dropdown */}
                  <select
                    value={tab.icon || 'User'}
                    onChange={(e) => handleIconChange(tab.id, e.target.value)}
                    className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-2 py-1.5 cursor-pointer outline-none focus:border-purple-600"
                    title="Change tab icon"
                  >
                    {ICON_OPTIONS.map(iconName => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Center: Rename Input */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={tab.label || tab.title || ''}
                    onChange={(e) => handleRename(tab.id, e.target.value)}
                    placeholder="Enter tab display name"
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition shadow-2xs"
                  />
                </div>

                {/* Right: Move Up / Down Buttons */}
                <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition shadow-2xs cursor-pointer"
                    title="Move Up in sequence"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === tabList.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-purple-700 hover:bg-purple-50 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition shadow-2xs cursor-pointer"
                    title="Move Down in sequence"
                  >
                    <ArrowDown size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Save size={14} className={saving ? 'animate-spin' : ''} />
              <span>{saving ? 'Saving...' : 'Save & Apply Sequence'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
