'use client'

import { useTransition } from 'react'
import { createMatch } from '../app/actions'
import { useSnackbar } from '../lib/hooks/useSnackbar'

interface NoActiveGameProps {
  isDarkMode: boolean
  onCreateNewGame?: () => void
}

export function NoActiveGame({ isDarkMode, onCreateNewGame }: NoActiveGameProps) {
  const [isPending, startTransition] = useTransition()
  const { showSnackbar } = useSnackbar()

  function handleCreateGame() {
    startTransition(async () => {
      try {
        const result = await createMatch({})
        
        if (result.validationErrors) {
          showSnackbar('Invalid input data', 4000)
          return
        }

        if (result.serverError) {
          showSnackbar(result.serverError, 4000)
          return
        }

        if (result.data) {
          showSnackbar('New game created successfully!', 3000)
          // Navigate to the new game view
          if (onCreateNewGame) {
            onCreateNewGame()
          }
        }
      } catch (error) {
        showSnackbar('Failed to create game', 4000)
      }
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className={`rounded-2xl p-8 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="text-center">
          <div className={`text-6xl mb-6 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-600' : 'text-gray-400'
          }`}>
            ⚽
          </div>
          <h2 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            No Active Game
          </h2>
          <p className={`text-lg mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Start a new match to see the game status here.
          </p>
          <button
            onClick={handleCreateGame}
            disabled={isPending}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white'
                : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white'
            } ${
              isPending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
            }`}
          >
            {isPending ? 'Creating Game...' : 'Create New Game'}
          </button>
        </div>
      </div>
    </div>
  )
} 