'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useDarkMode } from '../../lib/hooks/useDarkMode'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
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
    } else if (error === 'no_player_account') {
      setMessage({ 
        type: 'error', 
        text: 'This email is not linked to a player account. Please contact the admin.' 
      })
    } else if (error === 'account_deactivated') {
      setMessage({ 
        type: 'error', 
        text: 'Your player account has been deactivated. Please contact the admin.' 
      })
    }
  }, [searchParams])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await signIn(email)

    if (error) {
      // Provide more specific error messages based on the error type
      let errorMessage = error
      
      if (error.includes('not registered')) {
        errorMessage = 'This email is not registered. Please contact the admin to set up your account.'
      } else if (error.includes('not linked')) {
        errorMessage = 'This email is not linked to an active player account. Please contact the admin.'
      } else if (error.includes('deactivated')) {
        errorMessage = 'Your player account has been deactivated. Please contact the admin.'
      } else if (error.includes('Invalid login credentials') || error.includes('User not found')) {
        errorMessage = 'This email is not registered. Please contact the admin to set up your account.'
      } else if (error.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.'
      } else if (error.includes('Too many requests')) {
        errorMessage = 'Too many sign-in attempts. Please wait a few minutes before trying again.'
      }
      
      setMessage({ type: 'error', text: errorMessage })
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
      // Provide more specific error messages based on the error type
      let errorMessage = error
      
      if (error.includes('not registered')) {
        errorMessage = 'This email is not registered. Please contact the admin to set up your account.'
      } else if (error.includes('not linked')) {
        errorMessage = 'This email is not linked to an active player account. Please contact the admin.'
      } else if (error.includes('deactivated')) {
        errorMessage = 'Your player account has been deactivated. Please contact the admin.'
      } else if (error.includes('Invalid login credentials') || error.includes('User not found')) {
        errorMessage = 'This email is not registered. Please contact the admin to set up your account.'
      } else if (error.includes('Invalid or expired code')) {
        errorMessage = 'Invalid or expired code. Please try again or request a new code.'
      } else if (error.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.'
      }
      
      setMessage({ type: 'error', text: errorMessage })
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
          <h1 className="text-3xl font-bold mb-2">Välkommen Tillbaka</h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Logga in på ditt Poängliga-konto
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
                E-postadress
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
                placeholder="Ange din e-post"
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
              {loading ? 'Skickar...' : 'Skicka E-post'}
            </button>
            
            <div className="text-center">
              <Link 
                href="/"
                className={`text-sm hover:underline ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                }`}
              >
                ← Tillbaka till Hem
              </Link>
            </div>
          </form>
        )}

        {/* OTP Form and Instructions */}
        {emailSent && (
          <div className="space-y-6">
            {/* Instructions */}
            <div className={`p-4 rounded-md ${isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                Kontrollera din e-post på {email}
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
                  Engångskod (Valfritt)
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
                  Ange 6-siffrig kod från din e-post
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

              <div className="space-y-6">
                <button
                  type="submit"
                  disabled={loading || !code || code.length !== 6}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    loading || !code || code.length !== 6
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {loading ? 'Loggar in...' : 'Logga In med Kod'}
                </button>
                
                <div className="grid grid-cols-3 items-center">
                  <div className="flex justify-start">
                    <Link 
                      href="/"
                      className={`text-sm hover:underline ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                      }`}
                    >
                      ← Tillbaka till Hem
                    </Link>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={resetForm}
                      className={`text-sm hover:underline ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                      }`}
                    >
                      Tillbaka till E-post
                    </button>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleEmailSubmit}
                      disabled={loading}
                      className={`text-sm hover:underline ${
                        loading
                          ? 'text-gray-500 cursor-not-allowed'
                          : isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                      }`}
                    >
                      Skicka E-post Igen
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function LoginPageFallback() {
  const { isDarkMode } = useDarkMode()
  
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Laddar inloggningsformulär...
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  )
}
