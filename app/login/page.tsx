'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useDarkMode } from '../../lib/hooks/useDarkMode'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const { signIn, signInWithCode, user } = useAuth()
  const { isDarkMode } = useDarkMode()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  // Check for error parameter from auth callback
  useEffect(() => {
    if (!searchParams) return
    
    const error = searchParams.get('error')
    if (error === 'auth_failed') {
      setMessage({ 
        type: 'error', 
        text: 'Authentication failed. Please try signing in again.' 
      })
    } else if (error === 'no_session') {
      setMessage({ 
        type: 'error', 
        text: 'Session creation failed. Please try signing in again.' 
      })
    } else if (error === 'no_code') {
      setMessage({ 
        type: 'error', 
        text: 'Invalid authentication link. Please request a new magic link.' 
      })
    } else if (error === 'auth_timeout') {
      setMessage({ 
        type: 'error', 
        text: 'Authentication timed out. Please try signing in again.' 
      })
    }
  }, [searchParams])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await signIn(email)

    if (error) {
      setMessage({ type: 'error', text: error })
    } else {
      setEmailSent(true)
    }

    setLoading(false)
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await signInWithCode(email, code)

    if (error) {
      setMessage({ type: 'error', text: error })
      // Clear the code field on error for better UX
      setCode('')
    } else {
      setMessage({ 
        type: 'success', 
        text: 'Signing you in...' 
      })
      // The auth context will handle the session change and the useEffect will redirect
    }

    setLoading(false)
  }

  const resetForm = () => {
    setEmail('')
    setCode('')
    setEmailSent(false)
    setMessage(null)
  }

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Sign in to your Scoring League account
          </p>
        </div>

        {/* Email Form */}
        {!emailSent && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="email" 
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'error' 
                  ? 'bg-red-100 text-red-700 border border-red-200' 
                  : 'bg-green-100 text-green-700 border border-green-200'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                loading || !email
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </form>
        )}

        {/* OTP Form and Instructions */}
        {emailSent && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className={`p-4 rounded-md ${isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Check your email at {email}
              </h3>
            </div>

            {/* OTP Input */}
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label 
                  htmlFor="code" 
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  One-Time Code (Optional)
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center text-lg tracking-widest ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="000000"
                  disabled={loading}
                />
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter the 6-digit code from your email
                </p>
              </div>

              {message && (
                <div className={`p-3 rounded-md ${
                  message.type === 'error' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || !code || code.length !== 6}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    loading || !code || code.length !== 6
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {loading ? 'Signing in...' : 'Sign In with Code'}
                </button>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Back to Email
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleEmailSubmit}
                    disabled={loading}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isDarkMode 
                          ? 'bg-blue-800 text-blue-300 hover:bg-blue-700' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    Resend Email
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link 
            href="/"
            className={`text-sm hover:underline ${
              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            ← Back to Home
          </Link>
        </div>

        {/* How it works section - only show before email is sent */}
        {!emailSent && (
          <div className={`mt-8 p-4 rounded-md text-sm ${
            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <p className="mb-2 font-medium">How it works:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter your registered email address</li>
              <li>Check your email for a magic link and one-time code</li>
              <li>Either click the link or enter the code to sign in</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
