/**
 * LoadingState Component
 * Reusable loading state display for pages
 */
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="page-container">
      <div className="loading-state">
        <h2>Loading...</h2>
        <p>{message}</p>
      </div>
    </div>
  )
}

/**
 * AuthRequiredState Component
 * Reusable authentication required state for protected pages
 */
export function AuthRequiredState({ 
  title = "Authentication Required",
  message = "Please sign in to access this content."
}: { 
  title?: string
  message?: string 
}) {
  return (
    <div className="page-container">
      <div className="auth-required">
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  )
}

/**
 * AccessNotice Component
 * Reusable notice component for displaying access level information
 */
export function AccessNotice({ 
  accessLevel, 
  title = "🔐 Protected Content" 
}: { 
  accessLevel: string
  title?: string 
}) {
  return (
    <div className="access-notice">
      <h3>{title}</h3>
      <p>
        This page is only accessible to authenticated users. Your account 
        has <strong>{accessLevel}</strong> access level.
      </p>
    </div>
  )
}
