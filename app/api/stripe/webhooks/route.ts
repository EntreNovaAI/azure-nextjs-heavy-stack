import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { 
  findUserByStripeCustomerId,
  getUserByEmail,
  linkStripeIdToUserId,
  setAccessLevelById,
  createUser,
  updateUserById
} from "@/app/_lib/kysely/repositories/user-repo"
import { extractUserUpdateData } from "@/app/_lib/stripe/stripe-utils"

export const runtime = "nodejs"

/**
 * Find user by Stripe customer ID, with email fallback
 * Links Stripe ID to user if found by email
 */
async function findUserByStripeId(stripeCustomerId: string, email?: string | null) {
  // First, try to find user by Stripe customer ID
  let user = await findUserByStripeCustomerId(stripeCustomerId)
  
  if (user) {
    console.log('User found by Stripe ID:', stripeCustomerId)
    return user
  }
  
  // Fallback: try to find by email and link the Stripe ID
  if (email) {
    const userByEmail = await getUserByEmail(email)
    
    if (userByEmail) {
      // Link Stripe ID to existing user
      await linkStripeIdToUserId(userByEmail.id, stripeCustomerId)
      console.log('User found by email and linked Stripe ID:', email)
      return await findUserByStripeCustomerId(stripeCustomerId)
    }
  }
  
  console.log('No user found with Stripe ID or email:', { stripeCustomerId, email })
  return null
}

/**
 * Update user access level
 */
