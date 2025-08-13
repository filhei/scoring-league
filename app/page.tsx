'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useMatchTimer } from '../lib/hooks/useMatchTimer'
import { MatchService } from '../lib/match-service'
import type { Database } from '../supabase/database.types'

type Match = Database['public']['Tables']['matches']['Row']
type Player = Database['public']['Tables']['players']['Row']
type MatchPlayer = Database['public']['Tables']['match_players']['Row']
type Score = Database['public']['Tables']['scores']['Row']

interface ActiveGameData {
  match: Match
  teamA: Player[]
  teamB: Player[]
  scores: Score[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
}

export default function Home() {
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [showPlayerSelect, setShowPlayerSelect] = useState<{ team: 'A' | 'B' | null; isGoalkeeper: boolean }>({ team: null, isGoalkeeper: false })
  
  // Use the new timer hook
  const timer = useMatchTimer(activeGame?.match || null, (updatedMatch) => {
    setActiveGame(prev => prev ? { ...prev, match: updatedMatch } : null)
  })

  // Calculate scores for each team
  const teamAScore = activeGame?.scores.filter(score => score.team === 'A').length || 0
  const teamBScore = activeGame?.scores.filter(score => score.team === 'B').length || 0



  // Load available players
  useEffect(() => {
    async function loadAvailablePlayers() {
      try {
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .eq('is_active', true)

        if (players) {
          setAvailablePlayers(players)
        }
      } catch (error) {
        console.error('Error loading available players:', error)
      }
    }

    loadAvailablePlayers()
  }, [])

  // Load active game data
  useEffect(() => {
    async function loadActiveGame() {
      try {
        // Get active or paused match
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .in('status', ['active', 'paused'])
          .single()

        if (!match) return

        // Get match players
        const { data: matchPlayers } = await supabase
          .from('match_players')
          .select(`
            *,
            players (*)
          `)
          .eq('match_id', match.id)

        // Get scores
        const { data: scores } = await supabase
          .from('scores')
          .select('*')
          .eq('match_id', match.id)

        if (matchPlayers) {
          const teamA = matchPlayers
            .filter(mp => mp.team === 'A')
            .map(mp => mp.players)
            .filter(Boolean) as Player[]
          
          const teamB = matchPlayers
            .filter(mp => mp.team === 'B')
            .map(mp => mp.players)
            .filter(Boolean) as Player[]

          // For now, we'll assume the first player in each team is the goalkeeper
          // In a real app, you'd have a separate field for this
          const goalkeepers = {
            teamA: teamA[0] || null,
            teamB: teamB[0] || null
          }

          setActiveGame({
            match,
            teamA,
            teamB,
            scores: scores || [],
            goalkeepers
          })
        }
      } catch (error) {
        console.error('Error loading active game:', error)
      }
    }

    loadActiveGame()
  }, [])



  const handleScoreIncrement = async (team: 'A' | 'B') => {
    if (!activeGame) return

    try {
      // Calculate current game time for the score
      const currentDuration = MatchService.calculateCurrentDuration(activeGame.match)
      
      await supabase
        .from('scores')
        .insert({
          match_id: activeGame.match.id,
          team,
          score_time: `${currentDuration} seconds`
        })

      // Refresh game data
      window.location.reload()
    } catch (error) {
      console.error('Error adding score:', error)
    }
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

  const handleSwapSides = async () => {
    if (!activeGame) return

    try {
      // Get all match players
      const { data: matchPlayers } = await supabase
        .from('match_players')
        .select('*')
        .eq('match_id', activeGame.match.id)

      if (!matchPlayers) return

      // Swap teams
      for (const player of matchPlayers) {
        const newTeam = player.team === 'A' ? 'B' : 'A'
        await supabase
          .from('match_players')
          .update({ team: newTeam })
          .eq('id', player.id)
      }

      // Refresh game data
      window.location.reload()
    } catch (error) {
      console.error('Error swapping sides:', error)
    }
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
          team
        })

      // Refresh game data
      window.location.reload()
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
      window.location.reload()
    } catch (error) {
      console.error('Error removing player:', error)
    }
  }

  // Get players not in the current match
  const getAvailablePlayersForSelection = () => {
    if (!activeGame) return availablePlayers

    const currentPlayerIds = [...activeGame.teamA, ...activeGame.teamB].map(p => p.id)
    return availablePlayers.filter(p => !currentPlayerIds.includes(p.id))
  }

  if (!activeGame) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Scoring League</h1>
            <p className="text-gray-600">No active game found. Start a new match to see the game status here.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Active Game Pane */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Title Row with Meatball Menu */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Active Game</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <div className="flex flex-col space-y-1">
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              </div>
            </button>
          </div>

          {/* Game Time and Pause */}
          <div className="relative flex justify-center items-center mb-6">
            <div className="text-3xl font-mono font-bold text-gray-800">
              {timer.formattedTime}
            </div>
            <div className="absolute left-1/2 ml-32 flex items-center">
              <button
                onClick={handlePauseToggle}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors mr-2"
              >
                {timer.isPaused ? (
                  <div className="w-0 h-0 border-l-[6px] border-l-gray-600 border-y-[4px] border-y-transparent ml-0.5"></div>
                ) : (
                  <div className="flex space-x-0.5">
                    <div className="w-1 h-4 bg-gray-600"></div>
                    <div className="w-1 h-4 bg-gray-600"></div>
                  </div>
                )}
              </button>
              <span className="text-gray-700 text-sm w-12">{timer.isPaused ? 'Resume' : 'Pause'}</span>
            </div>
          </div>

          {/* Score Row */}
          <div className="flex justify-center items-center space-x-6 mb-6">
            <button
              onClick={() => handleScoreIncrement('A')}
              className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold transition-colors"
            >
              +
            </button>
            <div className="text-4xl font-bold text-gray-800">
              {teamAScore} - {teamBScore}
            </div>
            <button
              onClick={() => handleScoreIncrement('B')}
              className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xl font-bold transition-colors"
            >
              +
            </button>
          </div>

          {/* End Match Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleEndMatch}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Avsluta Match
            </button>
          </div>

          {/* Teams Row */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-blue-600">Team A</h3>
            <button
              onClick={handleSwapSides}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <span>⇄</span>
              <span>Swap Sides</span>
            </button>
            <h3 className="text-lg font-semibold text-red-600">Team B</h3>
          </div>

          {/* Teams Display */}
          <div className="grid grid-cols-2 gap-6">
            {/* Team A */}
            <div className="space-y-3">
              {/* Goalkeeper */}
              <div 
                className={`p-3 bg-blue-50 border-2 border-blue-200 rounded-lg ${
                  !activeGame.goalkeepers.teamA ? 'cursor-pointer hover:bg-blue-100' : ''
                }`}
                onClick={() => !activeGame.goalkeepers.teamA && handleAddPlayer('A', true)}
              >
                <div className="text-sm font-semibold text-blue-800 mb-1">Målvakt</div>
                {activeGame.goalkeepers.teamA ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{activeGame.goalkeepers.teamA.name}</div>
                      <div className="text-sm text-gray-500">ELO: {activeGame.goalkeepers.teamA.elo}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePlayer(activeGame.goalkeepers.teamA!)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">Ingen Målvakt - Klicka för att välja</div>
                )}
              </div>
              
              {/* Field Players */}
              {activeGame.teamA.filter(p => p.id !== activeGame.goalkeepers.teamA?.id).map((player) => (
                <div key={player.id} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{player.name}</div>
                    <div className="text-sm text-gray-500">ELO: {player.elo}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(player)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Add Player Button */}
              <button 
                onClick={() => handleAddPlayer('A', false)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Player
              </button>
            </div>

            {/* Team B */}
            <div className="space-y-3">
              {/* Goalkeeper */}
              <div 
                className={`p-3 bg-red-50 border-2 border-red-200 rounded-lg ${
                  !activeGame.goalkeepers.teamB ? 'cursor-pointer hover:bg-red-100' : ''
                }`}
                onClick={() => !activeGame.goalkeepers.teamB && handleAddPlayer('B', true)}
              >
                <div className="text-sm font-semibold text-red-800 mb-1">Målvakt</div>
                {activeGame.goalkeepers.teamB ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">{activeGame.goalkeepers.teamB.name}</div>
                      <div className="text-sm text-gray-500">ELO: {activeGame.goalkeepers.teamB.elo}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemovePlayer(activeGame.goalkeepers.teamB!)
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">Ingen Målvakt - Klicka för att välja</div>
                )}
              </div>
              
              {/* Field Players */}
              {activeGame.teamB.filter(p => p.id !== activeGame.goalkeepers.teamB?.id).map((player) => (
                <div key={player.id} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{player.name}</div>
                    <div className="text-sm text-gray-500">ELO: {player.elo}</div>
                  </div>
                  <button
                    onClick={() => handleRemovePlayer(player)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {/* Add Player Button */}
              <button 
                onClick={() => handleAddPlayer('B', false)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors"
              >
                + Add Player
              </button>
            </div>
          </div>
        </div>

        {/* Player Selection Modal */}
        {showPlayerSelect.team && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Select {showPlayerSelect.isGoalkeeper ? 'Goalkeeper' : 'Player'} for Team {showPlayerSelect.team}
              </h3>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {getAvailablePlayersForSelection().map((player) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      handlePlayerSelect(player, showPlayerSelect.team!)
                      setShowPlayerSelect({ team: null, isGoalkeeper: false })
                    }}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium text-gray-800">{player.name}</div>
                    <div className="text-sm text-gray-500">ELO: {player.elo}</div>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowPlayerSelect({ team: null, isGoalkeeper: false })}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
