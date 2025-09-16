interface UserInfoProps {
  user: {
    accessLevel: string
    createdAt: string
  } | null
}

/**
 * UserInfo Component
 * Displays user account information including access level and join date
 * Shows loading state when user data is not available
 */
export function UserInfo({ user }: UserInfoProps) {
  if (!user) {
    return null
  }

  return (
    <div className="customer-info">
      <h3>Your Account Details</h3>
      <p>
        <strong>Access Level:</strong> {user.accessLevel}
      </p>
      <p>
        <strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}
      </p>
    </div>
  )
}
