'use client'

import { Suspense } from 'react'
import { GameView } from '../../components/game/GameView'
import { GameLoadingSkeleton } from '../../components/ui/loading-skeleton'

export default function GamesPage() {
  return (
    <div className="min-h-screen transition-colors duration-300">
      <Suspense fallback={<GameLoadingSkeleton />}>
        <GameView initialActiveGame={null} availablePlayers={[]} allGames={[]} />
      </Suspense>
    </div>
  )
}


