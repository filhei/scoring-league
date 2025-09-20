'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import { useProfileData } from '../lib/hooks/useProfileData'
import { useAuth } from '../lib/auth-context'
import { updateProfile, deleteAccount } from '../app/actions'
import { PositionCard } from './PositionCard'

interface PositionPreference {
  position: 'Målvakt' | 'Back' | 'Center' | 'Forward'
  preference: 'primary' | 'secondary' | null
}

export function ProfileForm() {
  const { isDarkMode } = useDarkMode()
  const { user, refreshPlayer, signOut } = useAuth()
  const router = useRouter()
  const { profileData, loading, error, refetch } = useProfileData()
  
  const [name, setName] = useState('')
  const [positions, setPositions] = useState<PositionPreference[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      console.log('Initializing form with profile data:', profileData)
      setName(profileData.name)
      setPositions(profileData.positions)
      setHasChanges(false) // Reset changes flag when new data is loaded
    }
  }, [profileData])

  // Track changes
  useEffect(() => {
    if (!profileData) return
    
    const nameChanged = name !== profileData.name
    const positionsChanged = JSON.stringify(positions) !== JSON.stringify(profileData.positions)
    setHasChanges(nameChanged || positionsChanged)
  }, [name, positions, profileData])

  const updatePositionPreference = (position: 'Målvakt' | 'Back' | 'Center' | 'Forward', preference: 'primary' | 'secondary' | null) => {
    setPositions(prev => prev.map(pos => 
      pos.position === position ? { ...pos, preference } : pos
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasChanges || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      console.log('ProfileForm: Calling updateProfile with:', { name, positions })
      const result = await updateProfile({ name, positions })
      console.log('ProfileForm: Got result:', result)
      console.log('ProfileForm: Result type:', typeof result)
      console.log('ProfileForm: Result keys:', Object.keys(result))
      console.log('ProfileForm: Result.data:', result.data)
      
      if (!result.data?.success) {
        const errorMessage = result.data?.error || result.serverError || 
          (result.validationErrors && typeof result.validationErrors === 'object' && 
           Object.values(result.validationErrors).flat().find(err => typeof err === 'string')) || 
          'Failed to update profile'
        setSubmitError(errorMessage as string)
      } else {
        console.log('Profile update successful, refreshing data...')
        setSubmitSuccess(true)
        setHasChanges(false)
        
        // Update local form state immediately to prevent UI flicker
        setName(name)
        setPositions(positions)
        
        // Add a small delay to ensure database update is complete
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Refresh both auth context and profile data
        try {
          await Promise.all([
            refreshPlayer(),
            refetch()
          ])
          console.log('Data refresh completed')
        } catch (refreshError) {
          console.warn('Data refresh had issues, but profile was updated:', refreshError)
          // Don't show error to user since the update was successful
        }
        
        setTimeout(() => setSubmitSuccess(false), 3000)
      }
    } catch (err) {
      console.error('ProfileForm: Unexpected error:', err)
      setSubmitError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }



  const handleDeleteAccount = async () => {
    if (deleteEmail !== user?.email || isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await deleteAccount({ email: deleteEmail })
      
      if (!result.data?.success) {
        const errorMessage = result.data?.error || result.serverError || 
          (result.validationErrors && typeof result.validationErrors === 'object' && 
           Object.values(result.validationErrors).flat().find(err => typeof err === 'string')) || 
          'Failed to delete account'
        setSubmitError(errorMessage as string)
      } else {
        // Account deletion successful - close dialog and redirect to main page
        setShowDeleteDialog(false)
        setDeleteEmail('')
        setSubmitError(null)
        // Sign out first
        await signOut()
        // Force navigation to main page to show anonymous state
        window.location.href = '/'
      }
    } catch (err) {
      setSubmitError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    if (profileData) {
      setName(profileData.name)
      setPositions(profileData.positions)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Försök igen
        </button>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Ingen profildata tillgänglig</p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success/Error Messages */}
        {submitSuccess && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            Profilén uppdaterad!
          </div>
        )}
        
        {submitError && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {submitError}
          </div>
        )}

        {/* Name Section */}
        <div>
          <label className="block text-sm font-medium mb-2">Namn</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
          />
        </div>

        {/* Position Preferences */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Position
          </h3>
          <p className={`text-sm mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Välj dina föredragna positioner
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positions.map(({ position, preference }) => (
              <PositionCard
                key={position}
                position={position}
                preference={preference}
                onPreferenceChange={(pref) => updatePositionPreference(position, pref)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>



        {/* Remove Account Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            Ta Bort Konto
          </h3>
          <p className={`text-sm mb-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Detta kommer att permanent ta bort ditt konto och all din data. Denna åtgärd kan inte ångras.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Tar bort...' : 'Ta Bort Konto'}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Avbryt
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isSubmitting}
            className={`px-6 py-2 rounded-md transition-colors ${
              hasChanges && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            }`}
          >
            {isSubmitting ? 'Sparar...' : 'Spara Ändringar'}
          </button>
        </div>
      </form>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. To confirm deletion, please enter your email address:
            </p>
            <p className="text-sm font-medium mb-2">{user?.email}</p>
            <input
              type="email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder="Enter your email to confirm"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
            {submitError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
                {submitError}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteEmail('')
                  setSubmitError(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteEmail !== user?.email || isSubmitting}
                className={`px-4 py-2 rounded-md transition-colors ${
                  deleteEmail === user?.email && !isSubmitting
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                }`}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
