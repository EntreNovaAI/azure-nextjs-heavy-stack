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
    console.log('Customer ID type:', typeof session.customer)
    console.log('Customer ID value:', session.customer)
    console.log('Subscription ID type:', typeof session.subscription)
    console.log('Subscription ID value:', session.subscription)
    console.log('Line items:', session.line_items)
    console.log('Customer details:', session.customer_details)
    console.log('=== END STRIPE SESSION ===')

    // Prepare the response data
    const responseData = {
      // Basic status info
      status: session.status,
      payment_status: session.payment_status,
      
      // Customer information
      customer_email: session.customer_details?.email || null,
      customer_name: session.customer_details?.name || null,
      customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
      
      // Subscription information
      subscription_id: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null,
      
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
    }

    // Log what we're actually returning
    console.log('=== RESPONSE DATA ===')
    console.log('Customer ID in response:', responseData.customer_id)
    console.log('Customer ID type:', typeof responseData.customer_id)
    console.log('Subscription ID in response:', responseData.subscription_id)
    console.log('Subscription ID type:', typeof responseData.subscription_id)
    console.log('=== END RESPONSE DATA ===')

    // Return comprehensive session information for database updates
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error retrieving session status:', error)
    
    return NextResponse.json(
      { error: 'Failed to retrieve session status' },
      { status: 500 }
    )
  }
}