import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { LayoutProvider } from '../context/LayoutContext'
import ErrorBoundary from '../components/ErrorBoundary'

function LayoutInner() {
  const location = useLocation()
  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-slate-50/70 overflow-hidden text-slate-800 antialiased selection:bg-purple-600 selection:text-white">
      {/* 1. Enterprise Global Topbar (Full Width Across Top of Screen) */}
      <Topbar />

      {/* 2. Workspace Body (Sidebar + Content Viewport) */}
      <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4.5 lg:p-5 scrollbar-thin bg-slate-50/60"
        >
          <div className="w-full max-w-full mx-auto pb-10">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <LayoutProvider>
      <LayoutInner />
    </LayoutProvider>
  )
}
