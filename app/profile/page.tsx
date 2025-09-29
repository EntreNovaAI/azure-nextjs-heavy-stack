import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { prisma } from "@/app/_lib/prisma/prisma"
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
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      accessLevel: true,
      stripeCustomerId: true,
      createdAt: true,
      updatedAt: true
    }
  })

  // If user not found in database, create them with default access level
  if (!user) {
    const newUser = await prisma.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
        accessLevel: 'free'
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        accessLevel: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Pass the new user data to client component
    return <ProfileClient user={newUser} />
  }

  // Pass existing user data to client component
  return <ProfileClient user={user} />
}
