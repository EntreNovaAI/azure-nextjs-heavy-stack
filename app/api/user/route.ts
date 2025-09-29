import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { getUserByEmail, createUser, updateUserByEmail } from "@/app/_lib/kysely/repositories/user-repo"
import { extractUserUpdateData } from "@/app/_lib/stripe/stripe-utils"

/**
 * User API Route
 * Fetches authenticated user's details including access level
 * Used by protected pages to display user-specific content
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession()
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch user details from database
    const user = await getUserByEmail(session.user.email)

    // If user not found in database, create them with default access level
    if (!user) {
      const newUser = await createUser({
        email: session.user.email,
        name: session.user.name || null,
        image: session.user.image || null,
        accessLevel: 'free'
      } as any)

      return NextResponse.json(newUser)
    }

    // Return existing user data
    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user details:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

/**
 * Update User API Route
 * Updates user's access level (typically called after successful payment)
 */
export async function PATCH(req: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession()
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await req.json()
    
    let accessLevel: string
    let stripeCustomerId: string | null = null
    
    // Check if we're receiving raw Stripe session data or processed data
    if (body.stripeSessionData) {
      // Process Stripe session data server-side
      const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
      const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM
      
      const updateData = extractUserUpdateData(
        body.stripeSessionData,
        basicPriceId,
        premiumPriceId
      )
      
      accessLevel = updateData.accessLevel
      stripeCustomerId = updateData.stripeCustomerId
    } else {
      // Legacy format - direct accessLevel and stripeCustomerId
      accessLevel = body.accessLevel
      stripeCustomerId = body.stripeCustomerId
    }

    // Validate access level
    if (!['free', 'basic', 'premium'].includes(accessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level' },
        { status: 400 }
      )
    }

    // Prepare update data - only include stripeCustomerId if provided
    const updateDataForDb: any = {
      accessLevel: accessLevel,
      updatedAt: new Date()
    }
    
    // Add Stripe customer ID if provided (for paid subscriptions)
    if (stripeCustomerId) {
      updateDataForDb.stripeCustomerId = stripeCustomerId
    }

    // Update user's access level and Stripe customer ID
    const updatedUser = await updateUserByEmail(session.user.email, updateDataForDb)

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Error updating user access level:', error)
    
    return NextResponse.json(
      { error: 'Failed to update user access level' },
      { status: 500 }
    )
  }
}