async function updateUserAccessLevel(userId: string, accessLevel: string) {
  await setAccessLevelById(userId, accessLevel)
  console.log(`User access level updated to: ${accessLevel}`)
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" })
  const sig = req.headers.get("stripe-signature")!
  const body = await req.text()
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  console.log('Stripe webhook received:', event.type)

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('Checkout session completed:', session.id)
        console.log('Customer ID:', session.customer)
        console.log('Customer email:', session.customer_details?.email)
        
        // Get full session data with line items to determine access level
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'customer']
        })
        
        // Get Stripe price IDs from environment variables
        const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
        const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM
        
        // Extract user update data from session
        const updateData = extractUserUpdateData({
          customer_id: fullSession.customer,
          customer_email: fullSession.customer_details?.email,
          line_items: fullSession.line_items?.data || []
        }, basicPriceId, premiumPriceId)
        
        // Update user in database if we have a valid Stripe customer ID
        if (updateData.stripeCustomerId) {
          console.log('Processing checkout completion:', updateData)
          
          const user = await findUserByStripeId(updateData.stripeCustomerId, updateData.customerEmail)
          
          if (user) {
            await updateUserAccessLevel(user.id, updateData.accessLevel)
          } else {
            console.log('Unable to find or create user for checkout completion')
          }
        } else {
          console.log('Missing Stripe customer ID for user update:', updateData)
        }
        break
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status)
        
        // Only process active subscriptions for updates
        if (subscription.status === 'active' && subscription.customer) {
          console.log('Processing subscription update:', subscription.id)
          
          // Get Stripe price IDs from environment variables
          const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
          const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM
          
          // Determine access level from subscription items
          let accessLevel = 'free'
          for (const item of subscription.items.data) {
            const priceId = item.price.id
            console.log('Subscription item price ID:', priceId)
            
            if (priceId === premiumPriceId) {
              accessLevel = 'premium'
              break // Premium takes precedence
            } else if (priceId === basicPriceId) {
              accessLevel = 'basic'
            }
          }
          
          console.log('Determined access level:', accessLevel)
          
          // Find and update user
          const user = await findUserByStripeId(subscription.customer as string)
          
          if (user) {
            await updateUserAccessLevel(user.id, accessLevel)
            console.log('User access level updated due to subscription change')
          } else {
            console.log('User not found for subscription update:', subscription.customer)
          }
        } else {
          console.log('Skipping inactive subscription update:', subscription.status)
        }
        break
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        console.log('Subscription deleted:', subscription.id)
        
        // For subscription cancellations, downgrade user to free
        if (subscription.customer) {
          console.log('Processing subscription cancellation:', subscription.id)
          
          const user = await findUserByStripeId(subscription.customer as string)
          
          if (user) {
            await updateUserAccessLevel(user.id, 'free')
            console.log('User downgraded to free due to subscription cancellation')
          }
        }
        break
      }
      
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer
        
        console.log('Customer created:', customer.id)
        console.log('Customer email:', customer.email)
        console.log('Customer name:', customer.name)
        
        // Only create user if we have an email and they don't already exist
        if (customer.email) {
          const existingUser = await getUserByEmail(customer.email)
          
          if (!existingUser) {
            // Create new user with free access level (compatible with user API route)
            const newUser = await createUser({
              email: customer.email,
              name: customer.name || null,
              stripeCustomerId: customer.id,
              accessLevel: 'free'
            } as any)
            console.log('New user created from Stripe customer:', newUser)
          } else {
            // Link Stripe customer ID to existing user if not already linked
            if (!existingUser.stripeCustomerId) {
              await linkStripeIdToUserId(existingUser.id, customer.id)
              console.log('Linked Stripe customer ID to existing user:', existingUser.email)
            } else {
              console.log('User already exists with Stripe customer ID:', existingUser.email)
            }
          }
        } else {
          console.log('Customer created without email - skipping user creation')
        }
        break
      }
      
      case "customer.updated": {
        const customer = event.data.object as Stripe.Customer
        
        console.log('Customer updated:', customer.id)
        console.log('Customer email:', customer.email)
        console.log('Customer name:', customer.name)
        
        // Find user by Stripe customer ID
        const user = await findUserByStripeId(customer.id, customer.email)
        
        if (user) {
          // Prepare update data - only update fields that have changed
          const updateData: any = {
            updatedAt: new Date()
          }
          
          // Update name if it's different and provided
          if (customer.name && customer.name !== user.name) {
            updateData.name = customer.name
          }
          
          // IMPORTANT: Do NOT update email automatically to prevent login issues
          // Users may sign up with one email but checkout with another
          // Only update email if the user's current email is null/empty (new user scenario)
          if (customer.email && customer.email !== user.email) {
            if (!user.email || user.email.trim() === '') {
              // Only update if user has no email set (shouldn't happen but safety check)
              updateData.email = customer.email
              console.log('Updating empty user email with customer email:', customer.email)
            } else {
              // Log the difference but don't update to preserve login capability
              console.log('Email mismatch detected - preserving user login email:', {
                userEmail: user.email,
                customerEmail: customer.email,
                message: 'User may have used different email for checkout'
              })
            }
          }
          
          // Only update if there are actual changes
          if (Object.keys(updateData).length > 1) { // More than just updatedAt
            await updateUserById(user.id, updateData)
            console.log('User updated from Stripe customer changes:', user.email)
          } else {
            console.log('No meaningful changes to update for user:', user.email)
          }
        } else {
          console.log('User not found for customer update:', customer.id)
        }
        break
      }
      
      case "customer.deleted": {
        const customer = event.data.object as Stripe.Customer
        
        console.log('Customer deleted:', customer.id)
        console.log('Customer email:', customer.email)
        
        // Find user by Stripe customer ID
        const user = await findUserByStripeId(customer.id)
        
        if (user) {
          await updateUserById(user.id, { stripeCustomerId: null, accessLevel: 'free' })
          console.log('User Stripe association removed and downgraded:', user.email)
        } else {
          console.log('User not found for customer deletion:', customer.id)
        }
        break
      }
      
      default:
        console.log('Unhandled webhook event type:', event.type)
    }
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Return 200 to acknowledge receipt even if processing failed
    // Stripe will retry failed webhooks automatically
  }
  
  return NextResponse.json({ received: true })
}
