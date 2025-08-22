import type { GameContext } from '../hooks/useGameState'
import type { ActiveGameData } from '../types'

/**
 * Safely extracts game data from game context
 * This utility function helps with TypeScript type safety
 */
export function getGameDataFromContext(context: GameContext | null): ActiveGameData | null {
  return context?.gameData ?? null
} 