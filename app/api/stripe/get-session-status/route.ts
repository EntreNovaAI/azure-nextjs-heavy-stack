import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

// Use the same Stripe configuration as your other API routes
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil"
})

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    // Get session_id from query parameters
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')

    // Validate that session_id is provided
    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      )
    }

    // Retrieve the Stripe checkout session with expanded data
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription', 'customer']
    })

    // Log comprehensive session data for debugging
    console.log('=== STRIPE SESSION RETRIEVAL ===')
    console.log('Session ID:', sessionId)
    console.log('Full session object keys:', Object.keys(session))
    console.log('Session status:', session.status)
    console.log('Payment status:', session.payment_status)
    console.log('Customer ID:', session.customer)
    console.log('Subscription ID:', session.subscription)
    console.log('Line items:', session.line_items)
    console.log('Customer details:', session.customer_details)
    console.log('=== END STRIPE SESSION ===')

    // Return comprehensive session information for database updates
    return NextResponse.json({
      // Basic status info
      status: session.status,
      payment_status: session.payment_status,
      
      // Customer information
      customer_email: session.customer_details?.email || null,
      customer_name: session.customer_details?.name || null,
      customer_id: session.customer,
      
      // Subscription information
      subscription_id: session.subscription,
      
      // Payment information
      amount_total: session.amount_total,
      currency: session.currency,
      
      // Product information
      line_items: session.line_items?.data || [],
      
      // Metadata and timestamps
      created: session.created,
      expires_at: session.expires_at,
      metadata: session.metadata || {},
      
      // Full session for debugging (you can remove this in production)
      _debug_full_session: session
    })

  } catch (error) {
    console.error('Error retrieving session status:', error)
    
    return NextResponse.json(
      { error: 'Failed to retrieve session status' },
      { status: 500 }
    )
  }
}