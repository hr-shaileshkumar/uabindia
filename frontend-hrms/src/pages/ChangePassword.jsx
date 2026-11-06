import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getCurrentBranding } from '../api/branding'
import { Button, Input, Card } from '../components/ui'
import {
  KeyRound,
  Lock,
  User,
  CheckCircle2,
  Check,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'

export default function ChangePassword() {
  const auth = useAuth()
  const navigate = useNavigate()

  const defaultUser = auth?.user?.userId || auth?.user?.UserName || auth?.user?.mobileNumber || ''
  const [userId, setUserId] = useState(defaultUser)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (defaultUser) setUserId(defaultUser)
  }, [defaultUser])

  const handleChange = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!userId.trim()) return setError('Please enter your User ID or Mobile number')
    if (!oldPassword.trim()) return setError('Please enter your current password')
    if (!newPassword || newPassword.length < 6)
      return setError('New password must be at least 6 characters long')
    if (newPassword !== confirmPassword)
      return setError('New password and confirm password do not match')

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        userId: userId.trim(),
        currentPassword: oldPassword,
        oldPassword,
        newPassword,
      })

      setSuccess('Password updated successfully!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        if (auth?.isAuthenticated) {
          navigate('/profile')
        } else {
          navigate('/login')
        }
      }, 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'Change password failed. Please check current password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4 antialiased pb-8 w-full">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-2xs">
            <KeyRound size={17} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Change Account Password
            </h1>
            <p className="text-xs text-slate-500">
              Update your security credentials for portal access
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 animate-in fade-in duration-150">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleChange} className="space-y-4">
          <Input
            label="User ID or Mobile Number"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID or Mobile"
            icon={User}
            required
          />

          <Input
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter current password"
            icon={Lock}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              icon={Lock}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              icon={Lock}
              required
            />
          </div>

          {/* Validation Checklist */}
          <div className="rounded-xl bg-slate-50/80 p-3.5 space-y-2 text-xs text-slate-600 border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  newPassword.length >= 6
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                ✓
              </span>
              <span>Minimum 6 characters long</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  confirmPassword && newPassword === confirmPassword
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                ✓
              </span>
              <span>New password and confirmation match</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate(-1)}
              icon={ArrowLeft}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={Check}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
