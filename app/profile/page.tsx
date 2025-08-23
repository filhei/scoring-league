'use client'

import { Suspense } from 'react'
import { Navigation } from '../../components/Navigation'
import { ProfileForm } from '../../components/ProfileForm'
import { useDarkMode } from '../../lib/hooks/useDarkMode'

export default function ProfilePage() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className={`rounded-lg shadow-sm border p-6 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
          
          <Suspense fallback={<div>Loading profile...</div>}>
            <ProfileForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
