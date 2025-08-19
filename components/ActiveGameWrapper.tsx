'use client'

import { useState } from 'react'
import { useMatchTimer } from '../lib/hooks/useMatchTimer'
import { useSnackbar } from '../lib/hooks/useSnackbar'
import { useGameData } from '../lib/hooks/useGameData'
import { getTeamScore, getAvailablePlayersForSelection, convertPlannedGameToActiveGameData } from '../lib/game-utils'
import { 
  addScore, 
  addPlayerToMatch, 
  removePlayerFromMatch, 
  updatePlayerTeam, 
  assignGoalkeeper,
  removeGoalkeeper,
  addPlayerToField,
  toggleVests,
  controlMatch,
  createMatch
} from '@/app/actions'
import type { GoalDialogState, PlayerSelectState, Player, Match, ActiveGameData } from '../lib/types'
import React from 'react' // Added missing import

// Components
import { Navigation } from './Navigation'
import { ActiveGame } from './ActiveGame'
import { PlayerSelectModal } from './PlayerSelectModal'
import { GoalDialog } from './GoalDialog'
import { Snackbar } from './Snackbar'
import { NoActiveGame } from './NoActiveGame'
import { PlannedGamesList } from './PlannedGamesList'
import { GameLoadingSkeleton } from './ui/loading-skeleton'

interface ActiveGameWrapperProps {
  initialActiveGame: any // We'll use React Query instead
  availablePlayers: Player[]
  plannedGames: Match[]
}

