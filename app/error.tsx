'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error Page Component
 * Displays when an unhandled error occurs in the application
 * Provides user-friendly error message and recovery options
 */
export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="error-page">
      <div className="error-content">
        <div className="error-icon">
          ⚠️
        </div>
        
        <h1>Oops! Something went wrong</h1>
        
        <p className="error-message">
          We encountered an unexpected error. Please try again later.
        </p>
        
        <div className="error-actions">
          <button 
            onClick={reset}
            className="btn-primary"
          >
            Try Again
          </button>
          
          <Link 
            href="/"
            className="btn-secondary"
          >
            Go Home
          </Link>
        </div>
        
        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Error Details (Development Only)</summary>
            <pre>{error.message}</pre>
            {error.stack && (
              <pre className="error-stack">{error.stack}</pre>
            )}
          </details>
        )}
      </div>
    </div>
  )
}
