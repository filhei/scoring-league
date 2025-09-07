'use client'

import { useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { createMatch } from '../app/actions'
import { useSnackbar } from '../lib/hooks/useSnackbar'
import { useAuth } from '../lib/auth-context'

interface NoActiveGameProps {
  isDarkMode: boolean
  onCreateNewGame?: () => void
}

export function NoActiveGame({ isDarkMode, onCreateNewGame }: NoActiveGameProps) {
  const [isPending, startTransition] = useTransition()
  const { showSnackbar } = useSnackbar()
  const queryClient = useQueryClient()
  const { user, player } = useAuth()
  const isAuthenticated = user && player

  function handleCreateGame() {
    console.log('NoActiveGame: Starting game creation')
    startTransition(async () => {
      try {
        console.log('NoActiveGame: Calling createMatch action')
        const result = await createMatch({
          teamWithVests: null,
          teamAPlayerIds: undefined,
          teamBPlayerIds: undefined,
          teamAGoalkeeperId: null,
          teamBGoalkeeperId: null
        })
        
        console.log('NoActiveGame: Result received:', result)
        
        if (result.validationErrors) {
          showSnackbar('Invalid input data', 4000)
          return
        }

        if (result.serverError) {
          if (result.serverError.includes('Authentication required')) {
            showSnackbar('Please sign in to create a new game', 4000)
          } else {
            showSnackbar(result.serverError, 4000)
          }
          return
        }

        if (result.data) {
          console.log('NoActiveGame: Game created successfully, invalidating cache')
          showSnackbar('New game created successfully!', 3000)
          // Invalidate and refetch all game-related queries
          queryClient.invalidateQueries({ queryKey: ['allGames'] })
          queryClient.invalidateQueries({ queryKey: ['activeGame'] })
          queryClient.refetchQueries({ queryKey: ['allGames'] })
          queryClient.refetchQueries({ queryKey: ['activeGame'] })
          console.log('NoActiveGame: Cache invalidation completed')
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
    <div className="sm:max-w-6xl sm:mx-auto sm:p-6 p-4">
      <div className={`sm:rounded-2xl p-4 sm:p-8 transition-colors duration-300 ${
        isDarkMode
          ? 'sm:bg-gray-800 sm:border sm:border-gray-700'
          : 'sm:bg-gray-50 sm:border sm:border-gray-200'
      }`}>
        <div className="text-center">
          <h2 className={`text-3xl font-bold mb-8 transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Det finns inga matcher att visa
          </h2>
          {isAuthenticated ? (
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
              {isPending ? 'Skapar Match...' : 'Skapa Ny Match'}
            </button>
          ) : (
            <Link
              href="/login"
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } hover:scale-105 active:scale-95`}
            >
              Logga In för att Skapa Matcher
            </Link>
          )}
        </div>
      </div>
    </div>
  )
} 