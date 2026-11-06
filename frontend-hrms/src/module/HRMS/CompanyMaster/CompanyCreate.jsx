import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createCompany, uploadCompanyLogo } from '../../../api/companies'
import { searchTenants } from '../../../api/tenants'
import { useToast } from '../../../components/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import CompanyForm from './CompanyForm'

export default function CompanyCreate() {
  const tenantFilterStorageKey = 'company_master_tenant_filter'
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tenantOptions, setTenantOptions] = useState([])

  const roleName = String(auth?.user?.role || auth?.user?.Role || '').toLowerCase()
  const isSuperAdmin = roleName === 'superadmin'
  const requestedTenantId = new URLSearchParams(location.search).get('tenantId') || ''

  const fallbackTenant = useMemo(() => ([
    {
      tenantId: auth?.user?.companyId || auth?.user?.CompanyId || '',
      companyName: auth?.user?.companyName || auth?.user?.CompanyName || 'Current Tenant',
    },
  ]), [auth?.user])

  useEffect(() => {
    let cancelled = false

    async function loadTenants() {
      setLoading(true)
      try {
        if (isSuperAdmin) {
          const response = await searchTenants({ status: 'all' })
          const items = response?.items || response?.Items || []
          if (!cancelled) {
            setTenantOptions(items.map(item => ({
              tenantId: item.tenantId || item.TenantId,
              companyName: item.companyName || item.CompanyName,
            })))
          }
        } else if (!cancelled) {
          setTenantOptions(fallbackTenant.filter(item => item.tenantId))
        }
      } catch (error) {
        toast('Failed to load tenant options', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTenants()
    return () => { cancelled = true }
  }, [isSuperAdmin, fallbackTenant, toast])

  async function submit(payload, options = {}) {
    setSaving(true)
    try {
      const response = await createCompany(payload)
      const companyId = response?.id || response?.Id
      if (companyId && options.logoFile) {
        await uploadCompanyLogo(companyId, options.logoFile)
      }
      navigate(`/module/hrms/company-master/view/${companyId}`, { replace: true })
    } catch (error) {
      toast(error?.response?.data?.message || 'Create failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8">
      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading tenant options...</div>}
      {!loading && (
        <CompanyForm
          mode="create"
          title="Create Company"
          subtitle="Capture complete company profile, statutory registrations, banking, and policies required for HRMS, payroll, attendance, and reporting."
          initialValue={{
            tenantId: isSuperAdmin
              ? (requestedTenantId || (() => {
                  try { return window.localStorage.getItem(tenantFilterStorageKey) || '' } catch { return '' }
                })())
              : fallbackTenant[0]?.tenantId || ''
          }}
          saving={saving}
          tenantOptions={tenantOptions}
          canSelectTenant={isSuperAdmin}
          onSubmit={submit}
          onCancel={() => navigate('/module/hrms/company-master')}
        />
      )}
    </div>
  )
}
