'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

/**
 * Login Button Component
 * Shows login/logout buttons based on authentication state
 * Uses Google OAuth provider for authentication
 */
export function LoginButton() {
  const { data: session, status } = useSession()

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <button className="auth-button loading" disabled>
        Loading...
      </button>
    )
  }

  // Show logout button if user is authenticated
  if (session) {
    return (
      <div className="auth-section">
        <p className="user-info">
          Welcome, <strong>{session.user?.name || session.user?.email}</strong>!
        </p>
        <button 
          className="auth-button logout" 
          onClick={() => signOut()}
        >
          Sign Out
        </button>
      </div>
    )
  }

  // Show login button if user is not authenticated
  return (
    <button 
      className="auth-button login" 
      onClick={() => signIn('google')}
    >
      Sign In with Google
    </button>
  )
}
