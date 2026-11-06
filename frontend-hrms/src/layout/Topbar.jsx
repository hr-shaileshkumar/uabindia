import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLayout } from '../context/LayoutContext'
import { navigationGroups } from './navigation'
import logoImg from '../assets/logo.png'
import { APP_RELEASE_LABEL, APP_BUILD_FULL, APP_FULL_NAME, BUILD_TIME } from '../config/version'
import { getCurrentBranding, brandingLogoUrl } from '../api/branding'
import { searchTenants } from '../api/tenants'
import { listCompanies } from '../api/companies'
import { listProjects } from '../api/projects'
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Building2,
  FolderKanban,
  ShieldCheck,
  RefreshCw,
  Bell,
  User,
  LogOut,
  ChevronDown,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  KeyRound
} from 'lucide-react'
import AppLauncher from '../components/AppLauncher'
import ApprovalInbox from '../components/ApprovalInbox'
import UniversalCommandPalette from '../components/UniversalCommandPalette'

export default function Topbar() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useLayout()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -------------------------------------------------------------
  // 1. Branding & Logo (Assets fallback + Tenant dynamic logo)
  // -------------------------------------------------------------
  const [branding, setBranding] = useState(null)
  useEffect(() => {
    let mounted = true
    const loadBranding = () => {
      getCurrentBranding()
        .then(res => {
          if (mounted && res) setBranding(res)
        })
        .catch(() => {})
    }
    loadBranding()
    window.addEventListener('app:branding-updated', loadBranding)
    return () => {
      mounted = false
      window.removeEventListener('app:branding-updated', loadBranding)
    }
  }, [])

  const currentLogoUrl = useMemo(() => {
    return brandingLogoUrl(branding) || logoImg
  }, [branding])

  const tenantDisplayName = branding?.companyName || 'Uabindia HRMS'

  // -------------------------------------------------------------
  // 2. Role & SuperAdmin Check
  // -------------------------------------------------------------
  const roleName = auth?.user?.roleName || auth?.user?.role || auth?.user?.Role || ''
  const isSuperAdmin = String(roleName).toLowerCase() === 'superadmin'

  // -------------------------------------------------------------
  // 3. SuperAdmin Tenant Dropdown State
  // -------------------------------------------------------------
  const [tenants, setTenants] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState(
    () => localStorage.getItem('sel_tenant_id') || ''
  )
  const [tenantsLoading, setTenantsLoading] = useState(false)

  useEffect(() => {
    if (isSuperAdmin) {
      setTenantsLoading(true)
      searchTenants({ status: 'active' })
        .then(res => {
          const list = Array.isArray(res) ? res : res?.items || []
          setTenants(list)
        })
        .catch(() => setTenants([]))
        .finally(() => setTenantsLoading(false))
    }
  }, [isSuperAdmin])

  const handleTenantChange = (tenantId) => {
    setSelectedTenantId(tenantId)
    if (tenantId) {
      localStorage.setItem('sel_tenant_id', tenantId)
    } else {
      localStorage.removeItem('sel_tenant_id')
    }
    // Also reset company and project when tenant changes
    localStorage.removeItem('sel_company_id')
    localStorage.setItem('sel_company', 'All Companies')
    localStorage.removeItem('sel_project_id')
    localStorage.setItem('sel_project', 'All Projects')
    window.dispatchEvent(new CustomEvent('app:context-changed', {
      detail: { tenantId, companyId: null, companyName: 'All Companies', projectId: null, projectName: 'All Projects' }
    }))
    window.location.reload()
  }

  // -------------------------------------------------------------
  // 4. Regular User Company & Project Dropdowns State
  // -------------------------------------------------------------
  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(
    () => localStorage.getItem('sel_company_id') || ''
  )
  const [selectedCompanyName, setSelectedCompanyName] = useState(
    () => localStorage.getItem('sel_company') || 'All Companies'
  )
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => localStorage.getItem('sel_project_id') || ''
  )
  const [selectedProjectName, setSelectedProjectName] = useState(
    () => localStorage.getItem('sel_project') || 'All Projects'
  )

  useEffect(() => {
    const handleContextChange = () => {
      setSelectedTenantId(localStorage.getItem('sel_tenant_id') || '')
      setSelectedCompanyId(localStorage.getItem('sel_company_id') || '')
      setSelectedCompanyName(localStorage.getItem('sel_company') || 'All Companies')
      setSelectedProjectId(localStorage.getItem('sel_project_id') || '')
      setSelectedProjectName(localStorage.getItem('sel_project') || 'All Projects')
    }
    window.addEventListener('app:context-changed', handleContextChange)
    return () => window.removeEventListener('app:context-changed', handleContextChange)
  }, [])

  // Load Companies with fallback
  useEffect(() => {
    let isMounted = true
    const fetchCompanies = async () => {
      try {
        const res = await listCompanies({ status: 'active' })
        const list = Array.isArray(res) ? res : (res?.items || res?.companies || res?.records || res?.data || [])
        if (list.length > 0 && isMounted) {
          setCompanies(list)
          return
        }
      } catch (err) {
        // Retry without status filter in case backend enum differed
      }
      try {
        const resAll = await listCompanies()
        const listAll = Array.isArray(resAll) ? resAll : (resAll?.items || resAll?.companies || resAll?.records || resAll?.data || [])
        if (isMounted) setCompanies(listAll)
      } catch {
        if (isMounted) setCompanies([])
      }
    }
    fetchCompanies()
    return () => { isMounted = false }
  }, [selectedTenantId])

  // Load Projects based on selected company
  useEffect(() => {
    const params = { status: 'active' }
    if (selectedCompanyId) params.companyId = selectedCompanyId
    listProjects(params)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.projects || res?.items || res?.records || res?.data || [])
        setProjects(list)
      })
      .catch(() => setProjects([]))
  }, [selectedCompanyId, selectedTenantId])

  const handleCompanyChange = (cId) => {
    setSelectedCompanyId(cId)
    const found = companies.find(c => String(c.companyId || c.id || c.CompanyId) === String(cId))
    const cName = found ? (found.companyName || found.CompanyName || found.name) : 'All Companies'
    setSelectedCompanyName(cName)
    if (cId) {
      localStorage.setItem('sel_company_id', cId)
      localStorage.setItem('sel_company', cName)
    } else {
      localStorage.removeItem('sel_company_id')
      localStorage.setItem('sel_company', 'All Companies')
    }
    // Reset project
    setSelectedProjectId('')
    setSelectedProjectName('All Projects')
    localStorage.removeItem('sel_project_id')
    localStorage.setItem('sel_project', 'All Projects')

    window.dispatchEvent(new CustomEvent('app:context-changed', {
      detail: { companyId: cId || null, companyName: cName, projectId: null, projectName: 'All Projects' }
    }))
  }

  const handleProjectChange = (pId) => {
    setSelectedProjectId(pId)
    const found = projects.find(p => String(p.projectId || p.id || p.ProjectId) === String(pId))
    const pName = found ? (found.projectName || found.ProjectName || found.title || found.name) : 'All Projects'
    setSelectedProjectName(pName)
    if (pId) {
      localStorage.setItem('sel_project_id', pId)
      localStorage.setItem('sel_project', pName)
    } else {
      localStorage.removeItem('sel_project_id')
      localStorage.setItem('sel_project', 'All Projects')
    }

    window.dispatchEvent(new CustomEvent('app:context-changed', {
      detail: { projectId: pId || null, projectName: pName }
    }))
  }

  // -------------------------------------------------------------
  // 5. Global Search Box (Normal Pages Search)
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)

  // Flatten all navigation items into a searchable array
  const allSearchablePages = useMemo(() => {
    const list = []
    navigationGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children.forEach(child => {
            list.push({
              title: child.label,
              path: child.path,
              category: group.title || item.label,
              icon: child.icon || item.icon
            })
          })
        } else {
          list.push({
            title: item.label,
            path: item.path,
            category: group.title || 'General',
            icon: item.icon
          })
        }
      })
    })
    return list
  }, [])

  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return allSearchablePages
      .filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 7)
  }, [searchQuery, allSearchablePages])

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // -------------------------------------------------------------
  // 6. Global Refresh Button
  // -------------------------------------------------------------
  const [refreshing, setRefreshing] = useState(false)
  const handleGlobalRefresh = () => {
    setRefreshing(true)
    window.dispatchEvent(new CustomEvent('app:refresh-data'))
    window.dispatchEvent(new CustomEvent('hrms:metadata-updated', { detail: { force: true } }))
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  // -------------------------------------------------------------
  // 7. Notifications Dropdown
  // -------------------------------------------------------------
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const notificationRef = useRef(null)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Annual Appraisal Cycle Active',
      subtext: 'Performance evaluations open for submit.',
      time: '10m ago',
      type: 'info',
      unread: true
    },
    {
      id: 2,
      title: 'Leave Application Pending',
      subtext: 'Priya Sharma requested 3 days Casual Leave.',
      time: '1h ago',
      type: 'warning',
      unread: true
    },
    {
      id: 3,
      title: 'Metadata Layout Synced',
      subtext: 'Database UI tables aligned with SQL Server.',
      time: '2h ago',
      type: 'success',
      unread: false
    }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  useEffect(() => {
    const handleClose = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClose)
    return () => document.removeEventListener('mousedown', handleClose)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  // -------------------------------------------------------------
  // 8. User Profile Dropdown
  // -------------------------------------------------------------
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleClose = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClose)
    return () => document.removeEventListener('mousedown', handleClose)
  }, [])

  const userName = auth?.user?.fullName || auth?.user?.name || 'Administrator'
  const userEmail = auth?.user?.email || auth?.user?.username || 'admin@uabindia.in'
  const userInitials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD'

  const handleLogout = async () => {
    try {
      if (auth?.logout) await auth.logout()
    } catch {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/login'
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100/90 bg-white/90 backdrop-blur-md px-3 sm:px-5 py-2 select-none shadow-2xs">
      <div className="flex items-center justify-between gap-4 max-w-full">
        {/* ========================================================= */}
        {/* LEFT SECTION: Sidebar Toggle + Pure Logo (No text chip)   */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3 shrink-0 min-w-[160px]">
          {/* Borderless Ghost Sidebar Toggle Button */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          {/* Clean Logo Only (Tenant dynamic logo with Assets fallback, no text chip) */}
          <Link
            to="/dashboard"
            className="flex items-center group transition"
            title="Dashboard"
          >
            <div className="flex items-center justify-center h-8 w-auto max-w-[150px] overflow-hidden">
              <img
                src={currentLogoUrl}
                alt="Uabindia HRMS"
                className="h-7 sm:h-8 w-auto object-contain object-left group-hover:opacity-90 transition"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = logoImg
                }}
              />
            </div>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* CENTER SECTION: Search Box (Positioned in the Middle)     */}
        {/* ========================================================= */}
        <div className="flex-1 flex justify-center max-w-xl mx-2">
          <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                id="topbar-search-input"
                name="topbarSearch"
                type="text"
                onClick={() => setCommandPaletteOpen(true)}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSearchFocused(true)
                }}
                onFocus={() => setSearchFocused(true)}
                placeholder="Search pages & modules..."
                className="w-full pl-9 pr-9 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/25 transition shadow-2xs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="hidden sm:inline-flex absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white/80 rounded border border-slate-200/60 shadow-2xs">
                  ⌘K
                </span>
              )}
            </div>

            {/* Centered Search Dropdown Results */}
            {searchFocused && filteredSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pages & Navigation
                </div>
                <div className="space-y-0.5">
                  {filteredSearchResults.map(item => {
                    const Icon = item.icon || Layers
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          navigate(item.path)
                          setSearchFocused(false)
                          setSearchQuery('')
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-purple-50/80 hover:text-purple-900 transition cursor-pointer text-xs group"
                      >
                        <div className="h-6 w-6 rounded-lg bg-slate-100 group-hover:bg-purple-100 group-hover:text-purple-700 text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                          <Icon size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 group-hover:text-purple-950 truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{item.category}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SECTION: Features without borders or background colors */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. SuperAdmin Tenant Dropdown (Clean Transparent) */}
          {isSuperAdmin && (
            <div className="hidden md:flex items-center gap-1.5 hover:bg-slate-50 px-2 py-1 rounded-lg text-xs transition">
              <ShieldCheck size={13} className="text-amber-700 shrink-0" />
              <select id="topbar-tenant-select" name="tenantId" value={selectedTenantId} onChange={e => handleTenantChange(e.target.value)}
                disabled={tenantsLoading}
                className="bg-transparent text-amber-900 font-bold text-xs border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer max-w-[130px] truncate"
                title="SuperAdmin Tenant Switcher"
              >
                <option value="">All Tenants</option>
                {tenants.map((t, idx) => {
                  const val = t.id || t.tenantId || t.TenantId || ''
                  return (
                    <option key={val || `tenant-${idx}`} value={val}>
                      {t.companyName || t.CompanyName || t.name || 'Unnamed Tenant'}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          {/* 2. Company Dropdown (Clean Transparent) */}
          <div className="hidden lg:flex items-center gap-1.5 hover:bg-slate-50 px-2 py-1 rounded-lg text-xs transition">
            <Building2 size={13} className="text-purple-700 shrink-0" />
            <select id="topbar-company-select" name="companyId" value={selectedCompanyId} onChange={e => handleCompanyChange(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-xs border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer max-w-[120px] truncate"
              title="Select Corporate Entity"
            >
              <option value="">All Companies</option>
              {companies.map((c, idx) => {
                const val = c.id || c.companyId || c.CompanyId || ''
                return (
                  <option key={val || `company-${idx}`} value={val}>
                    {c.companyName || c.CompanyName || c.name || 'Unnamed Company'}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 3. Project Dropdown (Clean Transparent) */}
          <div className="hidden xl:flex items-center gap-1.5 hover:bg-slate-50 px-2 py-1 rounded-lg text-xs transition">
            <FolderKanban size={13} className="text-blue-700 shrink-0" />
            <select id="topbar-project-select" name="projectId" value={selectedProjectId} onChange={e => handleProjectChange(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-xs border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer max-w-[110px] truncate"
              title="Select Assigned Project"
            >
              <option value="">All Projects</option>
              {projects.map((p, idx) => {
                const val = p.id || p.projectId || p.ProjectId || ''
                return (
                  <option key={val || `project-${idx}`} value={val}>
                    {p.projectName || p.ProjectName || p.title || p.name || 'Unnamed Project'}
                  </option>
                )
              })}
            </select>
          </div>

          {/* 4. Software Version (Automated Enterprise SemVer) */}
          <div
            className="hidden sm:inline-flex items-center px-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition cursor-help"
            title={`${APP_FULL_NAME} ${APP_BUILD_FULL} • Build date: ${new Date(BUILD_TIME).toLocaleDateString()}`}
          >
            {APP_RELEASE_LABEL}
          </div>

          {/* Vertical Separator */}
          <div className="hidden sm:block h-4 w-[1px] bg-slate-200/70 mx-0.5" />

          {/* 5. Global Refresh Button (Borderless Ghost) */}
          <button
            type="button"
            onClick={handleGlobalRefresh}
            disabled={refreshing}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            title="Refresh current page data"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-purple-600' : ''} />
          </button>

          {/* One-Inbox Unified Approvals */}
          <ApprovalInbox />

          {/* Google / Microsoft Style 9-Dots App Launcher */}
          <AppLauncher />

          {/* 6. Notification Icon with Dropdown (Borderless Ghost) */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer active:scale-95"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute 1 top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Notifications</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
                      {unreadCount} New
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[10px] font-bold text-purple-700 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto scrollbar-thin mt-1">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-2 rounded-xl transition ${
                        n.unread ? 'bg-purple-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{n.subtext}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. Profile Icon with Dropdown Menu (Borderless Clean Avatar) */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              title={`Profile: ${userName}`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-extrabold text-[11px] shadow-2xs">
                {userInitials}
              </div>
              <ChevronDown size={11} className="text-slate-400 hidden sm:inline" />
            </button>

            {/* Profile Popover */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-900 truncate">{userName}</div>
                  <div className="text-[10.5px] text-slate-500 truncate">{userEmail}</div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-800">
                      {roleName || 'Administrator'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 truncate max-w-[100px]">
                      {selectedCompanyName}
                    </span>
                  </div>
                </div>

                <div className="py-1 space-y-0.5 text-xs font-medium">
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                  >
                    <User size={13} className="text-slate-500" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    to="/change-password"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                  >
                    <KeyRound size={13} className="text-slate-500" />
                    <span>Change Password</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-700 transition cursor-pointer font-bold"
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Universal Command Palette (Ctrl + K) */}
      <UniversalCommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </header>
  )
}

