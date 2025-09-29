import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { getUserByEmail, createUser } from "@/app/_lib/kysely/repositories/user-repo"
import { ProfileClient } from "./profile-client"

/**
 * Profile Page - Server Component
 * Displays user information and subscription details
 * Allows users to manage their subscription and unsubscribe
 */
export default async function ProfilePage() {
  // Get the current user session
  const session = await getServerSession()
  
  // Redirect to home if not authenticated
  if (!session?.user?.email) {
    redirect('/')
    return // This prevents further execution in tests
  }

  // Fetch user data from database including Stripe information
  const user = await getUserByEmail(session.user.email)

  // If user not found in database, create them with default access level
  if (!user) {
    const newUser = await createUser({
      email: session.user.email,
      name: session.user.name || null,
      image: session.user.image || null,
      accessLevel: 'free'
    } as any)
    
    // Pass the new user data to client component
    return <ProfileClient user={newUser} />
  }

  // Pass existing user data to client component
  return <ProfileClient user={user} />
}
