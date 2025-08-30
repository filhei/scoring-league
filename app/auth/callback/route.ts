import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  // Handle PKCE flow (with code)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    return NextResponse.redirect(origin)
  }

  // Handle implicit flow (with token_hash) - for magic links
  if (token_hash && type === 'email') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    })
    
    if (error) {
      console.error('Token verification error:', error)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    return NextResponse.redirect(origin)
  }

  // Handle direct redirect from Supabase (no specific auth parameters)
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return NextResponse.redirect(`${origin}/login?error=session_error`)
  }

  if (session) {
    return NextResponse.redirect(origin)
  }

  // If we get here, there's no valid auth data
  return NextResponse.redirect(`${origin}/login?error=no_auth_data`)
}
