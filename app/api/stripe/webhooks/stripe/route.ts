import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_lib/prisma"
import { extractUserUpdateData } from "@/app/_lib/stripe-utils"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" })
  const sig = req.headers.get("stripe-signature")!
  const body = await req.text()
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  console.log('Stripe webhook received:', event.type)

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('Checkout session completed:', session.id)
      console.log('Customer ID:', session.customer)
      console.log('Customer email:', session.customer_details?.email)
      
      // Get full session data with line items to determine access level
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'customer']
      })
      
      // Extract user update data from session
      const updateData = extractUserUpdateData({
        customer_id: fullSession.customer,
        customer_email: fullSession.customer_details?.email,
        line_items: fullSession.line_items?.data || []
      })
      
      // Update user in database if we have a valid email
      if (updateData.customerEmail && updateData.stripeCustomerId) {
        console.log('Updating user profile via webhook:', updateData)
        
        await prisma.user.update({
          where: {
            email: updateData.customerEmail
          },
          data: {
            accessLevel: updateData.accessLevel,
            stripeCustomerId: updateData.stripeCustomerId,
            updatedAt: new Date()
          }
        })
        
        console.log('User profile updated successfully via webhook')
      } else {
        console.log('Missing required data for user update:', updateData)
      }
    }
    
    // Handle subscription updates (renewals, cancellations, etc.)
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      
      console.log('Subscription event:', event.type, subscription.id)
      
      // For subscription cancellations, downgrade user to free
      if (event.type === "customer.subscription.deleted" && subscription.customer) {
        const customer = await stripe.customers.retrieve(subscription.customer as string)
        
        if (customer && !customer.deleted && customer.email) {
          await prisma.user.update({
            where: {
              email: customer.email
            },
            data: {
              accessLevel: 'free',
              updatedAt: new Date()
            }
          })
          
          console.log('User downgraded to free due to subscription cancellation')
        }
      }
    }
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Return 200 to acknowledge receipt even if processing failed
    // Stripe will retry failed webhooks automatically
  }
  
  return NextResponse.json({ received: true })
}
