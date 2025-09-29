import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import Stripe from "stripe"
import { getUserByEmail, updateUserById } from "@/app/_lib/kysely/repositories/user-repo"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil"
})

/**
 * Unsubscribe API Route
 * Cancels user's Stripe subscription and downgrades them to free plan
 * Only authenticated users can unsubscribe their own subscription
 */
export async function POST(req: NextRequest) {
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

    // Parse request body to get Stripe customer ID
    const body = await req.json()
    const { stripeCustomerId } = body

    // Validate Stripe customer ID format
    if (!stripeCustomerId || !stripeCustomerId.startsWith('cus_')) {
      return NextResponse.json(
        { error: 'Invalid Stripe customer ID' },
        { status: 400 }
      )
    }

    // Verify the customer ID belongs to the authenticated user
    const user = await getUserByEmail(session.user.email)
    if (!user || user.stripeCustomerId !== stripeCustomerId) {
      return NextResponse.json(
        { error: 'Unauthorized: Customer ID does not match authenticated user' },
        { status: 403 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Customer ID does not match authenticated user' },
        { status: 403 }
      )
    }

    // Check if user is already on free plan
    if (user.accessLevel === 'free') {
      return NextResponse.json(
        { error: 'You are already on the free plan' },
        { status: 400 }
      )
    }

    console.log('Starting unsubscribe process for user:', session.user.email)
    console.log('Stripe customer ID:', stripeCustomerId)

    // Get all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active'
    })

    console.log('Found active subscriptions:', subscriptions.data.length)

    // Cancel all active subscriptions
    const cancelledSubscriptions = []
    for (const subscription of subscriptions.data) {
      try {
        // Cancel the subscription at the end of the current period
        // This allows users to continue using the service until their billing period ends
        const cancelled = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true
        })
        
        cancelledSubscriptions.push(cancelled.id)
        console.log('Subscription marked for cancellation:', cancelled.id)
      } catch (error) {
        console.error('Error cancelling subscription:', subscription.id, error)
        // Continue with other subscriptions even if one fails
      }
    }

    // If no subscriptions were found or cancelled, still update user to free
    if (cancelledSubscriptions.length === 0) {
      console.log('No active subscriptions found, updating user to free plan')
    }

    // Update user's access level to free in database
    // Note: The webhook will also handle this when the subscription actually ends
    // But we update it here for immediate UI feedback
    const updatedUser = await updateUserById(user.id, { accessLevel: 'free' })

    console.log('User updated to free plan:', updatedUser.email)

    // Return success response
    return NextResponse.json({
      message: 'Successfully unsubscribed',
      cancelledSubscriptions: cancelledSubscriptions,
      newAccessLevel: 'free',
      note: 'Your subscription will end at the end of the current billing period'
    })

  } catch (error) {
    console.error('Error processing unsubscribe request:', error)
    
    // Handle specific Stripe errors
    if (error instanceof Error && error.name === 'StripeError') {
      return NextResponse.json(
        { 
          error: 'Stripe error occurred', 
          details: error.message 
        },
        { status: 400 }
      )
    }

    // Handle general errors
    return NextResponse.json(
      { error: 'Failed to process unsubscribe request' },
      { status: 500 }
    )
  }
}
