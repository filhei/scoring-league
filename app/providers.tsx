'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { DarkModeProvider } from '../lib/hooks/useDarkMode'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // Increased to 5 minutes to reduce unnecessary refetches
        refetchOnWindowFocus: false, // Keep this false to prevent focus-triggered refetches
        refetchOnReconnect: false, // Disable refetch on reconnect to prevent unnecessary calls
        refetchOnMount: false, // Don't refetch on mount if data is fresh
        retry: 0, // No retries to prevent infinite loops
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Shorter exponential backoff
        gcTime: 30 * 60 * 1000, // Increased to 30 minutes for better caching
        networkMode: 'online', // Only retry when online
      },
      mutations: {
        retry: 0, // No retries for mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        {children}
      </DarkModeProvider>
    </QueryClientProvider>
  )
} 