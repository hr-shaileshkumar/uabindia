import React, { createContext, useContext, useState, useEffect } from 'react'

const LayoutContext = createContext({
  sidebarCollapsed: false,
  toggleSidebar: () => {},
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
  closeMobileMenu: () => {}
})

export function LayoutProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('uabindia_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileMenuOpen(prev => !prev)
    } else {
      setSidebarCollapsed(prev => {
        const next = !prev
        try {
          localStorage.setItem('uabindia_sidebar_collapsed', String(next))
        } catch {}
        return next
      })
    }
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  // Auto-close mobile drawer on route change or screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <LayoutContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        mobileMenuOpen,
        setMobileMenuOpen,
        closeMobileMenu
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  return useContext(LayoutContext)
}
