import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { brandingLogoUrl, getCurrentBranding } from '../api/branding'
import { Button, Input, Card } from '../components/ui'
import {
  Phone,
  KeyRound,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export default function ResetPassword() {
  const [mobile, setMobile] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [branding, setBranding] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentBranding().then(setBranding).catch(() => setBranding(null))
  }, [])

  const cleanDigits = (val) => val.replace(/\D/g, '')

  const sendOtp = async () => {
    setError(null)
    setSuccess(null)

    const digits = cleanDigits(mobile)
    if (!digits || digits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    try {
      const payloadMobile = digits.length > 10 ? digits.slice(-10) : digits
      const res = await api.post('/auth/generate-otp', {
        mobileNumber: payloadMobile,
      })

      setOtpSent(true)
      setSuccess('Verification code sent! Please check your mobile or backend logs.')
      if (res?.data?.otpCode) {
        setOtp(res.data.otpCode)
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError(null)

    if (!otpSent) {
      await sendOtp()
      return
    }

    if (!otp.trim()) return setError('Enter the 6-digit OTP code')
    if (!newPassword || newPassword.length < 6)
      return setError('Password must be at least 6 characters long')
    if (newPassword !== confirmPassword)
      return setError('Passwords do not match')

    setLoading(true)
    try {
      const digits = cleanDigits(mobile)
      const payloadMobile = digits.length > 10 ? digits.slice(-10) : digits

      await api.post('/auth/reset-password', {
        userId: payloadMobile,
        mobileNumber: payloadMobile,
        otpCode: otp.trim(),
        newPassword,
      })

      setSuccess('Password updated successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed. Check OTP and try again.')
    } finally {
      setLoading(false)
    }
  }

  const logoSrc = brandingLogoUrl(branding)

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-50 antialiased selection:bg-purple-600 selection:text-white">
      <div className="w-full max-w-md my-auto py-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt="Uabindia HRMS Logo"
                className="h-10 w-auto mx-auto mb-3 object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-rose-600 to-orange-500 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-600/20">
                B
              </div>
            )}
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Reset Your Password
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Verify your mobile number via OTP to set a new password
            </p>
          </div>

          {/* Stepper tracker */}
          <div className="mb-5 flex items-center justify-center gap-2">
            <span
              className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-xs transition ${
                !otpSent
                  ? 'bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              1. Mobile Number
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-xs transition ${
                otpSent
                  ? 'bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs'
                  : 'text-slate-400 bg-slate-50'
              }`}
            >
              2. OTP & Password
            </span>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-700 animate-in fade-in duration-150">
              {success}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            {/* Mobile Number */}
            <Input
              label="Registered Mobile Number"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 9999999999"
              disabled={otpSent}
              icon={Phone}
              required
            />

            {/* OTP and New Password fields when OTP is sent */}
            {otpSent && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">Verification OTP Code</span>
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                    >
                      Resend Code
                    </button>
                  </div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit verification code"
                    icon={KeyRound}
                    required
                  />
                </div>

                <Input
                  label="New Secure Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
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
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full h-11 mt-2 text-sm shadow-md"
            >
              {otpSent ? (
                <>
                  <span>Save New Password</span>
                  <CheckCircle2 size={16} className="ml-2" />
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Back to Login link */}
          <div className="mt-5 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 mt-4">
          © 2026 Uabindia HRMS • All Rights Reserved
        </div>
      </div>
    </div>
  )
}
