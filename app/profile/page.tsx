'use client'

import { Suspense } from 'react'
import { Navigation } from '../../components/Navigation'
import { ProfileForm } from '../../components/ProfileForm'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useDarkMode } from '../../lib/hooks/useDarkMode'

export default function ProfilePage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <ProtectedRoute>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'sm:bg-gray-900 text-white' : 'sm:bg-gray-50 text-gray-900'
      }`}>
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        
        <main className="sm:max-w-2xl sm:mx-auto sm:px-6 sm:py-8 p-4">
          <div className={`sm:rounded-lg shadow-sm sm:border p-4 sm:p-6 ${
            isDarkMode ? 'sm:bg-gray-800 sm:border-gray-700' : 'sm:bg-white sm:border-gray-200'
          }`}>
            <h1 className="text-2xl font-bold mb-6">Profil</h1>
            
            <Suspense fallback={<div>Laddar profil...</div>}>
              <ProfileForm />
            </Suspense>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
