import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import { navigationGroups } from './navigation'
import logoImg from '../assets/logo.png'
import {
  X,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export default function Sidebar() {
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, closeMobileMenu } = useLayout()

  const roles = React.useMemo(() => {
    const list = auth?.user?.roles || auth?.user?.Roles
    if (Array.isArray(list) && list.length > 0) {
      return list.map(r => String(r).toLowerCase().trim())
    }
    const single = auth?.user?.roleName || auth?.user?.role || auth?.user?.Role || ''
    if (single) {
      return [String(single).toLowerCase().trim()]
    }
    return ['administrator']
  }, [auth?.user])
  const roleName = auth?.user?.roleName || auth?.user?.role || auth?.user?.Role || (roles.length > 0 ? (roles[0].charAt(0).toUpperCase() + roles[0].slice(1)) : 'Administrator')


  const isSuperAdmin = Boolean(
    auth?.user?.isSystemAdmin ||
    roles.some(r => r.includes('superadmin') || r === 'systemadmin')
  )

  const isAdmin = Boolean(
    isSuperAdmin ||
    roles.length === 0 ||
    roles.some(r => r.includes('admin') || r.includes('manager') || r.includes('hr') || r.includes('lead'))
  )

  // Dynamic database-driven allowed pages from backend API (/auth/me or user session)
  const allowedPages = React.useMemo(() => {
    const list = auth?.user?.allowedPages || auth?.user?.AllowedPages || []
    return Array.isArray(list) ? list.map(p => String(p).toLowerCase().trim()) : []
  }, [auth?.user])

  const hasPageAccess = (permission, superAdminOnly) => {
    if (isSuperAdmin) return true
    if (superAdminOnly) return false
    if (isAdmin) return true
    if (!permission) return true
    if (!allowedPages || allowedPages.length === 0) return true
    if (allowedPages.includes('*')) return true
    return allowedPages.includes(String(permission).toLowerCase().trim())
  }

  // Submenu accordion state
  const [openSubmenus, setOpenSubmenus] = useState({})

  // Automatically expand parent submenu if user is on any child route
  useEffect(() => {
    const currentPath = location.pathname.toLowerCase()
    navigationGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children) {
          const isChildActive = item.children.some(c =>
            currentPath === c.path.toLowerCase() || currentPath.startsWith(`${c.path.toLowerCase()}/`)
          )
          if (isChildActive) {
            setOpenSubmenus(prev => ({ ...prev, [item.label]: true }))
          }
        }
      })
    })
  }, [location.pathname])

  const toggleSubmenu = (label) => {
    if (sidebarCollapsed) {
      toggleSidebar()
    }
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const filteredGroups = React.useMemo(() => {
    return navigationGroups
      .filter(group => !group.superAdminOnly || isSuperAdmin)
      .map(group => ({
        ...group,
        items: group.items
          .filter(item => hasPageAccess(item.permission, item.superAdminOnly))
          .map(item => {
            if (item.children) {
              return {
                ...item,
                children: item.children.filter(child => hasPageAccess(child.permission, child.superAdminOnly))
              }
            }
            return item
          })
      }))
      .filter(group => group.items.length > 0)
  }, [isSuperAdmin, isAdmin, allowedPages, auth?.user])

  const handleLogout = () => {
    auth?.logout?.()
    navigate('/login')
  }

  const renderNavLinks = (isMobile = false) => (
    <div className="flex flex-col gap-4 py-2">
      {filteredGroups.map((group, groupIdx) => (
        <div key={group.title || groupIdx} className="space-y-0.5">
          {(!sidebarCollapsed || isMobile) && group.title && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
              {group.title}
            </div>
          )}

          <div className="space-y-0.5">
            {group.items.map(item => {
              const Icon = item.icon
              const p = location.pathname

              // Handle items with children (collapsible submenus)
              if (item.children && item.children.length > 0) {
                const isAnyChildActive = item.children.some(c =>
                  p === c.path || (c.path !== '/' && p.startsWith(`${c.path}/`))
                )
                const isOpen = openSubmenus[item.label] ?? isAnyChildActive

                return (
                  <div key={item.label} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(item.label)}
                      title={sidebarCollapsed && !isMobile ? item.label : undefined}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
                        isAnyChildActive
                          ? 'bg-purple-50/70 text-purple-950 font-bold'
                          : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                      } ${sidebarCollapsed && !isMobile ? 'justify-center px-1.5' : ''}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                          isAnyChildActive
                            ? 'bg-purple-700 text-white shadow-xs'
                            : 'text-slate-500 group-hover:text-purple-700 group-hover:bg-purple-50'
                        }`}
                      >
                        <Icon size={15} />
                      </span>

                      {(!sidebarCollapsed || isMobile) && (
                        <>
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 border border-slate-200">
                              {item.badge}
                            </span>
                          )}
                          <span className="text-slate-400 group-hover:text-slate-600 transition">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Collapsible Children Submenu */}
                    {isOpen && (!sidebarCollapsed || isMobile) && (
                      <div className="ml-5 pl-2.5 border-l-2 border-purple-100 space-y-0.5 mt-0.5 mb-1.5 animate-fadeIn">
                        {item.children.map(child => {
                          const ChildIcon = child.icon
                          const isChildActive = p === child.path || (child.path !== '/' && p.startsWith(`${child.path}/`))
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              onClick={() => {
                                if (isMobile) closeMobileMenu()
                              }}
                              className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all ${
                                isChildActive
                                  ? 'bg-purple-100/80 text-purple-950 font-bold shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                              }`}
                            >
                              {isChildActive && (
                                <span className="absolute -left-[11px] top-1.5 bottom-1.5 w-1 rounded-r-full bg-purple-700" />
                              )}
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                                  isChildActive
                                    ? 'bg-purple-700 text-white shadow-2xs'
                                    : 'text-slate-400 group-hover:text-purple-700'
                                }`}
                              >
                                <ChildIcon size={12} />
                              </span>
                              <span className="truncate flex-1">{child.label}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              // Standard Item without children
              const isDashboard = (item.path === '/dashboard' || item.path === '/') && (p === '/' || p === '/dashboard' || p === '/home')
              const isSetup = item.path === '/module/hrms/setup' && (
                p.startsWith('/module/hrms/setup') ||
                p.startsWith('/module/hrms/company-setup')
              )
              const isItemActive = isDashboard || isSetup || (
                item.exact
                  ? p === item.path
                  : p === item.path || (item.path !== '/' && p.startsWith(`${item.path}/`))
              )

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (isMobile) closeMobileMenu()
                  }}
                  title={sidebarCollapsed && !isMobile ? item.label : undefined}
                  className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 ${
                    isItemActive
                      ? 'bg-purple-50 text-purple-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                  } ${sidebarCollapsed && !isMobile ? 'justify-center px-1.5' : ''}`}
                >
                  {/* Left Active Indicator Bar */}
                  {isItemActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-purple-700" />
                  )}

                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                      isItemActive
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'text-slate-500 group-hover:text-purple-700 group-hover:bg-purple-50'
                    }`}
                  >
                    <Icon size={15} />
                  </span>

                  {(!sidebarCollapsed || isMobile) && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR (FULL HEIGHT)                          */}
      {/* ========================================================= */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-200/90 bg-white transition-all duration-200 select-none ${
          sidebarCollapsed ? 'w-[68px]' : 'w-[250px]'
        }`}
      >
        {/* Navigation scroll area */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-thin">
          {renderNavLinks(false)}
        </div>

        {/* Bottom User Profile & Logout Area */}
        <div className="border-t border-slate-200/90 p-2.5 bg-slate-50/60 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <NavLink
                to="/profile"
                className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition"
                title="View Profile"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
                  {(auth?.user?.fullName || auth?.user?.name || 'HR Manager').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'EA'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {auth?.user?.fullName || auth?.user?.name || 'HR Manager'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {roleName || 'Administrator'}
                  </div>
                </div>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign out of HRMS"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition cursor-pointer shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out of HRMS"
              className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE SLIDE-OVER DRAWER                               */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
          />

          {/* Drawer Menu */}
          <div className="fixed inset-y-0 left-0 w-[270px] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white">
              <Link to="/dashboard" onClick={closeMobileMenu} className="flex items-center">
                <img
                  src={logoImg}
                  alt="Uabindia HRMS"
                  className="h-7 w-auto object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable nav links */}
            <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
              {renderNavLinks(true)}
            </div>

            {/* Mobile Footer with User & Logout */}
            <div className="border-t border-slate-200 p-3 bg-slate-50 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {auth?.user?.fullName || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {roleName || 'Administrator'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  closeMobileMenu()
                  handleLogout()
                }}
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 py-1 px-2 rounded-lg border border-rose-200 bg-rose-50/50 cursor-pointer"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
