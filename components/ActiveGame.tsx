import React, { useState, useRef, useEffect } from 'react'
import type { ActiveGameData, Player } from '../lib/types'
import { getPlayerStats, formatPlayerStats } from '../lib/game-utils'
import type { UseMatchTimerReturn } from '../lib/hooks/useMatchTimer'

interface ActiveGameProps {
  activeGame: ActiveGameData
  timer: UseMatchTimerReturn
  teamAScore: number
  teamBScore: number
  isDarkMode: boolean
  isSidesSwapped: boolean
  onScoreIncrement: (team: 'A' | 'B') => void
  onPauseToggle: () => void
  onEndMatch: () => void
  onSwapSides: () => void
  onAddPlayer: (team: 'A' | 'B', isGoalkeeper?: boolean) => void
  onRemovePlayer: (player: Player) => void
  onSwitchPlayerTeam: (player: Player, newTeam: 'A' | 'B', newIndex?: number) => void
}

interface DragState {
  player: Player
  originalTeam: 'A' | 'B'
  originalIndex: number
  currentTeam: 'A' | 'B' | null
  currentIndex: number | null
  mousePosition: { x: number; y: number }
}

export function ActiveGame({
  activeGame,
  timer,
  teamAScore,
  teamBScore,
  isDarkMode,
  isSidesSwapped,
  onScoreIncrement,
  onPauseToggle,
  onEndMatch,
  onSwapSides,
  onAddPlayer,
  onRemovePlayer,
  onSwitchPlayerTeam
}: ActiveGameProps) {
  // Drag and drop state
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragImagePosition, setDragImagePosition] = useState({ x: 0, y: 0 })
  const dragImageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine display order based on swap state
  const leftTeam = isSidesSwapped ? 'B' : 'A'
  const rightTeam = isSidesSwapped ? 'A' : 'B'
  const leftScore = isSidesSwapped ? teamBScore : teamAScore
  const rightScore = isSidesSwapped ? teamAScore : teamBScore
  const leftPlayers = isSidesSwapped ? activeGame.teamB : activeGame.teamA
  const rightPlayers = isSidesSwapped ? activeGame.teamA : activeGame.teamB
  const leftGoalkeeper = isSidesSwapped ? activeGame.goalkeepers.teamB : activeGame.goalkeepers.teamA
  const rightGoalkeeper = isSidesSwapped ? activeGame.goalkeepers.teamA : activeGame.goalkeepers.teamB

  // Mouse move handler for drag image
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragState) {
        setDragImagePosition({ x: e.clientX, y: e.clientY })
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isDragging, dragState])

  // Get players for a specific team (excluding goalkeeper)
  const getTeamPlayers = (team: 'A' | 'B') => {
    const players = team === leftTeam ? leftPlayers : rightPlayers
    const goalkeeper = team === leftTeam ? leftGoalkeeper : rightGoalkeeper
    return players.filter(p => p.id !== goalkeeper?.id)
  }

  // Find player's current position
  const findPlayerPosition = (player: Player): { team: 'A' | 'B'; index: number } | null => {
    const leftTeamPlayers = getTeamPlayers(leftTeam)
    const rightTeamPlayers = getTeamPlayers(rightTeam)
    
    const leftIndex = leftTeamPlayers.findIndex(p => p.id === player.id)
    if (leftIndex !== -1) return { team: leftTeam, index: leftIndex }
    
    const rightIndex = rightTeamPlayers.findIndex(p => p.id === player.id)
    if (rightIndex !== -1) return { team: rightTeam, index: rightIndex }
    
    return null
  }

  // Calculate drop position based on mouse position
  const calculateDropPosition = (e: React.DragEvent, team: 'A' | 'B'): number => {
    const teamContainer = e.currentTarget as HTMLElement
    const rect = teamContainer.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    
    // Get all player tiles in this team
    const playerTiles = teamContainer.querySelectorAll('[data-player-tile]')
    const tileHeight = 48 // Approximate height of each tile including margin
    
    // Find the appropriate index based on mouse position
    let dropIndex = 0
    for (let i = 0; i < playerTiles.length; i++) {
      const tileTop = i * tileHeight
      const tileBottom = (i + 1) * tileHeight
      
      if (mouseY >= tileTop && mouseY <= tileBottom) {
        // If mouse is in the lower half of the tile, drop after it
        if (mouseY > tileTop + tileHeight / 2) {
          dropIndex = i + 1
        } else {
          dropIndex = i
        }
        break
      }
      
      if (mouseY < tileTop) {
        dropIndex = i
        break
      }
      
      dropIndex = i + 1
    }
    
    return Math.min(dropIndex, playerTiles.length)
  }

  // Drag event handlers
  const handleDragStart = (e: React.DragEvent, player: Player) => {
    const position = findPlayerPosition(player)
    if (!position) return

    const dragState: DragState = {
      player,
      originalTeam: position.team,
      originalIndex: position.index,
      currentTeam: null,
      currentIndex: null,
      mousePosition: { x: e.clientX, y: e.clientY }
    }

    setDragState(dragState)
    setIsDragging(true)
    setDragImagePosition({ x: e.clientX, y: e.clientY })
    
    // Set drag image to be invisible (we'll create our own)
    const dragImage = new Image()
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', player.id.toString())
  }

  const handleDragEnd = () => {
    if (dragState) {
      // If dropped in a valid position, move the player
      if (dragState.currentTeam !== null && dragState.currentIndex !== null) {
        const newIndex = dragState.currentIndex
        onSwitchPlayerTeam(dragState.player, dragState.currentTeam, newIndex)
      }
    }
    
    setDragState(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, team: 'A' | 'B') => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (dragState) {
      const dropIndex = calculateDropPosition(e, team)
      setDragState(prev => prev ? {
        ...prev,
        currentTeam: team,
        currentIndex: dropIndex,
        mousePosition: { x: e.clientX, y: e.clientY }
      } : null)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire team container
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX
    const mouseY = e.clientY
    
    if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) {
      setDragState(prev => prev ? {
        ...prev,
        currentTeam: null,
        currentIndex: null
      } : null)
    }
  }

  const handleDrop = (e: React.DragEvent, team: 'A' | 'B') => {
    e.preventDefault()
    // The actual move is handled in handleDragEnd
  }

  // Render a placeholder for the drop position
  const renderDropPlaceholder = (team: 'A' | 'B', index: number) => {
    if (!dragState || dragState.currentTeam !== team || dragState.currentIndex !== index) {
      return null
    }

    return (
      <div
        key="drop-placeholder"
        className="h-12 border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center transition-all duration-200"
        style={{
          borderColor: 'var(--accent-blue)',
          backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
        }}
      >
        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
          Drop {dragState.player.name} here
        </span>
      </div>
    )
  }

  // Helper function to render a player tile
  const renderPlayerTile = (player: Player, team: 'A' | 'B', index: number, isGoalkeeper: boolean = false) => {
    const isDragging = dragState?.player.id === player.id

    return (
      <div
        key={player.id}
        data-player-tile
        draggable={!isGoalkeeper} // Goalkeepers can't be dragged
        onDragStart={(e) => !isGoalkeeper && handleDragStart(e, player)}
        onDragEnd={handleDragEnd}
        className={`group px-4 py-2 rounded-lg border transition-all duration-300 ${
          isDragging
            ? 'opacity-30 scale-95' // Make it semi-transparent instead of invisible
            : isDarkMode
            ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        } ${!isGoalkeeper ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex justify-between items-center">
          <span className={`font-medium transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            {player.name}
          </span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm transition-colors duration-300 pr-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatPlayerStats(getPlayerStats(player.id, activeGame.scores))}
            </span>
            <button
              onClick={() => onRemovePlayer(player)}
              className={`opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}
              title="remove from team"
            >
              −
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Helper function to render a goalkeeper tile
  const renderGoalkeeperTile = (goalkeeper: Player | null, team: 'A' | 'B') => {
    return (
      <div 
        className={`group px-4 py-2 rounded-lg border transition-all duration-300 ${
          !goalkeeper 
            ? `cursor-pointer ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
              }`
            : isDarkMode
              ? 'bg-gray-700 border-gray-600'
              : 'bg-gray-100 border-gray-200'
        }`}
        onClick={() => !goalkeeper && onAddPlayer(team, true)}
      >
        <div className="relative">
          <div 
            className="text-xs font-bold mb-1 transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            GOALKEEPER
          </div>
          {goalkeeper ? (
            <>
              <div className="flex items-center justify-between pr-6">
                <span className={`font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  {goalkeeper.name}
                </span>
                <span className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatPlayerStats(getPlayerStats(goalkeeper.id, activeGame.scores))}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemovePlayer(goalkeeper!)
                }}
                className={`absolute top-1/2 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                  isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="remove from team"
              >
                −
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pr-6">
                <span className={`text-sm transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  Ingen målvakt
                </span>
                <span
                  className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                  style={{ minHeight: '1.7em', display: 'inline-block' }}
                >
                  &nbsp;
                </span>
              </div>
              <div className={`absolute top-1/2 right-0 -translate-y-1/2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-800'
              }`}>
                + Add
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Render team players with drop placeholders
  const renderTeamPlayers = (team: 'A' | 'B') => {
    const players = getTeamPlayers(team)
    const elements: React.ReactElement[] = []

    // Add goalkeeper first
    const goalkeeper = team === leftTeam ? leftGoalkeeper : rightGoalkeeper
    elements.push(renderGoalkeeperTile(goalkeeper, team))

    // Add field players with potential drop placeholders
    for (let i = 0; i <= players.length; i++) {
      // Show drop placeholder at the beginning if needed
      if (i === 0 && dragState?.currentTeam === team && dragState.currentIndex === 0) {
        const placeholder = renderDropPlaceholder(team, 0)
        if (placeholder) elements.push(placeholder)
      }

      // Show player tile
      if (i < players.length) {
        elements.push(renderPlayerTile(players[i], team, i, false))
      }

      // Show drop placeholder after this player if needed
      if (dragState?.currentTeam === team && dragState.currentIndex === i + 1) {
        const placeholder = renderDropPlaceholder(team, i + 1)
        if (placeholder) elements.push(placeholder)
      }
    }

    return elements
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6" ref={containerRef}>
      {/* Custom Drag Image */}
      {isDragging && dragState && (
        <div
          ref={dragImageRef}
          className="fixed pointer-events-none z-50 px-4 py-2 rounded-lg border shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: dragImagePosition.x,
            top: dragImagePosition.y,
            backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
            borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            opacity: 0.9,
            transform: 'translate(-50%, -50%) scale(1.05)'
          }}
        >
          <div className="flex justify-between items-center">
            <span className={`font-medium ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              {dragState.player.name}
            </span>
            <span className={`text-sm ml-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatPlayerStats(getPlayerStats(dragState.player.id, activeGame.scores))}
            </span>
          </div>
        </div>
      )}

      {/* Active Game Pane */}
      <div className={`rounded-2xl p-8 mb-8 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        {/* Title */}
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-3xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Active Game
          </h2>
          <button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
            }`}
          >
            ⚙️ Edit
          </button>
        </div>

        {/* Game Time and Pause */}
        <div className="relative flex justify-center items-center mb-8">
          <div className={`text-4xl font-mono font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {timer.formattedTime}
          </div>
          <div className="absolute left-1/2 ml-32 flex items-center space-x-2">
            <button
              onClick={onPauseToggle}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isDarkMode
                  ? 'border-gray-600 hover:border-gray-500 text-white hover:bg-gray-800'
                  : 'border-gray-300 hover:border-gray-400 text-gray-800 hover:bg-gray-50'
              }`}
            >
              {timer.isPaused ? (
                <div className="w-0 h-0 border-l-[6px] border-l-current border-y-[4px] border-y-transparent ml-0.5"></div>
              ) : (
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-current"></div>
                  <div className="w-0.5 h-3 bg-current"></div>
                </div>
              )}
            </button>
            <span className={`text-xs font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {timer.isPaused ? 'Resume' : 'Pause'}
            </span>
          </div>
        </div>

        {/* Score Row */}
        <div className="flex justify-center items-center space-x-16 mb-8">
          <button
            onClick={() => onScoreIncrement(leftTeam)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 text-white"
            style={{
              backgroundColor: 'var(--accent-blue)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)'
            }}
          >
            +
          </button>
          <div className={`text-8xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {leftScore} - {rightScore}
          </div>
          <button
            onClick={() => onScoreIncrement(rightTeam)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 hover:scale-110 text-white"
            style={{
              backgroundColor: 'var(--accent-blue)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-blue)'
            }}
          >
            +
          </button>
        </div>

        {/* End Match Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={onEndMatch}
            className="px-5 py-1.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 text-white"
            style={{
              backgroundColor: 'var(--accent-red)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-red)'
            }}
          >
            End Match
          </button>
        </div>

        {/* Teams Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Team {leftTeam}
          </h3>
          <button
            onClick={onSwapSides}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="Byt sida"
          >
            ⇄
          </button>
          <h3 
            className="text-xl font-bold transition-colors duration-300"
            style={{
              color: 'var(--accent-blue)'
            }}
          >
            Team {rightTeam}
          </h3>
        </div>

        {/* Teams Display */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Team */}
          <div 
            className="space-y-2"
            onDragOver={(e) => handleDragOver(e, leftTeam)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, leftTeam)}
          >
            {renderTeamPlayers(leftTeam)}
            
            {/* Add Player Button */}
            <button 
              onClick={() => onAddPlayer(leftTeam, false)}
              className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.color = 'var(--accent-blue)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
                e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              + Add Player
            </button>
          </div>

          {/* Right Team */}
          <div 
            className="space-y-2"
            onDragOver={(e) => handleDragOver(e, rightTeam)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, rightTeam)}
          >
            {renderTeamPlayers(rightTeam)}
            
            {/* Add Player Button */}
            <button 
              onClick={() => onAddPlayer(rightTeam, false)}
              className="w-full px-4 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
              style={{
                borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.color = 'var(--accent-blue)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
                e.currentTarget.style.color = isDarkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              + Add Player
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 