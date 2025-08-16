import { useState, useRef, useEffect } from 'react'
import type { Player } from '../types'

export interface DragState {
  player: Player
  originalTeam: 'A' | 'B'
  originalIndex: number
  currentTeam: 'A' | 'B' | null
  currentIndex: number | null
  mousePosition: { x: number; y: number }
  dragStartPosition: { x: number; y: number }
}

interface UseDragAndDropProps {
  onSwitchPlayerTeam: (player: Player, newTeam: 'A' | 'B', newIndex?: number) => void
}

export function useDragAndDrop({ onSwitchPlayerTeam }: UseDragAndDropProps) {
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragImagePosition, setDragImagePosition] = useState({ x: 0, y: 0 })
  const [lastValidState, setLastValidState] = useState<boolean | null>(null)

  // Mouse move handler for drag image
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragState) {
        const newPosition = { x: e.clientX, y: e.clientY }
        setDragImagePosition(newPosition)
        
        // Debug: Log position updates for goalkeeper drags
        if (dragState.originalIndex === -1) {
          console.log('🥅 Goalkeeper drag image position updated:', newPosition)
        }
        
        // Check if we're over a valid drop zone
        const target = e.target as HTMLElement
        const teamContainer = target.closest('[data-team-container]')
        const playerTile = target.closest('[data-player-tile]')
        const dropPlaceholder = target.closest('[data-drop-placeholder]')
        const goalkeeperTile = target.closest('[data-goalkeeper-tile]')
        
        const isOverValidZone = !!(teamContainer || playerTile || dropPlaceholder || goalkeeperTile)
        
        if (isOverValidZone && goalkeeperTile) {
          // We're over a goalkeeper tile - set special goalkeeper position
          const teamAttribute = goalkeeperTile.getAttribute('data-team')
          if (teamAttribute) {
            setDragState(prev => prev ? {
              ...prev,
              currentTeam: teamAttribute as 'A' | 'B',
              currentIndex: -1, // Special index for goalkeeper position
              mousePosition: { x: e.clientX, y: e.clientY }
            } : null)
            
          }
        } else if (isOverValidZone && teamContainer) {
          // We're over a valid team container - calculate drop position
          const teamAttribute = teamContainer.getAttribute('data-team')
          if (teamAttribute) {
            // Create a synthetic drag event to use existing calculateDropPosition logic
            const syntheticEvent = {
              currentTarget: teamContainer,
              clientX: e.clientX,
              clientY: e.clientY,
              preventDefault: () => {},
              dataTransfer: { dropEffect: 'move' }
            } as React.DragEvent
            
            // Count the actual player tiles in this team container
            const playerTiles = teamContainer.querySelectorAll('[data-player-tile]')
            
            // For same-team moves, exclude the dragged player (it's being moved within the same team)
            // For cross-team moves, include all players (dragged player is from a different team)
            const isCrossTeamMove = dragState.originalTeam !== teamAttribute
            
            const visiblePlayerTiles = Array.from(playerTiles).filter(tile => {
              const tileElement = tile as HTMLElement
              if (isCrossTeamMove) {
                // Cross-team move: count all visible tiles in target team
                return tileElement.style.display !== 'none'
              } else {
                // Same-team move: exclude the dragged player tile
                return tileElement.style.display !== 'none' && !tileElement.hasAttribute('data-being-dragged')
              }
            })
            const currentPlayers = visiblePlayerTiles.map((_, index) => ({ id: `temp-${index}` })) as Player[]
            
            const dropIndex = calculateDropPosition(syntheticEvent, teamAttribute as 'A' | 'B', currentPlayers, isCrossTeamMove)
            
            // Always update drag state with calculated position (even if team hasn't changed)
            // This ensures the drop index updates as mouse moves within the team
            const prevTeam = dragState.currentTeam
            const prevIndex = dragState.currentIndex
            
            setDragState(prev => prev ? {
              ...prev,
              currentTeam: teamAttribute as 'A' | 'B',
              currentIndex: dropIndex,
              mousePosition: { x: e.clientX, y: e.clientY }
            } : null)
            
            // Only log when team changes or when first entering
            if (prevTeam !== teamAttribute || lastValidState !== true) {
            } else if (prevIndex !== dropIndex) {
            }
          }
        } else if (!isOverValidZone && lastValidState) {
          // We left a valid zone - clear the drop position
          setDragState(prev => prev ? {
            ...prev,
            currentTeam: null,
            currentIndex: null
          } : null)
          
        }
        
        // Update validity tracking
        setLastValidState(isOverValidZone)
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        console.log('🐭 Mouse up detected - waiting 10ms for HTML5 drag events...')
        
        // Give HTML5 drag events a chance to fire first
        setTimeout(() => {
          if (isDragging) { // Check if still dragging (might have been cleaned up by handleDragEnd)
            console.log('🐭 Timeout - checking if we should handle drop logic')
            
            // Check if we have a valid drop position (currentTeam and currentIndex are set)
            if (dragState && dragState.currentTeam !== null && dragState.currentIndex !== null) {
              console.log(`✅ Mouse up - Moving ${dragState.player.name} to team ${dragState.currentTeam} at index ${dragState.currentIndex}`)
              onSwitchPlayerTeam(dragState.player, dragState.currentTeam, dragState.currentIndex)
            } else {
              console.log('❌ Mouse up - Drag cancelled, no valid drop position')
            }
            
            // Clean up drag state
            setDragState(null)
            setIsDragging(false)
            setDragImagePosition({ x: 0, y: 0 })
            setLastValidState(null)
            console.log('🧹 Mouse up - Drag state cleaned up')
          } else {
            console.log('🎉 HTML5 drag events handled the drop - no cleanup needed')
          }
        }, 10)
      }
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp, { passive: true })
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragState, onSwitchPlayerTeam])

  // Find player's current position
  const findPlayerPosition = (
    player: Player, 
    leftTeam: 'A' | 'B', 
    rightTeam: 'A' | 'B',
    leftPlayers: Player[], 
    rightPlayers: Player[]
  ): { team: 'A' | 'B'; index: number } | null => {
    const leftIndex = leftPlayers.findIndex(p => p.id === player.id)
    if (leftIndex !== -1) return { team: leftTeam, index: leftIndex }
    
    const rightIndex = rightPlayers.findIndex(p => p.id === player.id)
    if (rightIndex !== -1) return { team: rightTeam, index: rightIndex }
    
    return null
  }

  // Calculate drop position based on mouse position
  const calculateDropPosition = (e: React.DragEvent, team: 'A' | 'B', currentPlayers: Player[], isCrossTeamMove: boolean): number => {
    const teamContainer = e.currentTarget as HTMLElement
    const rect = teamContainer.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    
    // Account for goalkeeper tile height (goalkeeper is rendered first)
    const tileHeight = 48 // Approximate height of each tile including margin
    const goalkeeperHeight = tileHeight + 8 // Goalkeeper tile + space-y-2 gap
    
    // Adjust mouseY to be relative to field players section (after goalkeeper)
    const fieldPlayersMouseY = mouseY - goalkeeperHeight
    
    // If no players, drop at position 0
    if (currentPlayers.length === 0) return 0
    
    // If mouse is in the goalkeeper area (above field players), this shouldn't happen
    // as we should have detected the goalkeeper tile already
    if (fieldPlayersMouseY < 0) {
      return 0
    }
    
    // Find the appropriate index based on mouse position relative to field players
    let dropIndex = 0
    for (let i = 0; i < currentPlayers.length; i++) {
      const tileTop = i * tileHeight
      const tileBottom = (i + 1) * tileHeight
      
      if (fieldPlayersMouseY >= tileTop && fieldPlayersMouseY <= tileBottom) {
        // If mouse is in the lower half of the tile, drop after it
        if (fieldPlayersMouseY > tileTop + tileHeight / 2) {
          dropIndex = i + 1
        } else {
          dropIndex = i
        }
        break
      }
      
      if (fieldPlayersMouseY < tileTop) {
        dropIndex = i
        break
      }
      
      dropIndex = i + 1
    }
    
    // For same-team moves: currentPlayers excludes the dragged player, so we can drop at any position 0 to currentPlayers.length
    // For cross-team moves: currentPlayers includes all target team players, so we can drop at any position 0 to currentPlayers.length  
    // In both cases, the max valid index is currentPlayers.length (which means "after the last player")
    
    const finalIndex = Math.min(dropIndex, currentPlayers.length)
    
    return finalIndex
  }



  // Drag event handlers
  const handleDragStart = (
    e: React.DragEvent, 
    player: Player,
    leftTeam: 'A' | 'B', 
    rightTeam: 'A' | 'B',
    leftPlayers: Player[], 
    rightPlayers: Player[],
    leftGoalkeeper?: Player | null,
    rightGoalkeeper?: Player | null
  ) => {
    
    // First check if the player is a goalkeeper
    let position: { team: 'A' | 'B'; index: number } | null = null
    
    if (leftGoalkeeper && leftGoalkeeper.id === player.id) {
      position = { team: leftTeam, index: -1 } // Special index for goalkeeper
    } else if (rightGoalkeeper && rightGoalkeeper.id === player.id) {
      position = { team: rightTeam, index: -1 } // Special index for goalkeeper
    } else {
      // Not a goalkeeper, find in field players
      position = findPlayerPosition(player, leftTeam, rightTeam, leftPlayers, rightPlayers)
    }
    
    if (!position) {
      return
    }

    const dragStartPosition = { x: e.clientX, y: e.clientY }
    const dragState: DragState = {
      player,
      originalTeam: position.team,
      originalIndex: position.index,
      currentTeam: null,
      currentIndex: null,
      mousePosition: dragStartPosition,
      dragStartPosition
    }

    // Set drag image position immediately
    setDragImagePosition(dragStartPosition)
    setDragState(dragState)
    setIsDragging(true)
    setLastValidState(null) // Reset validity tracking
    
    // Debug: Log goalkeeper drag start
    if (position.index === -1) {
      console.log('🥅 Goalkeeper drag started:', {
        player: player.name,
        position: dragStartPosition,
        team: position.team
      })
    }
    
    // Set drag image to be invisible (we'll create our own)
    const dragImage = new Image()
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', player.id.toString())
  }

  const handleDragEnd = (e: React.DragEvent) => {
    
    if (dragState) {
      
      // If we have a valid drop position (currentTeam and currentIndex are set), move the player
      if (dragState.currentTeam !== null && dragState.currentIndex !== null) {
        // Valid drop - move the player
        const newIndex = dragState.currentIndex
        onSwitchPlayerTeam(dragState.player, dragState.currentTeam, newIndex)
      } else {
      }
      // If currentTeam or currentIndex is null, the drag is cancelled and player stays in original position
      // No action needed - the player remains in their original position
    }
    
    // Always clean up the drag state
    setDragState(null)
    setIsDragging(false)
    setDragImagePosition({ x: 0, y: 0 })
  }

  const handleDragOver = (e: React.DragEvent, team: 'A' | 'B', currentPlayers: Player[]) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (dragState) {
      const isCrossTeamMove = dragState.originalTeam !== team
      const dropIndex = calculateDropPosition(e, team, currentPlayers, isCrossTeamMove)
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

  return {
    dragState,
    isDragging,
    dragImagePosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}