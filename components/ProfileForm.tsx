'use client'

import { useState, useEffect } from 'react'
import { useDarkMode } from '../lib/hooks/useDarkMode'
import { PositionCard } from './PositionCard'

interface PositionPreference {
  position: string
  preference: 'primary' | 'secondary' | null
}

interface ProfileData {
  name: string
  positions: PositionPreference[]
}

export function ProfileForm() {
  const { isDarkMode } = useDarkMode()
  
  // Initial data (dummy data for now)
  const initialData: ProfileData = {
    name: 'John Doe',
    positions: [
      { position: 'Målvakt', preference: null },
      { position: 'Back', preference: null },
      { position: 'Center', preference: null },
      { position: 'Forward', preference: null },
    ]
  }

  const [name, setName] = useState(initialData.name)
  const [positions, setPositions] = useState<PositionPreference[]>(initialData.positions)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteEmail, setDeleteEmail] = useState('')
  const [userEmail] = useState('john.doe@example.com') // Dummy email

  // Track changes
  useEffect(() => {
    const nameChanged = name !== initialData.name
    const positionsChanged = JSON.stringify(positions) !== JSON.stringify(initialData.positions)
    setHasChanges(nameChanged || positionsChanged)
  }, [name, positions, initialData])

  const updatePositionPreference = (position: string, preference: 'primary' | 'secondary' | null) => {
    setPositions(prev => prev.map(pos => 
      pos.position === position ? { ...pos, preference } : pos
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement actual database update
    console.log('Profile update:', { name, positions })
  }

  const handleDeleteAccount = () => {
    if (deleteEmail === userEmail) {
      // TODO: Implement actual account deletion
      console.log('Account deleted')
      setShowDeleteDialog(false)
      setDeleteEmail('')
    }
  }

  const resetForm = () => {
    setName(initialData.name)
    setPositions(initialData.positions)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Section */}
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
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
          <h3 className="text-lg font-semibold mb-4">Position Preferences</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click on a position to cycle through your preferences. You can have one primary and multiple secondary preferences.
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
          <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
          <p className="text-sm text-gray-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Remove Account
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          {hasChanges && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!hasChanges}
            className={`px-6 py-2 rounded-md transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
            }`}
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className="text-lg font-semibold text-red-600 mb-4">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. To confirm deletion, please enter your email address:
            </p>
            <p className="text-sm font-medium mb-2">{userEmail}</p>
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
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteEmail('')
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteEmail !== userEmail}
                className={`px-4 py-2 rounded-md transition-colors ${
                  deleteEmail === userEmail
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                }`}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
