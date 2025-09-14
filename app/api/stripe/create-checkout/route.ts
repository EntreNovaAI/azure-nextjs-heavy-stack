import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

// Initialize Stripe with your secret key
// Following Stripe's recommended configuration pattern
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil"
})

export const runtime = "nodejs"

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5 // Max 5 requests per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit exceeded
  }
  
  userLimit.count++
  return true
}

/**
 * Create Checkout Session API Route
 * Creates a Stripe Checkout Session for embedded checkout
 * PROTECTED: Only accessible to authenticated users from same origin
 * Follows Stripe's official documentation patterns:
 * https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=embedded-form
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Create checkout session API called')
    
    // Security Check 1: Verify user is authenticated
    const userSession = await getServerSession(authOptions)
    if (!userSession) {
      console.log('Unauthorized: No session found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Security Check 2: Verify request origin (prevent external API calls)
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    const allowedOrigins = [
      process.env.NEXTAUTH_URL || 'http://localhost:3000',
      'http://localhost:3000', // Development fallback
      'https://localhost:3000'  // HTTPS development
    ]
    
    // Check if request is coming from an allowed origin
    const isValidOrigin = origin && allowedOrigins.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    )
    const isValidReferer = referer && allowedOrigins.some(allowed => 
      referer.startsWith(allowed)
    )
    
    if (!isValidOrigin && !isValidReferer) {
      console.log('Forbidden: Invalid origin/referer', { origin, referer })
      return NextResponse.json(
        { error: 'Forbidden: Invalid request origin' },
        { status: 403 }
      )
    }
    
    // Security Check 3: Verify Content-Type header
    const contentType = req.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Bad Request: Invalid content type')
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/json' },
        { status: 400 }
      )
    }
    
    // Security Check 4: Rate limiting
    const userId = userSession.user?.email || 'anonymous'
    if (!checkRateLimit(userId)) {
      console.log('Rate limit exceeded for user:', userId)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    console.log('All security checks passed for user:', userSession.user?.email)
    
    // Parse the request body to get product information
    const body = await req.json()
    console.log('Request body:', body)
    
    // Determine which Stripe price ID to use based on the product type
    let priceId: string | null = null
    
    if (body.id === "basic") {
      priceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC || null
    } else if (body.id === "premium") {
      priceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM || null
    } else {
      console.log('Invalid product ID')
    }
    
    // Validate that we have a valid price ID
    if (!priceId) {
      
      return NextResponse.json(
        { 
          error: `Invalid product ID "${body.id}" or missing Stripe configuration`,
          details: 'Please check your environment variables for Stripe price IDs'
        },
        { status: 400 }
      )
    }

    // Create Stripe checkout session following their documentation pattern
    console.log('Creating Stripe session with price ID:', priceId)
    
    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      ui_mode: 'embedded', // Required for embedded checkout
      return_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    })


    // Return the client secret as shown in Stripe docs
    return NextResponse.json({ 
      clientSecret: checkoutSession.client_secret 
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
    // Return proper error response
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