export function ActiveGameWrapper({ initialActiveGame, availablePlayers, plannedGames }: ActiveGameWrapperProps) {
  // Use React Query for data fetching
  const { activeGame, availablePlayers: queryAvailablePlayers, loading, refreshGameData } = useGameData()
  
  // Local state
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidesSwapped, setIsSidesSwapped] = useState(false)
  const [selectedPlannedGame, setSelectedPlannedGame] = useState<ActiveGameData | null>(null)
  const [localTeamA, setLocalTeamA] = useState<Player[]>([])
  const [localTeamB, setLocalTeamB] = useState<Player[]>([])
  const [showPlayerSelect, setShowPlayerSelect] = useState<PlayerSelectState>({ 
    team: null, 
    isGoalkeeper: false 
  })
  const [goalDialog, setGoalDialog] = useState<GoalDialogState>({
    isOpen: false,
    team: null,
    scoringPlayer: null,
    assistingPlayer: null
  })
  
  const { snackbar, showSnackbar } = useSnackbar()
  
  // Timer hook
  const timer = useMatchTimer(activeGame?.match || null, (updatedMatch) => {
    // Refresh game data when match updates
    refreshGameData()
  })

  // Update local state when activeGame changes, but preserve local changes
  React.useEffect(() => {
    if (activeGame) {
      // Check if local state is empty or significantly different from database
      const localTeamAIds = localTeamA.map(p => p.id).sort()
      const localTeamBIds = localTeamB.map(p => p.id).sort()
      const dbTeamAIds = activeGame.teamA.map(p => p.id).sort()
      const dbTeamBIds = activeGame.teamB.map(p => p.id).sort()
      
      // Only update if local state is empty or has different players (not just different order)
      const teamADifferent = localTeamAIds.length === 0 || 
        localTeamAIds.length !== dbTeamAIds.length ||
        localTeamAIds.some((id, index) => id !== dbTeamAIds[index])
        
      const teamBDifferent = localTeamBIds.length === 0 || 
        localTeamBIds.length !== dbTeamBIds.length ||
        localTeamBIds.some((id, index) => id !== dbTeamBIds[index])
      
      if (teamADifferent) {
        console.log('Updating local Team A from database (players changed)')
        setLocalTeamA([...activeGame.teamA])
      }
      
      if (teamBDifferent) {
        console.log('Updating local Team B from database (players changed)')
        setLocalTeamB([...activeGame.teamB])
      }
    }
  }, [activeGame])

  // Update local state when selectedPlannedGame changes and clear when switching
  React.useEffect(() => {
    if (selectedPlannedGame) {
      console.log('Syncing local state with selected planned game')
      setLocalTeamA([...selectedPlannedGame.teamA])
      setLocalTeamB([...selectedPlannedGame.teamB])
    } else {
      // Clear local state when no planned game is selected
      setLocalTeamA([])
      setLocalTeamB([])
    }
  }, [selectedPlannedGame?.match.id]) // Only sync when the match ID changes, not on every property update

  // Separate effect to handle clearing state when selectedPlannedGame becomes null
  React.useEffect(() => {
    if (!selectedPlannedGame) {
      setLocalTeamA([])
      setLocalTeamB([])
    }
  }, [selectedPlannedGame])

  // Clear local state when switching between different game contexts
  React.useEffect(() => {
    // When we have both activeGame and selectedPlannedGame, prioritize activeGame
    if (activeGame && selectedPlannedGame) {
      setSelectedPlannedGame(null)
    }
    
    // Clear local state when there's no game at all
    if (!activeGame && !selectedPlannedGame) {
      setLocalTeamA([])
      setLocalTeamB([])
    }
  }, [activeGame, selectedPlannedGame])

  // Calculate scores
  const currentGame = activeGame || selectedPlannedGame
  const teamAScore = currentGame ? getTeamScore(currentGame.scores, 'A') : 0
  const teamBScore = currentGame ? getTeamScore(currentGame.scores, 'B') : 0

  // Get current team data (using local state for reordering)
  const getCurrentTeamData = () => {
    if (!currentGame) return { teamA: [], teamB: [] }
    
    // For planned games, always use local state if we have a selectedPlannedGame
    // For active games, use local state only if it's populated (for reordering)
    if (selectedPlannedGame) {
      return {
        teamA: localTeamA,
        teamB: localTeamB
      }
    }
    
    return {
      teamA: localTeamA.length > 0 ? localTeamA : currentGame.teamA,
      teamB: localTeamB.length > 0 ? localTeamB : currentGame.teamB
    }
  }

  // Event handlers
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleScoreIncrement = async (team: 'A' | 'B') => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return
    
    setGoalDialog({
      isOpen: true,
      team,
      scoringPlayer: null,
      assistingPlayer: null
    })
  }

  const handleGoalDialogPlayerClick = (player: Player) => {
    setGoalDialog(prev => {
      const isScoring = prev.scoringPlayer?.id === player.id
      const isAssisting = prev.assistingPlayer?.id === player.id
      
      if (isScoring) {
        if (!prev.assistingPlayer) {
          return { ...prev, scoringPlayer: null, assistingPlayer: player }
        } else {
          return { ...prev, scoringPlayer: null }
        }
      }
      
      if (isAssisting) {
        return { ...prev, assistingPlayer: null }
      }
      
      if (!prev.scoringPlayer) {
        return { ...prev, scoringPlayer: player }
      }
      
      if (!prev.assistingPlayer) {
        return { ...prev, assistingPlayer: player }
      }
      
      showSnackbar('Bara en målgörare och assisterande spelare kan väljas')
      return prev
    })
  }

  const handleGoalDialogSubmit = async () => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame || !goalDialog.team) return

    try {
      const result = await addScore({
        matchId: currentGame.match.id,
        team: goalDialog.team,
        scoringPlayerId: goalDialog.scoringPlayer?.id,
        assistingPlayerId: goalDialog.assistingPlayer?.id
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        return
      }

      if (result.data) {
        // Close dialog
        setGoalDialog({ isOpen: false, team: null, scoringPlayer: null, assistingPlayer: null })
        
        // Refresh game data to get updated scores
        if (selectedPlannedGame) {
          // Update the selected planned game data
          const updatedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(updatedGameData)
        } else {
          refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error adding score:', error)
      showSnackbar('Failed to add score')
    }
  }

  const handleGoalDialogCancel = () => {
    setGoalDialog({ isOpen: false, team: null, scoringPlayer: null, assistingPlayer: null })
  }

  const removeSelectedPlayer = (type: 'scoring' | 'assisting') => {
    setGoalDialog(prev => ({
      ...prev,
      [type === 'scoring' ? 'scoringPlayer' : 'assistingPlayer']: null
    }))
  }

  const handlePauseToggle = async () => {
    if (timer.isPaused) {
      await timer.resumeMatch()
    } else {
      await timer.pauseMatch()
    }
  }

  const handleEndMatch = async () => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return

    try {
      const winnerTeam = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null
      await timer.endMatch(winnerTeam)
      // Don't set to null, let the server component handle the state change
    } catch (error) {
      console.error('Error ending match:', error)
      showSnackbar('Failed to end match')
    }
  }

  const handleEndMatchAndCreateNew = async () => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return

    try {
      // First end the current match
      const winnerTeam = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null
      await timer.endMatch(winnerTeam)

      // Get current team data for the new match
      const currentTeamData = getCurrentTeamData()
      
      // Create new match with same team configuration
      const createResult = await createMatch({
        teamWithVests: currentGame.match.team_with_vests as 'A' | 'B' | null,
        teamAPlayerIds: currentTeamData.teamA.map(player => player.id),
        teamBPlayerIds: currentTeamData.teamB.map(player => player.id),
        teamAGoalkeeperId: currentGame.goalkeepers.teamA?.id || null,
        teamBGoalkeeperId: currentGame.goalkeepers.teamB?.id || null
      })

      if (createResult.validationErrors || createResult.serverError) {
        showSnackbar('Failed to create new match')
        return
      }

      if (createResult.data) {
        showSnackbar('Match ended and new planned match created with same teams!')
      }
    } catch (error) {
      console.error('Error ending match and creating new:', error)
      showSnackbar('Failed to end match and create new')
    }
  }

  const handleSwapSides = () => {
    setIsSidesSwapped(!isSidesSwapped)
  }

  const handleVestToggle = async (team: 'A' | 'B') => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return
    
    try {
      const currentTeamWithVests = currentGame.match.team_with_vests as 'A' | 'B' | null
      const newTeamWithVests = currentTeamWithVests === team ? null : team
      
      // If we're viewing a planned game, update local state immediately for instant feedback
      if (selectedPlannedGame) {
        const updatedPlannedGame = {
          ...selectedPlannedGame,
          match: {
            ...selectedPlannedGame.match,
            team_with_vests: newTeamWithVests
          }
        }
        setSelectedPlannedGame(updatedPlannedGame)
      }
      
      const result = await toggleVests({
        matchId: currentGame.match.id,
        team: newTeamWithVests
      })
      
      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        // Revert local state on error
        if (selectedPlannedGame) {
          setSelectedPlannedGame(selectedPlannedGame)
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        // Revert local state on error
        if (selectedPlannedGame) {
          setSelectedPlannedGame(selectedPlannedGame)
        }
        return
      }

      if (result.data) {
        if (selectedPlannedGame) {
          // For planned games, we already updated the local state immediately above
          // No need to refresh from database since we have the correct state locally
          console.log('Vest toggle successful - keeping local state')
        } else {
          refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error toggling vests:', error)
      showSnackbar('Failed to update vests')
      // Revert local state on error
      if (selectedPlannedGame) {
        setSelectedPlannedGame(selectedPlannedGame)
      }
    }
  }

  const handleAddPlayer = (team: 'A' | 'B', isGoalkeeper: boolean = false) => {
    setShowPlayerSelect({ team, isGoalkeeper })
  }

  const handlePlayerSelect = async (player: Player, team: 'A' | 'B') => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return

    try {
      // For planned games, update local state immediately for instant feedback
      if (selectedPlannedGame) {
        if (showPlayerSelect.isGoalkeeper) {
          // Add goalkeeper
          setSelectedPlannedGame({
            ...selectedPlannedGame,
            goalkeepers: {
              ...selectedPlannedGame.goalkeepers,
              [team === 'A' ? 'teamA' : 'teamB']: player
            }
          })
        } else {
          // Add field player
          if (team === 'A') {
            const newTeamA = [...localTeamA, player]
            setLocalTeamA(newTeamA)
            setSelectedPlannedGame({
              ...selectedPlannedGame,
              teamA: newTeamA
            })
          } else {
            const newTeamB = [...localTeamB, player]
            setLocalTeamB(newTeamB)
            setSelectedPlannedGame({
              ...selectedPlannedGame,
              teamB: newTeamB
            })
          }
        }
      }

      const result = await addPlayerToMatch({
        matchId: currentGame.match.id,
        playerId: player.id,
        team,
        isGoalkeeper: showPlayerSelect.isGoalkeeper
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        // Revert local state changes on error
        if (selectedPlannedGame) {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(revertedGameData)
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        // Revert local state changes on error
        if (selectedPlannedGame) {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(revertedGameData)
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.data) {
        // Close player select modal
        setShowPlayerSelect({ team: null, isGoalkeeper: false })
        
        // For active games, refresh from server
        if (!selectedPlannedGame) {
          refreshGameData()
        }
        // For planned games, local state is already updated above
      }
    } catch (error) {
      console.error('Error adding player:', error)
      showSnackbar('Failed to add player')
      
      // Revert local state changes on error
      if (selectedPlannedGame) {
        try {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(revertedGameData)
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        } catch (revertError) {
          console.error('Error reverting state:', revertError)
        }
      }
    }
  }

  const handleRemovePlayer = async (player: Player) => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return

    try {
      // For planned games, update local state immediately for instant feedback
      if (selectedPlannedGame) {
        // Find which team the player is on and remove them locally
        const playerInTeamA = localTeamA.find(p => p.id === player.id)
        const playerInTeamB = localTeamB.find(p => p.id === player.id)
        
        if (playerInTeamA) {
          const newTeamA = localTeamA.filter(p => p.id !== player.id)
          setLocalTeamA(newTeamA)
          // Also update selectedPlannedGame
          setSelectedPlannedGame({
            ...selectedPlannedGame,
            teamA: newTeamA
          })
        } else if (playerInTeamB) {
          const newTeamB = localTeamB.filter(p => p.id !== player.id)
          setLocalTeamB(newTeamB)
          // Also update selectedPlannedGame
          setSelectedPlannedGame({
            ...selectedPlannedGame,
            teamB: newTeamB
          })
        }
      }

      const result = await removePlayerFromMatch({
        matchId: currentGame.match.id,
        playerId: player.id
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        // Revert local state changes on error
        if (selectedPlannedGame) {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(revertedGameData)
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        // Revert local state changes on error
        if (selectedPlannedGame) {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(revertedGameData)
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.data) {
        // For active games, refresh from server
        if (!selectedPlannedGame) {
          refreshGameData()
        }
        // For planned games, local state is already updated above
      }
    } catch (error) {
      console.error('Error removing player:', error)
      showSnackbar('Failed to remove player')
      
      // Revert local state changes on error
      if (selectedPlannedGame) {
        try {
          const revertedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(revertedGameData)
          setLocalTeamA([...revertedGameData.teamA])
          setLocalTeamB([...revertedGameData.teamB])
        } catch (revertError) {
          console.error('Error reverting state:', revertError)
        }
      }
    }
  }

  const handleSwitchPlayerTeam = async (player: Player, newTeam: 'A' | 'B', newIndex?: number) => {
    const currentGame = activeGame || selectedPlannedGame
    if (!currentGame) return

    try {
      // Find the player's current position
      const currentTeamA = currentGame.teamA.find(p => p.id === player.id)
      const currentTeamB = currentGame.teamB.find(p => p.id === player.id)
      const isGoalkeeperA = currentGame.goalkeepers.teamA?.id === player.id
      const isGoalkeeperB = currentGame.goalkeepers.teamB?.id === player.id
      
      let currentTeam: 'A' | 'B' | null = null
      if (currentTeamA) currentTeam = 'A'
      else if (currentTeamB) currentTeam = 'B'
      else if (isGoalkeeperA) currentTeam = 'A'
      else if (isGoalkeeperB) currentTeam = 'B'
      
      if (!currentTeam) {
        showSnackbar('Player not found in any team')
        return
      }
      
      const isCurrentlyGoalkeeper = isGoalkeeperA || isGoalkeeperB
      console.log(`Player ${player.name} current position:`, {
        team: currentTeam,
        isGoalkeeper: isCurrentlyGoalkeeper
      })

      // Handle all drag and drop moves locally (both same-team and cross-team)
      if (newIndex !== undefined) {
        // Special case: Moving goalkeeper to field position
        if (isCurrentlyGoalkeeper && newIndex >= 0) {
          console.log(`Moving goalkeeper ${player.name} from team ${currentTeam} to field position ${newIndex} on team ${newTeam}`)
          
          // Handle local state updates first for instant feedback
          if (currentTeam === newTeam) {
            // Same team: Remove from goalkeeper, add to field at specified position
            console.log(`Same team goalkeeper to field: ${player.name} to position ${newIndex}`)
            if (currentTeam === 'A') {
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              updateTeamState(newTeamA, localTeamB)
            } else {
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              updateTeamState(localTeamA, newTeamB)
            }
          } else {
            // Cross team: Remove from goalkeeper, add to other team's field
            console.log(`Cross team goalkeeper to field: ${player.name} from team ${currentTeam} to team ${newTeam} position ${newIndex}`)
            if (newTeam === 'A') {
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              updateTeamState(newTeamA, localTeamB)
            } else {
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              updateTeamState(localTeamA, newTeamB)
            }
          }
          
          // Also update goalkeeper removal in selectedPlannedGame if applicable
          if (selectedPlannedGame && isCurrentlyGoalkeeper) {
            updateGoalkeeperInPlannedGame(currentTeam, null)
          }
          
          // Update database in background
          Promise.all([
            removeGoalkeeper({
              matchId: currentGame.match.id,
              playerId: player.id
            }),
            addPlayerToField({
              matchId: currentGame.match.id,
              playerId: player.id,
              team: newTeam
            })
          ]).then(([removeResult, addResult]) => {
            if (removeResult.validationErrors || removeResult.serverError || 
                addResult.validationErrors || addResult.serverError) {
              console.error('Failed to move goalkeeper to field:', {
                removeErrors: removeResult.validationErrors || removeResult.serverError,
                addErrors: addResult.validationErrors || addResult.serverError
              })
              showSnackbar('Warning: Goalkeeper move may not be saved')
            } else {
              console.log(`Successfully moved goalkeeper ${player.name} to field position`)
              if (selectedPlannedGame) {
                // Refresh the selected planned game data
                convertPlannedGameToActiveGameData(currentGame.match).then(updatedGameData => {
                  setSelectedPlannedGame(updatedGameData)
                })
              } else {
                refreshGameData()
              }
            }
          }).catch(error => {
            console.error('Error moving goalkeeper to field:', error)
            showSnackbar('Failed to move goalkeeper to field position')
          })
          
          return
        }
        
        // Special case: Goalkeeper assignment (newIndex = -1)
        if (newIndex === -1) {
          console.log(`Assigning ${player.name} as goalkeeper for team ${newTeam}`)
          
          // Remove player from current field position
          if (currentTeam === 'A') {
            const currentIndex = localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...localTeamA]
              newTeamA.splice(currentIndex, 1)
              updateTeamState(newTeamA, localTeamB)
            }
          } else {
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              newTeamB.splice(currentIndex, 1)
              updateTeamState(localTeamA, newTeamB)
            }
          }

          // Also update goalkeeper in selectedPlannedGame if applicable
          updateGoalkeeperInPlannedGame(newTeam, player)
          
          // Assign goalkeeper
          assignGoalkeeper({
            matchId: currentGame.match.id,
            playerId: player.id,
            team: newTeam
          }).then(assignResult => {
            if (assignResult.validationErrors || assignResult.serverError) {
              console.error('Failed to assign goalkeeper to database:', assignResult.validationErrors || assignResult.serverError)
              showSnackbar('Warning: Goalkeeper assignment may not be saved')
            } else {
              console.log(`Successfully assigned ${player.name} as goalkeeper for team ${newTeam}`)
              // Refresh game data to get updated teams and goalkeepers
              if (selectedPlannedGame) {
                // Refresh the selected planned game data
                convertPlannedGameToActiveGameData(currentGame.match).then(updatedGameData => {
                  setSelectedPlannedGame(updatedGameData)
                })
              } else {
                refreshGameData()
              }
            }
          }).catch(error => {
            console.error('Error assigning goalkeeper:', error)
            showSnackbar('Failed to assign goalkeeper')
          })
          
          return
        }
        
        console.log(`Moving player ${player.name} from team ${currentTeam} to team ${newTeam} at position ${newIndex}`)
        
        if (currentTeam === newTeam) {
          // Same team reordering
          if (currentTeam === 'A') {
            const currentIndex = localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...localTeamA]
              const originalLength = newTeamA.length
              newTeamA.splice(currentIndex, 1) // Remove from current position
              
              // For same-team moves, the newIndex is based on the original array (including the dragged player)
              // After removing the player, we need to adjust the index:
              let adjustedIndex = newIndex
              if (currentIndex < newIndex) {
                // Moving forward: normally subtract 1, but if moving to the actual last position, use array end
                if (newIndex === originalLength - 1) {
                  // Moving to the last position: insert at end of shortened array
                  adjustedIndex = newTeamA.length
                } else {
                  // Normal forward move: subtract 1 for the removed element
                  adjustedIndex = newIndex - 1
                }
              }
              
              newTeamA.splice(adjustedIndex, 0, player) // Insert at adjusted position
              
              console.log(`Reordered in Team A: ${player.name} from index ${currentIndex} to ${adjustedIndex} (requested: ${newIndex})`)
              updateTeamState(newTeamA, localTeamB)
            }
          } else {
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              const originalLength = newTeamB.length
              newTeamB.splice(currentIndex, 1) // Remove from current position
              
              // For same-team moves, the newIndex is based on the original array (including the dragged player)
              // After removing the player, we need to adjust the index:
              let adjustedIndex = newIndex
              if (currentIndex < newIndex) {
                // Moving forward: normally subtract 1, but if moving to the actual last position, use array end
                if (newIndex === originalLength - 1) {
                  // Moving to the last position: insert at end of shortened array
                  adjustedIndex = newTeamB.length
                } else {
                  // Normal forward move: subtract 1 for the removed element
                  adjustedIndex = newIndex - 1
                }
              }
              
              newTeamB.splice(adjustedIndex, 0, player) // Insert at adjusted position
              
              console.log(`Reordered in Team B: ${player.name} from index ${currentIndex} to ${adjustedIndex} (requested: ${newIndex})`)
              updateTeamState(localTeamA, newTeamB)
            }
          }
        } else {
          // Cross-team move - update locally first for snappy UI, then sync to database
          console.log(`Cross-team move: ${player.name} from team ${currentTeam} to team ${newTeam} at position ${newIndex}`)
          
          // Update local state immediately for instant visual feedback
          if (currentTeam === 'A' && newTeam === 'B') {
            // Remove from Team A
            const currentIndex = localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...localTeamA]
              newTeamA.splice(currentIndex, 1)
              
              // Add to Team B at specified position
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              
              updateTeamState(newTeamA, newTeamB)
              console.log(`Locally moved ${player.name} from Team A (index ${currentIndex}) to Team B (index ${newIndex})`)
            }
          } else if (currentTeam === 'B' && newTeam === 'A') {
            // Remove from Team B
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              newTeamB.splice(currentIndex, 1)
              
              // Add to Team A at specified position
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              
              updateTeamState(newTeamA, newTeamB)
              console.log(`Locally moved ${player.name} from Team B (index ${currentIndex}) to Team A (index ${newIndex})`)
            }
          }
          
          // Update database in the background (don't await - let it happen async)
          updatePlayerTeam({
            matchId: currentGame.match.id,
            playerId: player.id,
            newTeam: newTeam
          }).then(result => {
            if (result.validationErrors || result.serverError) {
              console.error('Failed to sync team change to database:', result.validationErrors || result.serverError)
              showSnackbar('Warning: Team change may not be saved')
            } else {
              console.log(`Successfully synced ${player.name} team change to database`)
            }
          }).catch(error => {
            console.error('Error syncing team change to database:', error)
            showSnackbar('Warning: Team change may not be saved')
          })
        }
        
        return
      }

      // If moving between teams, use the server operations
      const removeResult = await removePlayerFromMatch({
        matchId: currentGame.match.id,
        playerId: player.id
      })

      if (removeResult.validationErrors || removeResult.serverError) {
        showSnackbar('Failed to remove player from current team')
        return
      }

      // Then add them to the new team
      const addResult = await addPlayerToMatch({
        matchId: currentGame.match.id,
        playerId: player.id,
        team: newTeam,
        isGoalkeeper: false // Assuming we're not switching goalkeepers via drag and drop
      })

      if (addResult.validationErrors) {
        showSnackbar('Invalid input data')
        return
      }

      if (addResult.serverError) {
        showSnackbar(addResult.serverError)
        return
      }

      if (addResult.data) {
        // Refresh game data to get updated teams
        if (selectedPlannedGame) {
          // Update the selected planned game data
          const updatedGameData = await convertPlannedGameToActiveGameData(currentGame.match)
          setSelectedPlannedGame(updatedGameData)
        } else {
          refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error in handleSwitchPlayerTeam:', error)
      showSnackbar('Failed to process player team switch')
    }
  }

  const handleClosePlayerSelect = () => {
    setShowPlayerSelect({ team: null, isGoalkeeper: false })
  }

  const handleSelectPlannedGame = async (game: Match) => {
    try {
      const gameData = await convertPlannedGameToActiveGameData(game)
      setSelectedPlannedGame(gameData)
    } catch (error) {
      console.error('Error loading planned game:', error)
      showSnackbar('Failed to load planned game')
    }
  }

  const handleStartPlannedGame = async () => {
    if (!selectedPlannedGame) return

    // Immediately update UI by changing the match status in local state
    const updatedGameData = {
      ...selectedPlannedGame,
      match: {
        ...selectedPlannedGame.match,
        match_status: 'active' as const,
        start_time: new Date().toISOString()
      }
    }
    setSelectedPlannedGame(updatedGameData)

    // Update database in background
    try {
      const result = await controlMatch({
        matchId: selectedPlannedGame.match.id,
        action: 'start'
      })

      if (result.validationErrors || result.serverError) {
        // Revert on error
        setSelectedPlannedGame(selectedPlannedGame)
        return
      }

      if (result.data) {
        // Refresh data and clear planned game state after successful start
        refreshGameData()
        setTimeout(() => {
          setSelectedPlannedGame(null)
        }, 100)
      }
    } catch (error) {
      console.error('Error starting game:', error)
      // Revert on error
      setSelectedPlannedGame(selectedPlannedGame)
    }
  }

  const handleBackToPlannedGames = () => {
    setSelectedPlannedGame(null)
  }

  // Helper function to update both local state and selectedPlannedGame
  const updateTeamState = (newTeamA: Player[], newTeamB: Player[]) => {
    setLocalTeamA(newTeamA)
    setLocalTeamB(newTeamB)
    
    // If we're viewing a planned game, also update its state
    if (selectedPlannedGame) {
      setSelectedPlannedGame({
        ...selectedPlannedGame,
        teamA: newTeamA,
        teamB: newTeamB
      })
    }
  }

  // Helper function to update goalkeeper in selectedPlannedGame
  const updateGoalkeeperInPlannedGame = (team: 'A' | 'B', goalkeeper: Player | null) => {
    if (selectedPlannedGame) {
      setSelectedPlannedGame({
        ...selectedPlannedGame,
        goalkeepers: {
          ...selectedPlannedGame.goalkeepers,
          [team === 'A' ? 'teamA' : 'teamB']: goalkeeper
        }
      })
    }
  }

  // Get available players for selection
  const availablePlayersForSelection = currentGame 
    ? getAvailablePlayersForSelection(queryAvailablePlayers, currentGame.teamA, currentGame.teamB, currentGame.goalkeepers)
    : queryAvailablePlayers

  // Show loading state
  if (loading) {
    return <GameLoadingSkeleton />
  }

  // Show selected planned game
  if (selectedPlannedGame) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        
        {/* Back button */}
        <div className="max-w-6xl mx-auto p-6 pb-0">
          <button
            onClick={handleBackToPlannedGames}
            className={`mb-4 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            ← Back to Planned Games
          </button>
        </div>
        
        <ActiveGame
          activeGame={{
            ...selectedPlannedGame,
            teamA: getCurrentTeamData().teamA,
            teamB: getCurrentTeamData().teamB
          }}
          timer={timer}
          teamAScore={getTeamScore(selectedPlannedGame.scores, 'A')}
          teamBScore={getTeamScore(selectedPlannedGame.scores, 'B')}
          isDarkMode={isDarkMode}
          isSidesSwapped={isSidesSwapped}
          matchStatus={selectedPlannedGame.match.match_status}
          onScoreIncrement={handleScoreIncrement}
          onPauseToggle={handlePauseToggle}
          onEndMatch={handleEndMatch}
          onStartMatch={handleStartPlannedGame}
          onEndMatchAndCreateNew={handleEndMatchAndCreateNew}
          onSwapSides={handleSwapSides}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
          onSwitchPlayerTeam={handleSwitchPlayerTeam}
          onVestToggle={handleVestToggle}
        />

        {/* Player Selection Modal */}
        <PlayerSelectModal
          showPlayerSelect={showPlayerSelect}
          availablePlayers={availablePlayersForSelection}
          isDarkMode={isDarkMode}
          onPlayerSelect={handlePlayerSelect}
          onClose={handleClosePlayerSelect}
        />

        {/* Goal Dialog */}
        <GoalDialog
          goalDialog={goalDialog}
          activeGame={selectedPlannedGame}
          isDarkMode={isDarkMode}
          onPlayerClick={handleGoalDialogPlayerClick}
          onSubmit={handleGoalDialogSubmit}
          onCancel={handleGoalDialogCancel}
          onRemoveSelectedPlayer={removeSelectedPlayer}
        />

        {/* Snackbar */}
        <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
      </div>
    )
  }

  // Show no active game state with planned games
  if (!activeGame) {
    return (
      <div 
        className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        <PlannedGamesList 
          plannedGames={plannedGames}
          isDarkMode={isDarkMode}
          onSelectGame={handleSelectPlannedGame}
        />
        <NoActiveGame isDarkMode={isDarkMode} />
        <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
      </div>
    )
  }

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)'
      }}
    >
      <Navigation isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
      
      <ActiveGame
        activeGame={{
          ...activeGame,
          teamA: getCurrentTeamData().teamA,
          teamB: getCurrentTeamData().teamB
        }}
        timer={timer}
        teamAScore={teamAScore}
        teamBScore={teamBScore}
        isDarkMode={isDarkMode}
        isSidesSwapped={isSidesSwapped}
        matchStatus={activeGame.match.match_status}
        onScoreIncrement={handleScoreIncrement}
        onPauseToggle={handlePauseToggle}
        onEndMatch={handleEndMatch}
        onEndMatchAndCreateNew={handleEndMatchAndCreateNew}
        onSwapSides={handleSwapSides}
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onSwitchPlayerTeam={handleSwitchPlayerTeam}
        onVestToggle={handleVestToggle}
      />

      {/* Player Selection Modal */}
      <PlayerSelectModal
        showPlayerSelect={showPlayerSelect}
        availablePlayers={availablePlayersForSelection}
        isDarkMode={isDarkMode}
        onPlayerSelect={handlePlayerSelect}
        onClose={handleClosePlayerSelect}
      />

      {/* Goal Dialog */}
      <GoalDialog
        goalDialog={goalDialog}
        activeGame={activeGame}
        isDarkMode={isDarkMode}
        onPlayerClick={handleGoalDialogPlayerClick}
        onSubmit={handleGoalDialogSubmit}
        onCancel={handleGoalDialogCancel}
        onRemoveSelectedPlayer={removeSelectedPlayer}
      />

      {/* Snackbar */}
      <Snackbar snackbar={snackbar} isDarkMode={isDarkMode} />
    </div>
  )
} 