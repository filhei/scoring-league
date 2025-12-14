import React from 'react'
import type { Score, Player } from '../../lib/types'
import { MatchService } from '../../lib/match-service'

interface ScorersDisplayProps {
  scores: Score[]
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
  isDarkMode: boolean
  onEditScore?: (score: Score) => void
  isAuthenticated?: boolean
}

interface ScoreWithPlayer {
  score: Score
  player: Player | null
  assistingPlayer: Player | null
  timeInMinutes: number
  isOwnGoal: boolean
}

function processScoresForTeam(
  scores: Score[], 
  team: 'A' | 'B', 
  allPlayers: Player[], 
  goalkeepers: { teamA: Player | null; teamB: Player | null },
  opposingTeamPlayers: Player[],
  opposingTeamGoalkeepers: { teamA: Player | null; teamB: Player | null }
): ScoreWithPlayer[] {
  const teamScores = scores.filter(score => score.team === team)
  
  const findPlayer = (playerId: string | null): Player | null => {
    if (!playerId) return null
    
    // Check regular team players
    let player = allPlayers.find(p => p.id === playerId)
    if (player) return player
    
    // Check goalkeepers
    const teamGoalkeeper = team === 'A' ? goalkeepers.teamA : goalkeepers.teamB
    if (teamGoalkeeper && teamGoalkeeper.id === playerId) {
      return teamGoalkeeper
    }
    
    // Check opposing team players
    player = opposingTeamPlayers.find(p => p.id === playerId)
    if (player) return player
    
    // Check opposing team goalkeepers
    const opposingTeamGoalkeeper = team === 'A' ? opposingTeamGoalkeepers.teamB : opposingTeamGoalkeepers.teamA
    if (opposingTeamGoalkeeper && opposingTeamGoalkeeper.id === playerId) {
      return opposingTeamGoalkeeper
    }
    
    return null
  }
  
  const processedScores: ScoreWithPlayer[] = teamScores.map(score => {
    // Convert score_time from interval to minutes using proper parsing
    const timeInSeconds = MatchService.parseInterval(score.score_time)
    const timeInMinutes = Math.floor(timeInSeconds / 60)
    
    // Handle goals without a scorer
    if (!score.scoring_player_id) {
      // Still look up assisting player even when there's no scorer
      const assistingPlayer = findPlayer(score.assisting_player_id)
      
      return {
        score,
        player: { id: 'no-scorer', name: 'Okänd spelare', elo: null, is_active: null, created_at: null, user_id: null, list_name: null },
        assistingPlayer,
        timeInMinutes,
        isOwnGoal: false
      }
    }
    
    // Find scoring player and check if own goal
    let player = findPlayer(score.scoring_player_id)
    let isOwnGoal = false
    
    if (player) {
      // Check if it's an own goal by seeing if the player is in the opposing team
      const isInOpposingTeam = opposingTeamPlayers.some(p => p.id === player!.id)
      const isOpposingGoalkeeper = team === 'A' 
        ? opposingTeamGoalkeepers.teamB?.id === player.id
        : opposingTeamGoalkeepers.teamA?.id === player.id
      isOwnGoal = isInOpposingTeam || isOpposingGoalkeeper
    }
    
    // Find assisting player
    const assistingPlayer = findPlayer(score.assisting_player_id)
    
    return {
      score,
      player: player || null,
      assistingPlayer,
      timeInMinutes,
      isOwnGoal
    }
  })
  
  // Sort by time
  return processedScores.sort((a, b) => a.timeInMinutes - b.timeInMinutes)
}

export function ScorersDisplay({ scores, teamAPlayers, teamBPlayers, goalkeepers, isDarkMode, onEditScore, isAuthenticated = true }: ScorersDisplayProps) {
  const teamAScores = processScoresForTeam(scores, 'A', teamAPlayers, goalkeepers, teamBPlayers, goalkeepers)
  const teamBScores = processScoresForTeam(scores, 'B', teamBPlayers, goalkeepers, teamAPlayers, goalkeepers)
  
  // Don't render if no goals scored
  if (teamAScores.length === 0 && teamBScores.length === 0) {
    return null
  }
  
  const renderScoreList = (scores: ScoreWithPlayer[], align: 'left' | 'right') => (
    <div className="space-y-1">
      {scores.map(({ score, player, assistingPlayer, timeInMinutes, isOwnGoal }) => {
        // Check if score has a temporary ID (not yet synced to database)
        const isTemporaryScore = score.id.startsWith('temp-')
        
        return (
          <div 
            key={score.id} 
            className={`text-sm transition-colors duration-300 flex items-center gap-1.5 ${
              align === 'right' ? 'flex-row-reverse' : ''
            } ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {isAuthenticated && onEditScore && (
              <>
                {!isTemporaryScore ? (
                  <button
                    onClick={() => onEditScore(score)}
                    className={`p-1 rounded transition-all duration-200 hover:scale-110 ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                    }`}
                    title="Redigera mål"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                ) : (
                  <div className="p-1 flex items-center justify-center" title="Synkar...">
                    <svg 
                      className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      width="14" 
                      height="14" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </div>
                )}
              </>
            )}
            <div className={align === 'right' ? 'text-right' : ''}>
              <span className="font-medium">
                {player?.name || 'Okänd spelare'}
                {isOwnGoal && <span className="ml-1">*</span>}
              </span>
              {assistingPlayer && (
                <span className={`ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({assistingPlayer.name})
                </span>
              )}
              <span className="ml-1">
                {timeInMinutes}'
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
  
  return (
    <div className="flex justify-between items-start mb-6 md:mb-8 px-1.5 md:px-6">
      {/* Team A Scorers */}
      <div className="flex-1">
        {teamAScores.length > 0 && renderScoreList(teamAScores, 'left')}
      </div>
      
      {/* Team B Scorers */}
      <div className="flex-1">
        {teamBScores.length > 0 && renderScoreList(teamBScores, 'right')}
      </div>
    </div>
  )
}
