'use client'

import { useState } from 'react'
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
  createMatch,
  deleteMatch,
  resetMatch
} from '@/app/actions'
import { getAvailablePlayersForSelection, convertPlannedGameToActiveGameData } from '../game-utils'
import type { GoalDialogState, PlayerSelectState, Player, Match, ActiveGameData } from '../types'
import type { GameContext, GameState } from './useGameState'

export interface GameActions {
  // Dialog states
  showPlayerSelect: PlayerSelectState
  goalDialog: GoalDialogState
  
  // Actions
  handleScoreIncrement: (team: 'A' | 'B') => void
  handleGoalDialogPlayerClick: (player: Player) => void
  handleGoalDialogSubmit: () => Promise<void>
  handleGoalDialogCancel: () => void
  removeSelectedPlayer: (type: 'scoring' | 'assisting') => void
  handlePauseToggle: () => Promise<void>
  handleEndMatch: () => Promise<void>
  handleEndMatchAndCreateNew: () => Promise<void>
  handleDeleteGame: () => Promise<void>
  handleResetGame: () => Promise<void>
  handleSwapSides: () => void
  handleVestToggle: (team: 'A' | 'B') => Promise<void>
  handleAddPlayer: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  handlePlayerSelect: (player: Player, team: 'A' | 'B') => Promise<void>
  handleMultiPlayerSelect: (players: Player[], team: 'A' | 'B') => Promise<void>
  handleClosePlayerSelect: () => void
  handleSelectPlannedGame: (game: Match) => Promise<void>
  handleStartPlannedGame: () => Promise<void>
  handleBackToMatchesList: () => void
  handleSelectGame: (game: Match) => Promise<void>
  handleCreateNewGame: () => Promise<void>
  handleSwitchPlayerTeam: (player: Player, newTeam: 'A' | 'B', newIndex?: number) => Promise<void>
  handleRemovePlayer: (player: Player) => Promise<void>
  
  // Helper functions
  updateTeamState: (newTeamA: Player[], newTeamB: Player[]) => void
  updateTeamStateAndGoalkeeper: (newTeamA: Player[], newTeamB: Player[], goalkeeperTeam: 'A' | 'B', goalkeeperPlayer: Player | null) => void
  ensureCorrectMatch: (operation: string) => boolean
  
  // Computed values
  availablePlayersForSelection: Player[]
}

