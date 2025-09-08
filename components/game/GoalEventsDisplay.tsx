import React from 'react'
import type { Score, Player } from '../../lib/types'
import { MatchService } from '../../lib/match-service'

interface GoalEventsDisplayProps {
  scores: Score[]
  teamAPlayers: Player[]
  teamBPlayers: Player[]
  goalkeepers: { teamA: Player | null; teamB: Player | null }
  isDarkMode: boolean
}

interface GoalEvent {
  id: string
  scorer: Player | null
  assister: Player | null
  team: 'A' | 'B'
  time: number
  isOwnGoal: boolean
}

function processGoalEvents(
  scores: Score[],
  teamAPlayers: Player[],
  teamBPlayers: Player[],
  goalkeepers: { teamA: Player | null; teamB: Player | null }
): GoalEvent[] {
  const allPlayers = [...teamAPlayers, ...teamBPlayers, goalkeepers.teamA, goalkeepers.teamB].filter(Boolean) as Player[]
  
  return scores.map(score => {
    const scorer = allPlayers.find(p => p.id === score.scoring_player_id) || null
    const assister = score.assisting_player_id ? allPlayers.find(p => p.id === score.assisting_player_id) || null : null
    
    // Determine if it's an own goal
    const isOwnGoal = scorer && (
      (score.team === 'A' && (teamBPlayers.some(p => p.id === scorer.id) || goalkeepers.teamB?.id === scorer.id)) ||
      (score.team === 'B' && (teamAPlayers.some(p => p.id === scorer.id) || goalkeepers.teamA?.id === scorer.id))
    )
    
    // Convert score_time from interval to minutes using proper parsing
    const timeInSeconds = MatchService.parseInterval(score.score_time)
    const timeInMinutes = Math.floor(timeInSeconds / 60)
    
    return {
      id: score.id,
      scorer,
      assister,
      team: score.team as 'A' | 'B',
      time: timeInMinutes,
      isOwnGoal: !!isOwnGoal
    }
  }).sort((a, b) => a.time - b.time) // Sort by time
}

export function GoalEventsDisplay({ scores, teamAPlayers, teamBPlayers, goalkeepers, isDarkMode }: GoalEventsDisplayProps) {
  const goalEvents = processGoalEvents(scores, teamAPlayers, teamBPlayers, goalkeepers)
  
  // Don't render if no goals scored
  if (goalEvents.length === 0) {
    return null
  }
  
  const renderGoalEvent = (event: GoalEvent) => (
    <div key={event.id} className={`text-sm transition-colors duration-300 ${
      isDarkMode ? 'text-gray-300' : 'text-gray-600'
    }`}>
      <span className="font-medium">
        {event.scorer?.name || 'Okänd spelare'}
        {event.isOwnGoal && <span className="ml-1">*</span>}
      </span>
      {event.assister && (
        <>
          <span className="ml-1">(</span>
          <span className="font-medium">{event.assister.name}</span>
          <span>)</span>
        </>
      )}
      <span className="ml-1">{event.time}'</span>
    </div>
  )
  
  const teamAEvents = goalEvents.filter(event => event.team === 'A')
  const teamBEvents = goalEvents.filter(event => event.team === 'B')
  
  return (
    <div className="flex justify-between items-start mb-6 md:mb-8 px-0 md:px-6">
      {/* Team A Goals */}
      <div className="flex-1">
        {teamAEvents.length > 0 && (
          <div className="space-y-1">
            {teamAEvents.map(renderGoalEvent)}
          </div>
        )}
      </div>
      
      {/* Team B Goals */}
      <div className="flex-1 text-right">
        {teamBEvents.length > 0 && (
          <div className="space-y-1">
            {teamBEvents.map(renderGoalEvent)}
          </div>
        )}
      </div>
    </div>
  )
}
