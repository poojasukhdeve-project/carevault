'use client'

import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import type { UserRole } from '@/lib/permissions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('caregiver')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Registration form
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [caregiverEmail, setCaregiverEmail] = useState('')
  const [caregiverName, setCaregiverName] = useState('')

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please add Supabase credentials to .env.local')
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess('Password reset link has been sent to your email. Please check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase is not configured. Please add Supabase credentials to .env.local')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        // Validate registration info
        if (!fullName.trim()) {
          throw new Error('Please enter your full name')
        }

        // Validate patient-specific fields
        if (selectedRole === 'patient') {
          if (!caregiverEmail.trim()) {
            throw new Error('Please enter your caregiver\'s email')
          }
          if (!caregiverName.trim()) {
            throw new Error('Please enter your caregiver\'s name')
          }
        }
        
        // Sign up new user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              phone: phone,
              role: selectedRole,
              pending_caregiver_email: selectedRole === 'patient' ? caregiverEmail : null,
              pending_caregiver_name: selectedRole === 'patient' ? caregiverName : null,
            }
          }
        })

        if (signUpError) throw signUpError

        if (authData.user && authData.session) {
          // Redirect immediately after successful profile creation
          window.location.href = '/'
          return
        }
      } else {
        // Sign in existing user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError
      }

      // Redirect to main app after successful login
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFF5E6] to-[#FFE8CC] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden md:flex flex-col items-center justify-center space-y-6">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <Image
              src="/images/carevault-logo.png"
              alt="CareVault Logo"
              width={256}
              height={256}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-[#FF6B35]">CareVault</h1>
            <p className="text-xl text-[#FF8C42]">We take care of you, we take care of life</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold text-center">
              Login to CareVault
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false)
                      setError('')
                      setSuccess('')
                    }}
                    className="text-sm text-[#FF6B35] hover:text-[#FF5722] font-medium transition"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                />
                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true)
                        setError('')
                        setSuccess('')
                      }}
                      className="text-xs text-[#FF6B35] hover:text-[#FF5722] font-medium transition"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      I am a:
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="caregiver"
                          checked={selectedRole === 'caregiver'}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                        />
                        <span className="text-sm">Caregiver (Full Access)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="patient"
                          checked={selectedRole === 'patient'}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                        />
                        <span className="text-sm">Patient (View Only)</span>
                      </label>
                    </div>
                  </div>

                  {/* Common registration fields */}
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number (Optional)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Patient-specific fields: caregiver information */}
                  {selectedRole === 'patient' && (
                    <>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                        <p className="text-sm font-semibold text-blue-900">Link to Your Caregiver</p>
                        <p className="text-xs text-blue-700">
                          To access your care information, please provide your caregiver&apos;s details. They must already have a CareVault account.
                        </p>
                        
                        <div className="space-y-2">
                          <label htmlFor="caregiverEmail" className="text-sm font-medium text-gray-700">
                            Caregiver Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="caregiverEmail"
                            type="email"
                            value={caregiverEmail}
                            onChange={(e) => setCaregiverEmail(e.target.value)}
                            placeholder="your.caregiver@example.com"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="caregiverName" className="text-sm font-medium text-gray-700">
                            Caregiver Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="caregiverName"
                            type="text"
                            value={caregiverName}
                            onChange={(e) => setCaregiverName(e.target.value)}
                            placeholder="Enter your caregiver's name"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent outline-none transition"
                          />
                        </div>

                        <p className="text-xs text-gray-600 italic">
                          Note: Your caregiver must register their account first before you can link to them.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] hover:from-[#FF5722] hover:to-[#FF6B35] text-white font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                    setFullName('')
                    setPhone('')
                    setCaregiverEmail('')
                    setCaregiverName('')
                  }}
                  className="text-sm text-[#FF6B35] hover:text-[#FF5722] font-medium transition"
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Register"}
                </button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
