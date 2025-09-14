
/**
 * Stripe Utility Functions
 * Helper functions for processing Stripe data and determining user access levels
 */

/**
 * Determines the access level based on Stripe line items
 * Maps Stripe price IDs to our internal access levels
 */
export function determineAccessLevelFromLineItems(lineItems: any[]): string {
  // Get the Stripe price IDs from environment variables
  const basicPriceId = process.env.STRIPE_SUBSCRIPTION_ID_BASIC
  const premiumPriceId = process.env.STRIPE_SUBSCRIPTION_ID_PREMIUM
  
  // Check each line item to find the matching price ID
  for (const item of lineItems) {
    console.log('Item:', item)
    const priceId = item.price?.id
    console.log('Premium Price ID:', premiumPriceId)
    console.log('Basic Price ID:', basicPriceId)
    if (priceId === premiumPriceId) {
      return 'premium'
    } else if (priceId === basicPriceId) {
      return 'basic'
    }
  }
  
  // Default to free if no matching price ID found
  return 'free'
}

/**
 * Validates if a Stripe customer ID is valid format
 * Stripe customer IDs start with 'cus_'
 */
export function isValidStripeCustomerId(customerId: string | null): boolean {
  if (!customerId || typeof customerId !== 'string') {
    return false
  }
  
  return customerId.startsWith('cus_') && customerId.length > 4
}

/**
 * Extracts relevant user update data from Stripe session
 * Returns the data needed to update user profile in database
 */
export function extractUserUpdateData(sessionData: any) {
  const accessLevel = determineAccessLevelFromLineItems(sessionData.line_items || [])
  const stripeCustomerId = sessionData.customer_id
  
  return {
    accessLevel,
    stripeCustomerId: isValidStripeCustomerId(stripeCustomerId) ? stripeCustomerId : null,
    customerEmail: sessionData.customer_email
  }
}
