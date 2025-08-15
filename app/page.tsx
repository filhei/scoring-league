'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useMatchTimer } from '../lib/hooks/useMatchTimer'
import { useGameData } from '../lib/hooks/useGameData'
import { useSnackbar } from '../lib/hooks/useSnackbar'
import { MatchService } from '../lib/match-service'
import { getTeamScore, getAvailablePlayersForSelection } from '../lib/game-utils'
import type { GoalDialogState, PlayerSelectState, Player } from '../lib/types'

// Components
import { Navigation } from '../components/Navigation'
import { NoActiveGame } from '../components/NoActiveGame'
import { ActiveGame } from '../components/ActiveGame'
import { PlayerSelectModal } from '../components/PlayerSelectModal'
import { GoalDialog } from '../components/GoalDialog'
import { Snackbar } from '../components/Snackbar'

export default function Home() {
  // Custom hooks
  const { activeGame, availablePlayers, loading, setActiveGame, refreshGameData } = useGameData()
  const { snackbar, showSnackbar } = useSnackbar()
  
  // Local state
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSidesSwapped, setIsSidesSwapped] = useState(false)
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
  
  // Timer hook
  const timer = useMatchTimer(activeGame?.match || null, (updatedMatch) => {
    setActiveGame(prev => prev ? { ...prev, match: updatedMatch } : null)
  })

  // Calculate scores
  const teamAScore = activeGame ? getTeamScore(activeGame.scores, 'A') : 0
  const teamBScore = activeGame ? getTeamScore(activeGame.scores, 'B') : 0

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
      
      // If player is already scoring, cycle to assist (if available) or null
      if (isScoring) {
        if (!prev.assistingPlayer) {
          return { ...prev, scoringPlayer: null, assistingPlayer: player }
        } else {
          return { ...prev, scoringPlayer: null }
        }
      }
      
      // If player is already assisting, cycle to null
      if (isAssisting) {
        return { ...prev, assistingPlayer: null }
      }
      
      // Player is not selected - cycle through available roles
      // First try to assign as scoring player
      if (!prev.scoringPlayer) {
        return { ...prev, scoringPlayer: player }
      }
      
      // If scoring is taken, try assist
      if (!prev.assistingPlayer) {
        return { ...prev, assistingPlayer: player }
      }
      
      // Both positions filled - show snackbar and don't change anything
      showSnackbar('Bara en målgörare och assisterande spelare kan väljas')
      return prev
    })
  }

  const handleGoalDialogSubmit = async () => {
    if (!activeGame || !goalDialog.team) return

    try {
      // Calculate current game time for the score
      const currentDuration = MatchService.calculateCurrentDuration(activeGame.match)
      
      await supabase
        .from('scores')
        .insert({
          match_id: activeGame.match.id,
          team: goalDialog.team,
          score_time: `${currentDuration} seconds`,
          scoring_player_id: goalDialog.scoringPlayer?.id || null,
          assisting_player_id: goalDialog.assistingPlayer?.id || null
        })

      // Close dialog and refresh game data
      setGoalDialog({ isOpen: false, team: null, scoringPlayer: null, assistingPlayer: null })
      refreshGameData()
    } catch (error) {
      console.error('Error adding score:', error)
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
      setActiveGame(null)
    } catch (error) {
      console.error('Error ending match:', error)
    }
  }

  const handleSwapSides = () => {
    setIsSidesSwapped(!isSidesSwapped)
  }

  const handleAddPlayer = (team: 'A' | 'B', isGoalkeeper: boolean = false) => {
    setShowPlayerSelect({ team, isGoalkeeper })
  }

  const handlePlayerSelect = async (player: Player, team: 'A' | 'B') => {
    if (!activeGame) return

    try {
      await supabase
        .from('match_players')
        .insert({
          match_id: activeGame.match.id,
          player_id: player.id,
          team,
          is_goalkeeper: showPlayerSelect.isGoalkeeper
        })

      // Refresh game data
      refreshGameData()
    } catch (error) {
      console.error('Error adding player:', error)
    }
  }

  const handleRemovePlayer = async (player: Player) => {
    if (!activeGame) return

    try {
      await supabase
        .from('match_players')
        .delete()
        .eq('match_id', activeGame.match.id)
        .eq('player_id', player.id)

      // Refresh game data
      refreshGameData()
    } catch (error) {
      console.error('Error removing player:', error)
    }
  }

  const handleClosePlayerSelect = () => {
    setShowPlayerSelect({ team: null, isGoalkeeper: false })
  }

  // Get available players for selection
  const availablePlayersForSelection = activeGame 
    ? getAvailablePlayersForSelection(availablePlayers, activeGame.teamA, activeGame.teamB, activeGame.goalkeepers)
    : availablePlayers

  if (loading) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <div className="text-xl">Loading...</div>
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

      {!activeGame ? (
        <NoActiveGame isDarkMode={isDarkMode} />
      ) : (
        <ActiveGame
          activeGame={activeGame}
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
        />
      )}

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
