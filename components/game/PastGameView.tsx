'use client'

import { TeamDisplay } from './TeamDisplay'
import { GoalEventsDisplay } from './GoalEventsDisplay'
import type { PastGameDetailedData } from '../../lib/types'

interface PastGameViewProps {
  gameData: PastGameDetailedData
  isDarkMode: boolean
  isSidesSwapped: boolean
}

export function PastGameView({ gameData, isDarkMode, isSidesSwapped }: PastGameViewProps) {
  const { match, teamA, teamB, goalkeepers, scores, teamWithVests } = gameData

  // Determine display order based on swap state
  const leftTeam = isSidesSwapped ? 'B' : 'A'
  const rightTeam = isSidesSwapped ? 'A' : 'B'
  const leftPlayers = isSidesSwapped ? teamB : teamA
  const rightPlayers = isSidesSwapped ? teamA : teamB
  const leftGoalkeeper = isSidesSwapped ? goalkeepers.teamB : goalkeepers.teamA
  const rightGoalkeeper = isSidesSwapped ? goalkeepers.teamA : goalkeepers.teamB

  // Calculate scores
  const teamAScore = scores.filter(s => s.team === 'A').length
  const teamBScore = scores.filter(s => s.team === 'B').length
  const leftScore = isSidesSwapped ? teamBScore : teamAScore
  const rightScore = isSidesSwapped ? teamAScore : teamBScore

  // Get players for a specific team (excluding goalkeeper)
  const getTeamPlayers = (team: 'A' | 'B') => {
    const players = team === leftTeam ? leftPlayers : rightPlayers
    const goalkeeper = team === leftTeam ? leftGoalkeeper : rightGoalkeeper
    return players.filter(p => p.id !== goalkeeper?.id)
  }

  const formatMatchDate = (startTime: string | null) => {
    if (!startTime) return 'Okänt datum'
    const date = new Date(startTime)
    return date.toLocaleDateString('sv-SE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/^./, (match) => match.toUpperCase())
  }

  const formatDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return 'Okänd längd'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="sm:max-w-6xl sm:mx-auto sm:p-6 p-2">
      {/* Past Game Pane */}
      <div className={`sm:rounded-2xl p-2 sm:p-8 mb-6 sm:mb-8 transition-colors duration-300 ${
        isDarkMode
          ? 'sm:bg-gray-800 sm:border sm:border-gray-700'
          : 'sm:bg-gray-50 sm:border sm:border-gray-200'
      }`}>
        {/* Title and Match Info */}
        <div className="mb-6 md:mb-8">
          <h2 className={`text-2xl md:text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Avslutad match
            <span className="text-xs md:text-sm font-normal ml-2 opacity-60">
              (# {match.gameCount || 'N/A'})
            </span>
          </h2>
          
          <div className={`mt-2 text-sm transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>{formatMatchDate(match.start_time)}</p>
            <p>Matchlängd: {formatDuration(match.start_time, match.end_time)}</p>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex justify-center items-center space-x-8 md:space-x-16 mb-6 md:mb-8">
          <div className={`text-6xl md:text-8xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {leftScore} - {rightScore}
          </div>
        </div>

        {/* Goal Events Display */}
        <GoalEventsDisplay
          scores={scores}
          teamAPlayers={teamA}
          teamBPlayers={teamB}
          goalkeepers={goalkeepers}
          isDarkMode={isDarkMode}
        />

        {/* Teams Header - Desktop Only */}
        <div className="hidden md:flex justify-between items-center mb-4 md:mb-6">
          <div className="flex items-center space-x-2">
            <h3 
              className="text-lg md:text-xl font-bold transition-colors duration-300"
              style={{
                color: 'var(--accent-blue)'
              }}
            >
              Lag {leftTeam}
            </h3>
            {teamWithVests === leftTeam && (
              <span className="text-lg">🦺</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {teamWithVests === rightTeam && (
              <span className="text-lg">🦺</span>
            )}
            <h3 
              className="text-lg md:text-xl font-bold transition-colors duration-300"
              style={{
                color: 'var(--accent-blue)'
              }}
            >
              Lag {rightTeam}
            </h3>
          </div>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Left Team */}
          <div>
            {/* Team Header - Mobile Only */}
            <div className="flex md:hidden items-center justify-between mb-4">
              <h3 
                className="text-lg font-bold transition-colors duration-300"
                style={{
                  color: 'var(--accent-blue)'
                }}
              >
                Team {leftTeam}
              </h3>
              {teamWithVests === leftTeam && (
                <span className="text-lg">🦺</span>
              )}
            </div>
            <TeamDisplay
              team={leftTeam}
              players={getTeamPlayers(leftTeam)}
              goalkeeper={leftGoalkeeper}
              isDarkMode={isDarkMode}
              scores={scores}
              dragState={null}
              onDragOver={() => {}}
              onDragLeave={() => {}}
              onDrop={() => {}}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onAddPlayer={() => {}}
              onRemovePlayer={() => {}}
              matchStatus="finished"
              isAuthenticated={false}
              teamWithVests={teamWithVests as 'A' | 'B' | null}
              hideMobileHeader={true}
            />
          </div>

          {/* Right Team */}
          <div>
            {/* Team Header - Mobile Only */}
            <div className="flex md:hidden items-center justify-between mb-4">
              <h3 
                className="text-lg font-bold transition-colors duration-300"
                style={{
                  color: 'var(--accent-blue)'
                }}
              >
                Team {rightTeam}
              </h3>
              {teamWithVests === rightTeam && (
                <span className="text-lg">🦺</span>
              )}
            </div>
            <TeamDisplay
              team={rightTeam}
              players={getTeamPlayers(rightTeam)}
              goalkeeper={rightGoalkeeper}
              isDarkMode={isDarkMode}
              scores={scores}
              dragState={null}
              onDragOver={() => {}}
              onDragLeave={() => {}}
              onDrop={() => {}}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onAddPlayer={() => {}}
              onRemovePlayer={() => {}}
              matchStatus="finished"
              isAuthenticated={false}
              teamWithVests={teamWithVests as 'A' | 'B' | null}
              hideMobileHeader={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
