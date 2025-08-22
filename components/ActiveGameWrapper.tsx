'use client'

import { GameView } from './game/GameView'
import type { Player, Match } from '../lib/types'

interface ActiveGameWrapperProps {
  initialActiveGame: any // We'll use React Query instead
  availablePlayers: Player[]
  allGames: Match[] // This will be replaced by React Query
}

export function ActiveGameWrapper({ initialActiveGame, availablePlayers, allGames }: ActiveGameWrapperProps) {
  return (
    <GameView 
      initialActiveGame={initialActiveGame}
      availablePlayers={availablePlayers}
      allGames={allGames}
    />
  )
} 