import React from 'react'
import type { Score, Player } from '../../lib/types'
import { MatchService } from '../../lib/match-service'

interface ScorersDisplayProps {
  scores: Score[]
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
  isDarkMode: boolean
}

interface PlayerScore {
  player: Player
  times: number[]
  isOwnGoal: boolean
}

function processScoresForTeam(
  scores: Score[], 
  team: 'A' | 'B', 
  allPlayers: Player[], 
  goalkeepers: { teamA: Player | null; teamB: Player | null },
  opposingTeamPlayers: Player[],
  opposingTeamGoalkeepers: { teamA: Player | null; teamB: Player | null }
): PlayerScore[] {
  const teamScores = scores.filter(score => score.team === team)
  
  const playerScoreMap = new Map<string, PlayerScore>()
  
  teamScores.forEach(score => {
    // Convert score_time from interval to minutes using proper parsing
    const timeInSeconds = MatchService.parseInterval(score.score_time)
    const timeInMinutes = Math.floor(timeInSeconds / 60)
    
    // Handle goals without a scorer
    if (!score.scoring_player_id) {
      const noScorerKey = 'no-scorer'
      if (playerScoreMap.has(noScorerKey)) {
        playerScoreMap.get(noScorerKey)!.times.push(timeInMinutes)
      } else {
        playerScoreMap.set(noScorerKey, {
          player: { id: 'no-scorer', name: 'Mål', elo: null, is_active: null, created_at: null, user_id: null },
          times: [timeInMinutes],
          isOwnGoal: false
        })
      }
      return
    }
    
    // First check regular team players
    let player = allPlayers.find(p => p.id === score.scoring_player_id)
    let isOwnGoal = false
    
    // If not found, check goalkeepers
    if (!player) {
      const teamGoalkeeper = team === 'A' ? goalkeepers.teamA : goalkeepers.teamB
      if (teamGoalkeeper && teamGoalkeeper.id === score.scoring_player_id) {
        player = teamGoalkeeper
      }
    }
    
    // If still not found, check opposing team players (own goal)
    if (!player) {
      player = opposingTeamPlayers.find(p => p.id === score.scoring_player_id)
      if (player) {
        isOwnGoal = true
      }
    }
    
    // If still not found, check opposing team goalkeepers (own goal)
    if (!player) {
      const opposingTeamGoalkeeper = team === 'A' ? opposingTeamGoalkeepers.teamB : opposingTeamGoalkeepers.teamA
      if (opposingTeamGoalkeeper && opposingTeamGoalkeeper.id === score.scoring_player_id) {
        player = opposingTeamGoalkeeper
        isOwnGoal = true
      }
    }
    
    if (!player) return
    
    if (playerScoreMap.has(player.id)) {
      const existing = playerScoreMap.get(player.id)!
      existing.times.push(timeInMinutes)
      // If any goal is an own goal, mark the player as having own goals
      if (isOwnGoal) {
        existing.isOwnGoal = true
      }
    } else {
      playerScoreMap.set(player.id, {
        player,
        times: [timeInMinutes],
        isOwnGoal
      })
    }
  })
  
  // Sort times for each player and return sorted array
  return Array.from(playerScoreMap.values())
    .map(playerScore => ({
      ...playerScore,
      times: playerScore.times.sort((a, b) => a - b)
    }))
    .sort((a, b) => a.times[0] - b.times[0]) // Sort by first goal time
}

export function ScorersDisplay({ scores, teamAPlayers, teamBPlayers, goalkeepers, isDarkMode }: ScorersDisplayProps) {
  const teamAScorers = processScoresForTeam(scores, 'A', teamAPlayers, goalkeepers, teamBPlayers, goalkeepers)
  const teamBScorers = processScoresForTeam(scores, 'B', teamBPlayers, goalkeepers, teamAPlayers, goalkeepers)
  
  // Don't render if no goals scored
  if (teamAScorers.length === 0 && teamBScorers.length === 0) {
    return null
  }
  
  const renderScorerList = (scorers: PlayerScore[]) => (
    <div className="space-y-1">
      {scorers.map(({ player, times, isOwnGoal }) => (
        <div key={player.id} className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <span className="font-medium">
            {player.name}
            {isOwnGoal && <span className="ml-1">*</span>}
          </span>
          <span className="ml-1">
            {times.map(time => `${time}'`).join(', ')}
          </span>
        </div>
      ))}
    </div>
  )
  
  return (
    <div className="flex justify-between items-start mb-6 md:mb-8 px-1.5 md:px-6">
      {/* Team A Scorers */}
      <div className="flex-1">
        {teamAScorers.length > 0 && renderScorerList(teamAScorers)}
      </div>
      
      {/* Team B Scorers */}
      <div className="flex-1 text-right">
        {teamBScorers.length > 0 && renderScorerList(teamBScorers)}
      </div>
    </div>
  )
}
