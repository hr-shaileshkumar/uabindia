import React from 'react'
import { resolveIcon } from '../registry'
import { useAuth } from '../../context/AuthContext'
import { checkUserPermission } from './MetadataPermissionGuard'

export default function MetadataTabRenderer({
  tabs = [],
  activeTabId,
  onTabChange,
  badges = {},
  className = '',
}) {
  const auth = useAuth()

  // Filter tabs by role / permission
  const visibleTabs = tabs.filter((tab) => {
    return checkUserPermission(auth?.user, {
      requiredRole: tab.requiredRole,
      restrictedRole: tab.restrictedRole,
      requiredPermission: tab.permission,
    })
  })

  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-thin select-none ${className}`}>
      {visibleTabs.map((tab) => {
        const IconComponent = resolveIcon(tab.icon)
        const isSelected = activeTabId === tab.id
        const badgeCount = badges[tab.id]

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange && onTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              isSelected
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {IconComponent && (
              <IconComponent
                size={14}
                className={isSelected ? 'text-white' : 'text-slate-400'}
              />
            )}
            <span>{tab.label || tab.title}</span>

            {badgeCount !== undefined && badgeCount !== null && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {badgeCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