export function useGameActions(
  gameState: GameState,
  showSnackbar: (message: string, duration?: number) => void
): GameActions {
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

  // Helper function to ensure we're operating on the correct match
  const ensureCorrectMatch = (operation: string): boolean => {
    if (!gameState.currentGameContext) {
      console.error(`${operation}: No current game context`)
      showSnackbar('No game selected')
      return false
    }
    
    console.log(`${operation}: Operating on match ID ${gameState.currentGameContext.matchId}`)
    return true
  }

  // Helper function to update both local state and currentGameContext
  const updateTeamState = (newTeamA: Player[], newTeamB: Player[]) => {
    gameState.setLocalTeamA(newTeamA)
    gameState.setLocalTeamB(newTeamB)
    
    if (gameState.currentGameContext) {
      gameState.setCurrentGameContext({
        ...gameState.currentGameContext,
        gameData: {
          ...gameState.currentGameContext.gameData,
          teamA: newTeamA,
          teamB: newTeamB
        }
      })
    }
  }

  // Helper function to update team state and goalkeeper context simultaneously
  const updateTeamStateAndGoalkeeper = (newTeamA: Player[], newTeamB: Player[], goalkeeperTeam: 'A' | 'B', goalkeeperPlayer: Player | null) => {
    gameState.setLocalTeamA(newTeamA)
    gameState.setLocalTeamB(newTeamB)
    
    if (gameState.currentGameContext) {
      gameState.setCurrentGameContext({
        ...gameState.currentGameContext,
        gameData: {
          ...gameState.currentGameContext.gameData,
          teamA: newTeamA,
          teamB: newTeamB,
          goalkeepers: {
            ...gameState.currentGameContext.gameData.goalkeepers,
            [goalkeeperTeam === 'A' ? 'teamA' : 'teamB']: goalkeeperPlayer
          }
        }
      })
    }
  }

  // Event handlers
  const handleScoreIncrement = async (team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Score increment')) return
    
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
    if (!ensureCorrectMatch('Goal dialog submit')) return
    if (!goalDialog.team) return

    try {
      const result = await addScore({
        matchId: gameState.currentGameContext!.matchId,
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
        setGoalDialog({ isOpen: false, team: null, scoringPlayer: null, assistingPlayer: null })
        
        if (gameState.currentGameContext?.type === 'planned') {
          const updatedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: updatedGameData,
            matchId: updatedGameData.match.id
          })
        } else {
          gameState.refreshGameData()
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
    if (gameState.timer.isPaused) {
      await gameState.timer.resumeMatch()
    } else {
      await gameState.timer.pauseMatch()
    }
  }

  const handleEndMatch = async () => {
    if (!ensureCorrectMatch('End match')) return

    try {
      console.log('handleEndMatch: Starting to end match...')
      
      gameState.setIsEndingGame(true)
      
      const winnerTeam = gameState.teamAScore > gameState.teamBScore ? 'A' : gameState.teamBScore > gameState.teamAScore ? 'B' : null
      console.log('handleEndMatch: Winner team:', winnerTeam)
      
      await gameState.timer.endMatch(winnerTeam)
      console.log('handleEndMatch: timer.endMatch completed successfully')
      
      const winnerText = winnerTeam ? `Team ${winnerTeam} wins!` : 'Match ended in a tie!'
      showSnackbar(`Match ended successfully. ${winnerText}`, 3000)
      
      console.log('handleEndMatch: Going back to matches list')
      gameState.setCurrentGameContext(null)
      gameState.setUserRequestedMatchesList(true)
      gameState.setShowMatchesList(true)
      
      gameState.refreshGameData()
      
      setTimeout(() => {
        gameState.setIsEndingGame(false)
        console.log('handleEndMatch: Cleared ending game flag')
      }, 1000)
    } catch (error) {
      console.error('Error ending match:', error)
      showSnackbar('Failed to end match')
      gameState.setIsEndingGame(false)
    }
  }

  const handleEndMatchAndCreateNew = async () => {
    if (!ensureCorrectMatch('End match and create new')) return

    try {
      gameState.setIsEndingGame(true)
      
      const winnerTeam = gameState.teamAScore > gameState.teamBScore ? 'A' : gameState.teamBScore > gameState.teamAScore ? 'B' : null
      await gameState.timer.endMatch(winnerTeam)

      const currentTeamData = gameState.currentTeamData
      
      const createResult = await createMatch({
        teamWithVests: gameState.currentGameContext!.gameData.match.team_with_vests as 'A' | 'B' | null,
        teamAPlayerIds: currentTeamData.teamA.map(player => player.id),
        teamBPlayerIds: currentTeamData.teamB.map(player => player.id),
        teamAGoalkeeperId: gameState.currentGameContext!.gameData.goalkeepers.teamA?.id || null,
        teamBGoalkeeperId: gameState.currentGameContext!.gameData.goalkeepers.teamB?.id || null
      })

      if (createResult.validationErrors || createResult.serverError) {
        showSnackbar('Failed to create new match')
        gameState.setIsEndingGame(false)
        return
      }

      if (createResult.data) {
        const winnerText = winnerTeam ? `Team ${winnerTeam} wins!` : 'Match ended in a tie!'
        showSnackbar(`Match ended successfully. ${winnerText} New match created with same teams!`, 4000)
        
        console.log('handleEndMatchAndCreateNew: Going back to matches list')
        gameState.setCurrentGameContext(null)
        gameState.setUserRequestedMatchesList(true)
        gameState.setShowMatchesList(true)
        
        gameState.refreshGameData()
        
        setTimeout(() => {
          gameState.setIsEndingGame(false)
          console.log('handleEndMatchAndCreateNew: Cleared ending game flag')
        }, 1000)
      }
    } catch (error) {
      console.error('Error ending match and creating new:', error)
      showSnackbar('Failed to end match and create new')
      gameState.setIsEndingGame(false)
    }
  }

  const handleDeleteGame = async () => {
    if (!ensureCorrectMatch('Delete game')) return

    try {
      const result = await deleteMatch({
        matchId: gameState.currentGameContext!.matchId
      })

      if (result.validationErrors || result.serverError) {
        showSnackbar('Failed to delete game')
        return
      }

      showSnackbar('Game deleted successfully')
      
      gameState.setCurrentGameContext(null)
      gameState.setUserRequestedMatchesList(true)
      gameState.setShowMatchesList(true)
      
      gameState.refreshGameData()
    } catch (error) {
      console.error('Error deleting game:', error)
      showSnackbar('Failed to delete game')
    }
  }

  const handleResetGame = async () => {
    if (!ensureCorrectMatch('Reset game')) return

    try {
      const result = await resetMatch({
        matchId: gameState.currentGameContext!.matchId
      })

      if (result.validationErrors || result.serverError) {
        showSnackbar('Failed to reset game')
        return
      }

      showSnackbar('Game reset successfully')
      
      // Immediately update the current game context with reset match data
      if (gameState.currentGameContext) {
        const resetMatch = {
          ...gameState.currentGameContext.gameData.match,
          start_time: new Date().toISOString(),
          match_status: 'paused'
        }
        
        gameState.setCurrentGameContext({
          ...gameState.currentGameContext,
          gameData: {
            ...gameState.currentGameContext.gameData,
            match: resetMatch,
            scores: [] // Clear scores
          }
        })
      }
      
      // Force immediate refetch of game data to get updated timer
      gameState.refreshGameData()
    } catch (error) {
      console.error('Error resetting game:', error)
      showSnackbar('Failed to reset game')
    }
  }

  const handleSwapSides = () => {
    gameState.setIsSidesSwapped(!gameState.isSidesSwapped)
  }

  const handleVestToggle = async (team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Vest toggle')) return
    
    try {
      const currentTeamWithVests = gameState.currentGameContext!.gameData.match.team_with_vests as 'A' | 'B' | null
      const newTeamWithVests = currentTeamWithVests === team ? null : team
      
      if (gameState.currentGameContext?.type === 'planned') {
        const updatedPlannedGame = {
          ...gameState.currentGameContext.gameData,
          match: {
            ...gameState.currentGameContext.gameData.match,
            team_with_vests: newTeamWithVests
          }
        }
        gameState.setCurrentGameContext({
          type: 'planned',
          gameData: updatedPlannedGame,
          matchId: gameState.currentGameContext.matchId
        })
      }
      
      const result = await toggleVests({
        matchId: gameState.currentGameContext!.matchId,
        team: newTeamWithVests
      })
      
      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        if (gameState.currentGameContext?.type === 'planned') {
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: gameState.currentGameContext.gameData,
            matchId: gameState.currentGameContext.matchId
          })
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        if (gameState.currentGameContext?.type === 'planned') {
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: gameState.currentGameContext.gameData,
            matchId: gameState.currentGameContext.matchId
          })
        }
        return
      }

      if (result.data) {
        if (gameState.currentGameContext?.type === 'planned') {
          console.log('Vest toggle successful - keeping local state')
        } else {
          gameState.refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error toggling vests:', error)
      showSnackbar('Failed to update vests')
      if (gameState.currentGameContext?.type === 'planned') {
        gameState.setCurrentGameContext({
          type: 'planned',
          gameData: gameState.currentGameContext.gameData,
          matchId: gameState.currentGameContext.matchId
        })
      }
    }
  }

  const handleAddPlayer = (team: 'A' | 'B', isGoalkeeper: boolean = false) => {
    // For planned games, use multi-selection mode
    if (gameState.currentGameContext?.type === 'planned' && !isGoalkeeper) {
      setShowPlayerSelect({ team, isGoalkeeper, isMultiSelect: true })
    } else {
      setShowPlayerSelect({ team, isGoalkeeper, isMultiSelect: false })
    }
  }

  const handlePlayerSelect = async (player: Player, team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Add player')) return

    try {
      if (gameState.currentGameContext?.type === 'planned') {
        if (showPlayerSelect.isGoalkeeper) {
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...gameState.currentGameContext.gameData,
              goalkeepers: {
                ...gameState.currentGameContext.gameData.goalkeepers,
                [team === 'A' ? 'teamA' : 'teamB']: player
              }
            },
            matchId: gameState.currentGameContext.matchId
          })
        } else {
          if (team === 'A') {
            const newTeamA = [...gameState.localTeamA, player]
            gameState.setLocalTeamA(newTeamA)
            gameState.setCurrentGameContext({
              type: 'planned',
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamA: newTeamA
              },
              matchId: gameState.currentGameContext.matchId
            })
          } else {
            const newTeamB = [...gameState.localTeamB, player]
            gameState.setLocalTeamB(newTeamB)
            gameState.setCurrentGameContext({
              type: 'planned',
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamB: newTeamB
              },
              matchId: gameState.currentGameContext.matchId
            })
          }
        }
      }

      const result = await addPlayerToMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id,
        team,
        isGoalkeeper: showPlayerSelect.isGoalkeeper
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        if (gameState.currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: gameState.currentGameContext.matchId
          })
          gameState.setLocalTeamA([...revertedGameData.teamA])
          gameState.setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        if (gameState.currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: gameState.currentGameContext.matchId
          })
          gameState.setLocalTeamA([...revertedGameData.teamA])
          gameState.setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.data) {
        setShowPlayerSelect({ team: null, isGoalkeeper: false })
        
        if (gameState.currentGameContext?.type !== 'planned') {
          gameState.refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error adding player:', error)
      showSnackbar('Failed to add player')
      
      if (gameState.currentGameContext?.type === 'planned') {
        try {
          const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: gameState.currentGameContext.matchId
          })
          gameState.setLocalTeamA([...revertedGameData.teamA])
          gameState.setLocalTeamB([...revertedGameData.teamB])
        } catch (revertError) {
          console.error('Error reverting state:', revertError)
        }
      }
    }
  }

  const handleMultiPlayerSelect = async (players: Player[], team: 'A' | 'B') => {
    if (!ensureCorrectMatch('Multi-player select')) return

    console.log(`Multi-player select: Team ${team}, ${players.length} players selected:`, players.map(p => p.name))

    try {
      if (gameState.currentGameContext?.type === 'planned') {
        // Get current state
        const currentTeam = team === 'A' ? gameState.currentGameContext.gameData.teamA : gameState.currentGameContext.gameData.teamB
        const currentGoalkeeper = team === 'A' ? gameState.currentGameContext.gameData.goalkeepers.teamA : gameState.currentGameContext.gameData.goalkeepers.teamB
        const otherTeam = team === 'A' ? gameState.currentGameContext.gameData.teamB : gameState.currentGameContext.gameData.teamA
        
        // Create sets for comparison
        const currentPlayerIds = new Set(currentTeam.map(p => p.id))
        const newPlayerIds = new Set(players.map(p => p.id))
        const otherTeamIds = new Set(otherTeam.map(p => p.id))
        
        // Check for goalkeeper unassignment
        if (currentGoalkeeper && !newPlayerIds.has(currentGoalkeeper.id)) {
          console.log(`Removing goalkeeper ${currentGoalkeeper.name} from team ${team}`)
          
          // Update local state immediately to remove goalkeeper
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...gameState.currentGameContext.gameData,
              goalkeepers: {
                ...gameState.currentGameContext.gameData.goalkeepers,
                [team === 'A' ? 'teamA' : 'teamB']: null
              }
            },
            matchId: gameState.currentGameContext.matchId
          })
          
          // Perform database operation asynchronously
          removeGoalkeeper({
            matchId: gameState.currentGameContext!.matchId,
            playerId: currentGoalkeeper.id
          }).then(removeResult => {
            if (removeResult.validationErrors || removeResult.serverError) {
              showSnackbar('Failed to remove goalkeeper')
              // Revert local state on error
              if (gameState.currentGameContext) {
                gameState.setCurrentGameContext({
                  type: 'planned',
                  gameData: {
                    ...gameState.currentGameContext.gameData,
                    goalkeepers: {
                      ...gameState.currentGameContext.gameData.goalkeepers,
                      [team === 'A' ? 'teamA' : 'teamB']: currentGoalkeeper
                    }
                  },
                  matchId: gameState.currentGameContext.matchId
                })
              }
            }
          }).catch(error => {
            console.error('Error removing goalkeeper:', error)
            showSnackbar('Failed to remove goalkeeper')
            // Revert local state on error
            if (gameState.currentGameContext) {
              gameState.setCurrentGameContext({
                type: 'planned',
                gameData: {
                  ...gameState.currentGameContext.gameData,
                  goalkeepers: {
                    ...gameState.currentGameContext.gameData.goalkeepers,
                    [team === 'A' ? 'teamA' : 'teamB']: currentGoalkeeper
                  }
                },
                matchId: gameState.currentGameContext.matchId
              })
            }
          })
        }
        
        // Handle cross-team player movement
        const playersFromOtherTeam = players.filter(p => otherTeamIds.has(p.id))
        for (const player of playersFromOtherTeam) {
          console.log(`Moving player ${player.name} from other team to team ${team}`)
          
          // Update local state immediately to remove from other team
          if (team === 'A') {
            const newTeamB = gameState.localTeamB.filter(p => p.id !== player.id)
            gameState.setLocalTeamB(newTeamB)
            gameState.setCurrentGameContext({
              type: 'planned',
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamB: newTeamB
              },
              matchId: gameState.currentGameContext.matchId
            })
          } else {
            const newTeamA = gameState.localTeamA.filter(p => p.id !== player.id)
            gameState.setLocalTeamA(newTeamA)
            gameState.setCurrentGameContext({
              type: 'planned',
              gameData: {
                ...gameState.currentGameContext.gameData,
                teamA: newTeamA
              },
              matchId: gameState.currentGameContext.matchId
            })
          }
          
          // Update team for player in database asynchronously
          updatePlayerTeam({
            matchId: gameState.currentGameContext.matchId,
            playerId: player.id,
            newTeam: team
          }).then(updateResult => {
            if (updateResult.validationErrors || updateResult.serverError) {
              showSnackbar(`Failed to move player ${player.name}`)
              // Note: We could revert the state here, but since the target team update
              // will handle the final state, we'll let that handle any inconsistencies
            }
          }).catch(error => {
            console.error(`Error moving player ${player.name}:`, error)
            showSnackbar(`Failed to move player ${player.name}`)
          })
        }
        
        // Update the target team
        if (team === 'A') {
          gameState.setLocalTeamA(players)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamA: players
            },
            matchId: gameState.currentGameContext.matchId
          })
        } else {
          gameState.setLocalTeamB(players)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamB: players
            },
            matchId: gameState.currentGameContext.matchId
          })
        }
        
        // Handle database operations for the target team
        // Remove players that are no longer in the team
        for (const playerId of currentPlayerIds) {
          if (!newPlayerIds.has(playerId)) {
            console.log(`Removing player ${playerId} from team ${team}`)
            await removePlayerFromMatch({
              matchId: gameState.currentGameContext.matchId,
              playerId
            })
          }
        }
        
        // Add players that are newly added to the team (excluding those moved from other team)
        const newlyAddedPlayers = players.filter(p => !currentPlayerIds.has(p.id) && !otherTeamIds.has(p.id))
        for (const player of newlyAddedPlayers) {
          console.log(`Adding player ${player.name} to team ${team}`)
          const result = await addPlayerToMatch({
            matchId: gameState.currentGameContext.matchId,
            playerId: player.id,
            team,
            isGoalkeeper: false
          })
          
          if (result.validationErrors || result.serverError) {
            showSnackbar('Failed to add some players')
            return
          }
        }
        

      }

      setShowPlayerSelect({ team: null, isGoalkeeper: false })
      
      if (gameState.currentGameContext?.type !== 'planned') {
        gameState.refreshGameData()
      }
    } catch (error) {
      console.error('Error updating team players:', error)
      showSnackbar('Failed to update team players')
      
      if (gameState.currentGameContext?.type === 'planned') {
        const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
        gameState.setCurrentGameContext({
          type: 'planned',
          gameData: revertedGameData,
          matchId: gameState.currentGameContext.matchId
        })
        gameState.setLocalTeamA([...revertedGameData.teamA])
        gameState.setLocalTeamB([...revertedGameData.teamB])
      }
    }
  }

  const handleRemovePlayer = async (player: Player) => {
    if (!ensureCorrectMatch('Remove player')) return

    try {
      if (gameState.currentGameContext?.type === 'planned') {
        const playerInTeamA = gameState.localTeamA.find(p => p.id === player.id)
        const playerInTeamB = gameState.localTeamB.find(p => p.id === player.id)
        
        if (playerInTeamA) {
          const newTeamA = gameState.localTeamA.filter(p => p.id !== player.id)
          gameState.setLocalTeamA(newTeamA)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamA: newTeamA
            },
            matchId: gameState.currentGameContext.matchId
          })
        } else if (playerInTeamB) {
          const newTeamB = gameState.localTeamB.filter(p => p.id !== player.id)
          gameState.setLocalTeamB(newTeamB)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: {
              ...gameState.currentGameContext.gameData,
              teamB: newTeamB
            },
            matchId: gameState.currentGameContext.matchId
          })
        }
      }

      const result = await removePlayerFromMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id
      })

      if (result.validationErrors) {
        showSnackbar('Invalid input data')
        if (gameState.currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: gameState.currentGameContext.matchId
          })
          gameState.setLocalTeamA([...revertedGameData.teamA])
          gameState.setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.serverError) {
        showSnackbar(result.serverError)
        if (gameState.currentGameContext?.type === 'planned') {
          const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: revertedGameData,
            matchId: gameState.currentGameContext.matchId
          })
          gameState.setLocalTeamA([...revertedGameData.teamA])
          gameState.setLocalTeamB([...revertedGameData.teamB])
        }
        return
      }

      if (result.data) {
        if (gameState.currentGameContext?.type !== 'planned') {
          gameState.refreshGameData()
        }
      }
    } catch (error) {
      console.error('Error removing player:', error)
      showSnackbar('Failed to remove player')
      
      if (gameState.currentGameContext?.type === 'planned') {
        const revertedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
        gameState.setCurrentGameContext({
          type: 'planned',
          gameData: revertedGameData,
          matchId: gameState.currentGameContext.matchId
        })
        gameState.setLocalTeamA([...revertedGameData.teamA])
        gameState.setLocalTeamB([...revertedGameData.teamB])
      }
    }
  }

  const handleSwitchPlayerTeam = async (player: Player, newTeam: 'A' | 'B', newIndex?: number) => {
    if (!ensureCorrectMatch('Switch player team')) return

    try {
      const teamA = gameState.localTeamA.length > 0 ? gameState.localTeamA : gameState.currentGameContext!.gameData.teamA
      const teamB = gameState.localTeamB.length > 0 ? gameState.localTeamB : gameState.currentGameContext!.gameData.teamB
      
      const currentTeamA = teamA.find(p => p.id === player.id)
      const currentTeamB = teamB.find(p => p.id === player.id)
      
      const isGoalkeeperA = gameState.currentGameContext!.gameData.goalkeepers.teamA?.id === player.id
      const isGoalkeeperB = gameState.currentGameContext!.gameData.goalkeepers.teamB?.id === player.id
      
      let currentTeam: 'A' | 'B' | null = null
      if (currentTeamA) currentTeam = 'A'
      else if (currentTeamB) currentTeam = 'B'
      else if (isGoalkeeperA) currentTeam = 'A'
      else if (isGoalkeeperB) currentTeam = 'B'
      
      if (!currentTeam) {
        console.error(`Player ${player.name} (${player.id}) not found in any team`)
        showSnackbar('Player not found in any team')
        return
      }
      
      const isCurrentlyGoalkeeper = isGoalkeeperA || isGoalkeeperB

      if (newIndex !== undefined) {
        // Handle goalkeeper to field movement
        if (isCurrentlyGoalkeeper && newIndex >= 0) {
          if (currentTeam === newTeam) {
            if (currentTeam === 'A') {
              const newTeamA = [...gameState.localTeamA]
              newTeamA.splice(newIndex, 0, player)
              updateTeamStateAndGoalkeeper(newTeamA, gameState.localTeamB, currentTeam, null)
            } else {
              const newTeamB = [...gameState.localTeamB]
              newTeamB.splice(newIndex, 0, player)
              updateTeamStateAndGoalkeeper(gameState.localTeamA, newTeamB, currentTeam, null)
            }
          } else {
            if (newTeam === 'A') {
              const newTeamA = [...gameState.localTeamA]
              newTeamA.splice(newIndex, 0, player)
              updateTeamStateAndGoalkeeper(newTeamA, gameState.localTeamB, currentTeam, null)
            } else {
              const newTeamB = [...gameState.localTeamB]
              newTeamB.splice(newIndex, 0, player)
              updateTeamStateAndGoalkeeper(gameState.localTeamA, newTeamB, currentTeam, null)
            }
          }
          
          Promise.all([
            removeGoalkeeper({
              matchId: gameState.currentGameContext!.matchId,
              playerId: player.id
            }),
            addPlayerToField({
              matchId: gameState.currentGameContext!.matchId,
              playerId: player.id,
              team: newTeam
            })
          ]).then(([removeResult, addResult]) => {
            if (removeResult.validationErrors || removeResult.serverError || 
                addResult.validationErrors || addResult.serverError) {
              console.error('Failed to move goalkeeper to field')
              showSnackbar('Warning: Goalkeeper move may not be saved')
            }
          }).catch(error => {
            console.error('Error moving goalkeeper to field:', error)
            showSnackbar('Failed to move goalkeeper to field position')
          })
          
          return
        }
        
        // Handle goalkeeper assignment
        if (newIndex === -1) {
          const isGoalkeeperSwap = isCurrentlyGoalkeeper && currentTeam !== newTeam
          
          if (isGoalkeeperSwap) {
            const otherGoalkeeper = gameState.currentGameContext!.gameData.goalkeepers[newTeam === 'A' ? 'teamA' : 'teamB']
            
            let newTeamA = [...gameState.localTeamA]
            let newTeamB = [...gameState.localTeamB]
            
            newTeamA = newTeamA.filter(p => p.id !== player.id && p.id !== otherGoalkeeper?.id)
            newTeamB = newTeamB.filter(p => p.id !== player.id && p.id !== otherGoalkeeper?.id)
            
            if (otherGoalkeeper) {
              if (currentTeam === 'A') {
                newTeamA.push(otherGoalkeeper)
              } else {
                newTeamB.push(otherGoalkeeper)
              }
            }
            
            updateTeamState(newTeamA, newTeamB)
            
            if (gameState.currentGameContext) {
              gameState.setCurrentGameContext({
                ...gameState.currentGameContext,
                gameData: {
                  ...gameState.currentGameContext.gameData,
                  goalkeepers: {
                    ...gameState.currentGameContext.gameData.goalkeepers,
                    [newTeam === 'A' ? 'teamA' : 'teamB']: player,
                    [currentTeam === 'A' ? 'teamA' : 'teamB']: otherGoalkeeper || null
                  }
                }
              })
            }
            
            Promise.all([
              assignGoalkeeper({
                matchId: gameState.currentGameContext!.matchId,
                playerId: player.id,
                team: newTeam
              }),
              otherGoalkeeper ? assignGoalkeeper({
                matchId: gameState.currentGameContext!.matchId,
                playerId: otherGoalkeeper.id,
                team: currentTeam
              }) : Promise.resolve({ validationErrors: null, serverError: null })
            ]).then(([assignResult1, assignResult2]) => {
              if (assignResult1.validationErrors || assignResult1.serverError || 
                  assignResult2.validationErrors || assignResult2.serverError) {
                console.error('Failed to swap goalkeepers in database')
                showSnackbar('Warning: Goalkeeper swap may not be saved')
              }
            }).catch(error => {
              console.error('Error swapping goalkeepers:', error)
              showSnackbar('Failed to swap goalkeepers')
            })
            
          } else {
            const currentGoalkeeper = gameState.currentGameContext!.gameData.goalkeepers[newTeam === 'A' ? 'teamA' : 'teamB']
            
            let newTeamA = [...gameState.localTeamA]
            let newTeamB = [...gameState.localTeamB]
            
            if (currentTeam === 'A') {
              newTeamA = newTeamA.filter(p => p.id !== player.id)
            } else {
              newTeamB = newTeamB.filter(p => p.id !== player.id)
            }
            
            if (currentGoalkeeper) {
              newTeamA = newTeamA.filter(p => p.id !== currentGoalkeeper.id)
              newTeamB = newTeamB.filter(p => p.id !== currentGoalkeeper.id)
              
              if (newTeam === 'A') {
                newTeamA.push(currentGoalkeeper)
              } else {
                newTeamB.push(currentGoalkeeper)
              }
            }
            
            updateTeamStateAndGoalkeeper(newTeamA, newTeamB, newTeam, player)

            assignGoalkeeper({
              matchId: gameState.currentGameContext!.matchId,
              playerId: player.id,
              team: newTeam
            }).then(assignResult => {
              if (assignResult.validationErrors || assignResult.serverError) {
                console.error('Failed to assign goalkeeper to database')
                showSnackbar('Warning: Goalkeeper assignment may not be saved')
              }
            }).catch(error => {
              console.error('Error assigning goalkeeper:', error)
              showSnackbar('Failed to assign goalkeeper')
            })
          }
          
          return
        }
        
        // Handle field player movement
        if (currentTeam === newTeam) {
          if (currentTeam === 'A') {
            const currentIndex = gameState.localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...gameState.localTeamA]
              const originalLength = newTeamA.length
              newTeamA.splice(currentIndex, 1)
              
              let adjustedIndex = newIndex
              if (currentIndex < newIndex) {
                if (newIndex === originalLength - 1) {
                  adjustedIndex = newTeamA.length
                } else {
                  adjustedIndex = newIndex - 1
                }
              }
              
              newTeamA.splice(adjustedIndex, 0, player)
              updateTeamState(newTeamA, gameState.localTeamB)
            }
          } else {
            const currentIndex = gameState.localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...gameState.localTeamB]
              const originalLength = newTeamB.length
              newTeamB.splice(currentIndex, 1)
              
              let adjustedIndex = newIndex
              if (currentIndex < newIndex) {
                if (newIndex === originalLength - 1) {
                  adjustedIndex = newTeamB.length
                } else {
                  adjustedIndex = newIndex - 1
                }
              }
              
              newTeamB.splice(adjustedIndex, 0, player)
              updateTeamState(gameState.localTeamA, newTeamB)
            }
          }
          
        } else {
          if (currentTeam === 'A' && newTeam === 'B') {
            const currentIndex = gameState.localTeamA.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamA = [...gameState.localTeamA]
              newTeamA.splice(currentIndex, 1)
              
              const newTeamB = [...gameState.localTeamB]
              newTeamB.splice(newIndex, 0, player)
              
              updateTeamState(newTeamA, newTeamB)
            }
          } else if (currentTeam === 'B' && newTeam === 'A') {
            const currentIndex = gameState.localTeamB.findIndex(p => p.id === player.id)
            if (currentIndex !== -1) {
              const newTeamB = [...gameState.localTeamB]
              newTeamB.splice(currentIndex, 1)
              
              const newTeamA = [...gameState.localTeamA]
              newTeamA.splice(newIndex, 0, player)
              
              updateTeamState(newTeamA, newTeamB)
            }
          }
          
          updatePlayerTeam({
            matchId: gameState.currentGameContext!.matchId,
            playerId: player.id,
            newTeam: newTeam
          }).then(result => {
            if (result.validationErrors || result.serverError) {
              console.error('Failed to sync team change to database')
              showSnackbar('Warning: Team change may not be saved')
            }
          }).catch(error => {
            console.error('Error syncing team change to database:', error)
            showSnackbar('Warning: Team change may not be saved')
          })
        }
        
        return
      }

      // Fallback to server operations
      const removeResult = await removePlayerFromMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id
      })

      if (removeResult.validationErrors || removeResult.serverError) {
        showSnackbar('Failed to remove player from current team')
        return
      }

      const addResult = await addPlayerToMatch({
        matchId: gameState.currentGameContext!.matchId,
        playerId: player.id,
        team: newTeam,
        isGoalkeeper: false
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
        if (gameState.currentGameContext?.type === 'planned') {
          const updatedGameData = await convertPlannedGameToActiveGameData(gameState.currentGameContext.gameData.match)
          gameState.setCurrentGameContext({
            type: 'planned',
            gameData: updatedGameData,
            matchId: updatedGameData.match.id
          })
        } else {
          gameState.refreshGameData()
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
      gameState.setCurrentGameContext({
        type: 'planned',
        gameData: gameData,
        matchId: game.id
      })
    } catch (error) {
      console.error('Error loading planned game:', error)
      showSnackbar('Failed to load planned game')
    }
  }

  const handleStartPlannedGame = async () => {
    if (!ensureCorrectMatch('Start planned game')) return

    console.log(`Starting planned game ${gameState.currentGameContext!.gameData.match.gameCount || 'N/A'}...`)

    gameState.setIsStartingGame(true)
    gameState.setStartingGameId(gameState.currentGameContext!.matchId)

    const updatedGameData = {
      ...gameState.currentGameContext!.gameData,
      match: {
        ...gameState.currentGameContext!.gameData.match,
        match_status: 'active' as const,
        start_time: new Date().toISOString()
      }
    }
    gameState.setCurrentGameContext({
      type: 'active',
      gameData: updatedGameData,
      matchId: gameState.currentGameContext!.matchId
    })

    console.log('Updated local context to active, now updating database in background...')

    gameState.setIsStartingGame(false)
    gameState.setStartingGameId(null)

    controlMatch({
      matchId: gameState.currentGameContext!.gameData.match.id,
      action: 'start'
    }).then(result => {
      if (result.validationErrors || result.serverError) {
        console.error('Database update failed:', result.validationErrors || result.serverError)
        showSnackbar('Warning: Game start may not be saved')
      } else {
        console.log('Database update successful')
      }
    }).catch(error => {
      console.error('Error starting game:', error)
      showSnackbar('Warning: Game start may not be saved')
    })
  }

  const handleBackToMatchesList = () => {
    gameState.setCurrentGameContext(null)
    gameState.setUserRequestedMatchesList(true)
    gameState.setShowMatchesList(true)
    gameState.refreshGameData()
  }

  const handleSelectGame = async (game: Match) => {
    try {
      console.log(`Selecting game: ${game.gameCount || 'N/A'} (${game.match_status})`)
      gameState.setUserRequestedMatchesList(false)
      
      if (gameState.isEndingGame) {
        console.log('handleSelectGame: Clearing ending game flag due to new game selection')
        gameState.setIsEndingGame(false)
      }
      
      gameState.setSelectedGameId(game.id)
      
      const gameData = await convertPlannedGameToActiveGameData(game)
      
      const contextType = (game.match_status === 'active' || game.match_status === 'paused') ? 'active' : 'planned'
      
      console.log(`Setting game context to ${contextType} for game ${game.gameCount || 'N/A'}...`)
      
      gameState.setCurrentGameContext({
        type: contextType,
        gameData: gameData,
        matchId: game.id
      })
      gameState.setShowMatchesList(false)
      
    } catch (error) {
      console.error('Error loading game:', error)
      showSnackbar('Failed to load game')
    }
  }

  const handleCreateNewGame = async () => {
    gameState.setIsCreatingGame(true)
    try {
      if (gameState.isEndingGame) {
        console.log('handleCreateNewGame: Clearing ending game flag due to new game creation')
        gameState.setIsEndingGame(false)
      }
      
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
        gameState.refreshGameData()
      }
    } catch (error) {
      showSnackbar('Failed to create game', 4000)
    } finally {
      gameState.setIsCreatingGame(false)
    }
  }

  // Get available players for selection
  const availablePlayersForSelection = gameState.currentGameContext 
    ? (gameState.currentGameContext.type === 'planned' && showPlayerSelect.isMultiSelect)
      ? gameState.availablePlayers // For planned games with multi-selection, show all players
      : getAvailablePlayersForSelection(gameState.availablePlayers, gameState.currentGameContext.gameData.teamA, gameState.currentGameContext.gameData.teamB, gameState.currentGameContext.gameData.goalkeepers)
    : gameState.availablePlayers

  return {
    // Dialog states
    showPlayerSelect,
    goalDialog,
    
    // Actions
    handleScoreIncrement,
    handleGoalDialogPlayerClick,
    handleGoalDialogSubmit,
    handleGoalDialogCancel,
    removeSelectedPlayer,
    handlePauseToggle,
    handleEndMatch,
    handleEndMatchAndCreateNew,
    handleDeleteGame,
    handleResetGame,
    handleSwapSides,
    handleVestToggle,
    handleAddPlayer,
    handlePlayerSelect,
    handleMultiPlayerSelect,
    handleClosePlayerSelect,
    handleSelectPlannedGame,
    handleStartPlannedGame,
    handleBackToMatchesList,
    handleSelectGame,
    handleCreateNewGame,
    handleSwitchPlayerTeam,
    handleRemovePlayer,
    
    // Helper functions
    updateTeamState,
    updateTeamStateAndGoalkeeper,
    ensureCorrectMatch,
    
    // Computed values
    availablePlayersForSelection
  }
} 