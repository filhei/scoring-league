import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '../supabase/database.types'

export function createServerSupabaseClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Cookies are handled by middleware
          return undefined
        },
        set(name: string, value: string, options: any) {
          // Cookies are handled by middleware
        },
        remove(name: string, options: any) {
          // Cookies are handled by middleware
        },
      },
    }
  )
}
