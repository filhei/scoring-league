import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    console.log('Processing auth callback with code:', code.substring(0, 10) + '...')
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      // Redirect to login with error
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
    }

    if (data.session) {
      console.log('Session established successfully for user:', data.session.user.email)
      
      // Verify the session was properly set by checking it
      const { data: { session: verifySession } } = await supabase.auth.getSession()
      if (verifySession) {
        console.log('Session verification successful')
        
        // Additional validation: Check if the authenticated user has a valid player account
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select('id, name, is_active, user_id')
          .eq('user_id', data.session.user.id)
          .single()

        if (playerError || !player) {
          console.error('Player not found for authenticated user:', data.session.user.email)
          // Sign out the user and redirect with error
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/login?error=no_player_account`)
        }

        // Check if player account is active and not nullified
        if (!player.is_active || !player.name || !player.user_id) {
          console.error('Player account deactivated or nullified for user:', data.session.user.email)
          // Sign out the user and redirect with error
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/login?error=account_deactivated`)
        }

        console.log('Player account validation successful for user:', data.session.user.email)
      } else {
        console.warn('Session verification failed - session not found after exchange')
      }
    } else {
      console.error('No session data returned from exchangeCodeForSession')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`)
    }
  } else {
    console.error('No code parameter found in auth callback')
    return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
  }

  // URL to redirect to after sign in process completes
  console.log('Redirecting to home page after successful authentication')
  return NextResponse.redirect(requestUrl.origin)
}
