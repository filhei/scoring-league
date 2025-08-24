# Authentication Validation Improvements

## Overview

The authentication system now provides comprehensive validation to ensure users can only sign in with valid email addresses that meet the following criteria:

1. **Email exists in auth.users table** - The email must be registered in Supabase authentication
2. **Linked active player account** - The email must be linked to an active player in the players table
3. **Account not nullified** - The player account must not be deactivated or nullified (GDPR compliance)

## Validation Flow

### 1. Magic Link Sign-in (`signIn` function)
- **Direct Magic Link**: Sends magic link directly to the provided email
- **Supabase Validation**: Lets Supabase handle user authentication validation
- **Post-Authentication Check**: Validates player account after successful authentication
- **Error Handling**: Provides clear error messages for various failure scenarios

### 2. One-Time Code Sign-in (`signInWithCode` function)
- Verifies the OTP code via `supabase.auth.verifyOtp()`
- If successful, checks for linked player account
- Validates player account is active and not nullified
- Signs out user if validation fails

### 3. Auth Callback Validation (`/auth/callback/route.ts`)
- Additional server-side validation after successful authentication
- Checks if authenticated user has valid player account
- Signs out user and redirects with error if validation fails

## Server Actions

*Note: The pre-validation server action has been removed to simplify the authentication flow and avoid admin privilege requirements. Validation now occurs post-authentication in the auth callback route.*

## Error Messages

The system provides specific, user-friendly error messages:

- **"This email is not registered. Please contact the admin to set up your account."**
  - Email doesn't exist in auth.users table
  
- **"This email is not linked to a player account. Please contact the admin."**
  - Email exists in auth.users but no linked player record
  
- **"Your player account has been deactivated. Please contact the admin."**
  - Player account exists but is inactive or nullified
  
- **"Invalid or expired code. Please try again or request a new code."**
  - OTP code validation failed
  
- **"Too many sign-in attempts. Please wait a few minutes before trying again."**
  - Rate limiting protection

## Database Schema Requirements

The validation relies on the following database structure:

```sql
-- players table with RLS policies
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  elo INTEGER DEFAULT 1500,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) UNIQUE
);
```

## Security Features

1. **Row Level Security (RLS)** - Ensures users can only access their own data
2. **Account Nullification** - GDPR-compliant account deletion (sets fields to null)
3. **Rate Limiting** - Prevents brute force attacks
4. **Session Validation** - Server-side validation after authentication

## User Experience

- **Immediate Feedback** - Users get clear error messages without waiting for email delivery
- **Progressive Validation** - Multiple validation layers ensure security
- **Clear Instructions** - Error messages guide users to contact admin when needed
- **Graceful Degradation** - System handles various error scenarios gracefully

## Admin Responsibilities

Admins need to:
1. Create user accounts in Supabase auth.users table
2. Create corresponding player records in players table
3. Link player.user_id to auth.users.id
4. Set player.is_active = true for active accounts
5. Handle account deactivation by setting is_active = false or nullifying fields
