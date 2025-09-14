'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { LoginButton } from '../auth'

/**
 * Navigation Component
 * Displays main navigation with auth-aware menu items
 * Shows protected links only when user is authenticated
 */
export function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link href="/" className="nav-brand">
          <h1>Azure Next Stack</h1>
        </Link>

        {/* Navigation Links */}
        <div className="nav-links">
          <Link href="/" className="nav-link">
            Home
          </Link>
          
          {/* Show protected product link only when authenticated */}
          {session && (
            <Link href="/products" className="nav-link">
              Products
            </Link>
          )}
        </div>

        {/* Auth Section */}
        <div className="nav-auth">
          <LoginButton />
        </div>
      </div>
    </nav>
  )
}
