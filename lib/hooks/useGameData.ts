import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import type { ActiveGameData, Player } from '../types'

export function useGameData() {
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null)
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  // Load available players
  const loadAvailablePlayers = async () => {
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

  // Load active game data
  const loadActiveGame = async () => {
    try {
      setLoading(true)
      // Get active or paused match
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['active', 'paused'])
        .single()

      if (!match) {
        setActiveGame(null)
        return
      }

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
          .filter(mp => mp.team === 'A' && !mp.is_goalkeeper)
          .map(mp => mp.players)
          .filter(Boolean) as Player[]
        
        const teamB = matchPlayers
          .filter(mp => mp.team === 'B' && !mp.is_goalkeeper)
          .map(mp => mp.players)
          .filter(Boolean) as Player[]

        // Get goalkeepers from the database is_goalkeeper field
        const goalkeepers = {
          teamA: matchPlayers.find(mp => mp.team === 'A' && mp.is_goalkeeper)?.players || null,
          teamB: matchPlayers.find(mp => mp.team === 'B' && mp.is_goalkeeper)?.players || null
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
      setActiveGame(null)
    } finally {
      setLoading(false)
    }
  }

  // Refresh game data
  const refreshGameData = () => {
    loadActiveGame()
  }

  useEffect(() => {
    loadAvailablePlayers()
    loadActiveGame()
  }, [])

  return {
    activeGame,
    availablePlayers,
    loading,
    setActiveGame,
    refreshGameData
  }
} 