'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    // Supabase automatically handles the token from the URL hash
    // when the user clicks the reset link in their email
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true)
      }
    })

    // Check if we already have a session (user arrived via reset link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setSuccess('Password has been reset successfully. Redirecting to login...')

      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFF5E6] to-[#FFE8CC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center">
            Reset Your Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isReady ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Verifying your reset link...
              </p>
              <p className="text-xs text-gray-500">
                If you did not receive a reset email, please go back and request a new one.
              </p>
              <a
                href="/login"
                className="text-sm text-[#FF6B35] hover:text-[#FF5722] font-medium transition"
              >
                Back to Sign In
              </a>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF6B35] text-white font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-sm text-[#FF6B35] hover:text-[#FF5722] font-medium transition"
                >
                  Back to Sign In
                </a>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
