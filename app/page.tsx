'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

/**
 * Home Page Component
 * Landing page with authentication demo information
 * Shows different content based on authentication state
 */
export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="page-container">
      <div className="home-hero">
        <h1>🚀 Azure Next Stack</h1>
        <p>
          Authentication Demo with Protected Products & Customer Records
        </p>
        
        {session ? (
          <div>
            <p>Welcome back, <strong>{session.user?.name || session.user?.email}</strong>!</p>
            <p>
              <Link href="/products" className="nav-link">
                → View Protected Products
              </Link>
            </p>
          </div>
        ) : (
          <p>Sign in with Google to access protected content and test customer record creation.</p>
        )}
      </div>

      <div className="hero-features">
        <div className="feature-card">
          <h3>🔐 Authentication</h3>
          <p>
            Secure Google OAuth integration using NextAuth.js. Users can sign in 
            and access protected content with session management.
          </p>
        </div>

        <div className="feature-card">
          <h3>🛡️ Protected Routes</h3>
          <p>
            The products page is protected and only accessible to authenticated users. 
            Non-authenticated users will see a login prompt.
          </p>
        </div>

        <div className="feature-card">
          <h3>📊 Customer Records</h3>
          <p>
            When users access protected content, a customer record is automatically 
            created in the database with a default 'basic' access level.
          </p>
        </div>

        <div className="feature-card">
          <h3>🏗️ Tech Stack</h3>
          <p>
            Built with Next.js 14, NextAuth.js, Prisma ORM, PostgreSQL, 
            and deployed on Azure with modern DevOps practices.
          </p>
        </div>
      </div>
    </div>
  )
}
