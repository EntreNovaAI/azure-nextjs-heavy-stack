import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/app/_lib/prisma"

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
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true,
        name: true,
        email: true,
        accessLevel: true,
        createdAt: true,
        updatedAt: true,
        image: true
      }
    })

    // If user not found in database, create them with default access level
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || null,
          image: session.user.image || null,
          accessLevel: 'free' // Default access level
        },
        select: {
          id: true,
          name: true,
          email: true,
          accessLevel: true,
          createdAt: true,
          updatedAt: true,
          image: true
        }
      })

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
    const { accessLevel } = body

    // Validate access level
    if (!['free', 'basic', 'premium'].includes(accessLevel)) {
      return NextResponse.json(
        { error: 'Invalid access level' },
        { status: 400 }
      )
    }

    // Update user's access level
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        accessLevel: accessLevel,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        accessLevel: true,
        createdAt: true,
        updatedAt: true,
        image: true
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Error updating user access level:', error)
    
    return NextResponse.json(
      { error: 'Failed to update user access level' },
      { status: 500 }
    )
  }
}
