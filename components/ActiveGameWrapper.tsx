'use client'

import { useState } from 'react'
import { useMatchTimer } from '../lib/hooks/useMatchTimer'
import { useSnackbar } from '../lib/hooks/useSnackbar'
import { useGameData } from '../lib/hooks/useGameData'
import { getTeamScore, getAvailablePlayersForSelection } from '../lib/game-utils'
import { 
  addScore, 
  addPlayerToMatch, 
  removePlayerFromMatch, 
  updatePlayerTeam, 
  assignGoalkeeper,
  removeGoalkeeper,
  addPlayerToField,
  toggleVests
} from '@/app/actions'
import type { GoalDialogState, PlayerSelectState, Player } from '../lib/types'
import React from 'react' // Added missing import

// Components
import { Navigation } from './Navigation'
import { ActiveGame } from './ActiveGame'
import { PlayerSelectModal } from './PlayerSelectModal'
import { GoalDialog } from './GoalDialog'
import { Snackbar } from './Snackbar'
import { NoActiveGame } from './NoActiveGame'
import { GameLoadingSkeleton } from './ui/loading-skeleton'

interface ActiveGameWrapperProps {
  initialActiveGame: any // We'll use React Query instead
  availablePlayers: Player[]
}

export function ActiveGameWrapper({ initialActiveGame, availablePlayers }: ActiveGameWrapperProps) {
  // Use React Query for data fetching
  const { activeGame, availablePlayers: queryAvailablePlayers, loading, refreshGameData } = useGameData()
  
  // Local state
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidesSwapped, setIsSidesSwapped] = useState(false)
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

  // Calculate scores
  const teamAScore = activeGame ? getTeamScore(activeGame.scores, 'A') : 0
  const teamBScore = activeGame ? getTeamScore(activeGame.scores, 'B') : 0

  // Get current team data (using local state for reordering)
  const getCurrentTeamData = () => {
    if (!activeGame) return { teamA: [], teamB: [] }
    return {
      teamA: localTeamA.length > 0 ? localTeamA : activeGame.teamA,
      teamB: localTeamB.length > 0 ? localTeamB : activeGame.teamB
    }
  }

  // Event handlers
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleScoreIncrement = async (team: 'A' | 'B') => {
    if (!activeGame) return
    
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
    if (!activeGame || !goalDialog.team) return

    try {
      const result = await addScore({
        matchId: activeGame.match.id,
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
        refreshGameData()
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
    if (!activeGame) return

    try {
      const winnerTeam = teamAScore > teamBScore ? 'A' : teamBScore > teamAScore ? 'B' : null
      await timer.endMatch(winnerTeam)
      // Don't set to null, let the server component handle the state change
    } catch (error) {
      console.error('Error ending match:', error)
      showSnackbar('Failed to end match')
    }
  }

  const handleSwapSides = () => {
    setIsSidesSwapped(!isSidesSwapped)
  }

  const handleVestToggle = async (team: 'A' | 'B') => {
    if (!activeGame) return
    
    try {
      const currentTeamWithVests = activeGame.match.team_with_vests as 'A' | 'B' | null
      const newTeamWithVests = currentTeamWithVests === team ? null : team
      
      const result = await toggleVests({
        matchId: activeGame.match.id,
        team: newTeamWithVests
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
        refreshGameData()
      }
    } catch (error) {
      console.error('Error toggling vests:', error)
      showSnackbar('Failed to update vests')
    }
  }

  const handleAddPlayer = (team: 'A' | 'B', isGoalkeeper: boolean = false) => {
    setShowPlayerSelect({ team, isGoalkeeper })
  }

  const handlePlayerSelect = async (player: Player, team: 'A' | 'B') => {
    if (!activeGame) return

    try {
      const result = await addPlayerToMatch({
        matchId: activeGame.match.id,
        playerId: player.id,
        team,
        isGoalkeeper: showPlayerSelect.isGoalkeeper
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
        // Close player select modal
        setShowPlayerSelect({ team: null, isGoalkeeper: false })
        
        // Refresh game data to get updated teams
        refreshGameData()
      }
    } catch (error) {
      console.error('Error adding player:', error)
      showSnackbar('Failed to add player')
    }
  }

  const handleRemovePlayer = async (player: Player) => {
    if (!activeGame) return

    try {
      const result = await removePlayerFromMatch({
        matchId: activeGame.match.id,
        playerId: player.id
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
        // Refresh game data to get updated teams
        refreshGameData()
      }
    } catch (error) {
      console.error('Error removing player:', error)
      showSnackbar('Failed to remove player')
    }
  }

  const handleSwitchPlayerTeam = async (player: Player, newTeam: 'A' | 'B', newIndex?: number) => {
    if (!activeGame) return

    try {
      // Find the player's current position
      const currentTeamA = activeGame.teamA.find(p => p.id === player.id)
      const currentTeamB = activeGame.teamB.find(p => p.id === player.id)
      const isGoalkeeperA = activeGame.goalkeepers.teamA?.id === player.id
      const isGoalkeeperB = activeGame.goalkeepers.teamB?.id === player.id
      
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
              setLocalTeamA(newTeamA)
            } else {
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              setLocalTeamB(newTeamB)
            }
          } else {
            // Cross team: Remove from goalkeeper, add to other team's field
            console.log(`Cross team goalkeeper to field: ${player.name} from team ${currentTeam} to team ${newTeam} position ${newIndex}`)
            if (newTeam === 'A') {
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              setLocalTeamA(newTeamA)
            } else {
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              setLocalTeamB(newTeamB)
            }
          }
          
          // Update database in background
          Promise.all([
            removeGoalkeeper({
              matchId: activeGame.match.id,
              playerId: player.id
            }),
            addPlayerToField({
              matchId: activeGame.match.id,
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
              refreshGameData()
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
              setLocalTeamA(newTeamA)
            }
          } else {
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              newTeamB.splice(currentIndex, 1)
              setLocalTeamB(newTeamB)
            }
          }
          
          // Assign goalkeeper
          assignGoalkeeper({
            matchId: activeGame.match.id,
            playerId: player.id,
            team: newTeam
          }).then(assignResult => {
            if (assignResult.validationErrors || assignResult.serverError) {
              console.error('Failed to assign goalkeeper to database:', assignResult.validationErrors || assignResult.serverError)
              showSnackbar('Warning: Goalkeeper assignment may not be saved')
            } else {
              console.log(`Successfully assigned ${player.name} as goalkeeper for team ${newTeam}`)
              // Refresh game data to get updated teams and goalkeepers
              refreshGameData()
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
              setLocalTeamA(newTeamA)
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
              setLocalTeamB(newTeamB)
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
              setLocalTeamA(newTeamA)
              
              // Add to Team B at specified position
              const newTeamB = [...localTeamB]
              newTeamB.splice(newIndex, 0, player)
              setLocalTeamB(newTeamB)
              
              console.log(`Locally moved ${player.name} from Team A (index ${currentIndex}) to Team B (index ${newIndex})`)
            }
          } else if (currentTeam === 'B' && newTeam === 'A') {
            // Remove from Team B
            const currentIndex = localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...localTeamB]
              newTeamB.splice(currentIndex, 1)
              setLocalTeamB(newTeamB)
              
              // Add to Team A at specified position
              const newTeamA = [...localTeamA]
              newTeamA.splice(newIndex, 0, player)
              setLocalTeamA(newTeamA)
              
              console.log(`Locally moved ${player.name} from Team B (index ${currentIndex}) to Team A (index ${newIndex})`)
            }
          }
          
          // Update database in the background (don't await - let it happen async)
          updatePlayerTeam({
            matchId: activeGame.match.id,
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
        matchId: activeGame.match.id,
        playerId: player.id
      })

      if (removeResult.validationErrors || removeResult.serverError) {
        showSnackbar('Failed to remove player from current team')
        return
      }

      // Then add them to the new team
      const addResult = await addPlayerToMatch({
        matchId: activeGame.match.id,
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
        refreshGameData()
      }
    } catch (error) {
      console.error('Error in handleSwitchPlayerTeam:', error)
      showSnackbar('Failed to process player team switch')
    }
  }

  const handleClosePlayerSelect = () => {
    setShowPlayerSelect({ team: null, isGoalkeeper: false })
  }

  // Get available players for selection
  const availablePlayersForSelection = activeGame 
    ? getAvailablePlayersForSelection(queryAvailablePlayers, activeGame.teamA, activeGame.teamB, activeGame.goalkeepers)
    : queryAvailablePlayers

  // Show loading state
  if (loading) {
    return <GameLoadingSkeleton />
  }

  // Show no active game state
  if (!activeGame) {
    return <NoActiveGame isDarkMode={isDarkMode} />
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
        onScoreIncrement={handleScoreIncrement}
        onPauseToggle={handlePauseToggle}
        onEndMatch={handleEndMatch}
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