import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getCompany, updateCompany, uploadCompanyLogo } from '../../../api/companies'
import { searchTenants } from '../../../api/tenants'
import { useToast } from '../../../components/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import CompanyForm from './CompanyForm'

export default function CompanyEdit() {
  const tenantFilterStorageKey = 'company_master_tenant_filter'
  const { id } = useParams()
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [company, setCompany] = useState(null)
  const [tenantOptions, setTenantOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

    async function load() {
      setLoading(true)
      try {
        const companyResponse = await getCompany(id)
        if (!cancelled) setCompany(companyResponse)

        if (isSuperAdmin) {
          const tenantResponse = await searchTenants({ status: 'all' })
          const items = tenantResponse?.items || tenantResponse?.Items || []
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
        toast(error?.response?.data?.message || 'Failed to load company', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, isSuperAdmin, fallbackTenant, toast])

  async function submit(payload, options = {}) {
    setSaving(true)
    try {
      await updateCompany(id, payload)
      if (options.logoFile) {
        await uploadCompanyLogo(id, options.logoFile)
      }
      navigate(`/module/hrms/company-master/view/${id}`, { replace: true })
    } catch (error) {
      toast(error?.response?.data?.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 antialiased pb-8">
      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading company...</div>}
      {!loading && company && (
        <CompanyForm
          mode="edit"
          title="Edit Company"
          subtitle="Update company profile, statutory compliance, banking, and HRMS policies."
          initialValue={{
            ...company,
            tenantId:
              company?.tenantId
              || company?.TenantId
              || requestedTenantId
              || (() => {
                try { return window.localStorage.getItem(tenantFilterStorageKey) || '' } catch { return '' }
              })()
          }}
          saving={saving}
          tenantOptions={tenantOptions}
          canSelectTenant={isSuperAdmin}
          onSubmit={submit}
          onCancel={() => navigate(`/module/hrms/company-master/view/${id}`)}
        />
      )}
    </div>
  )
}
