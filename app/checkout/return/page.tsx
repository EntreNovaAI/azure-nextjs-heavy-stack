'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { StripeCheckout } from '@/app/_components/payment'
// Define types for session status response
interface SessionStatus {
  // Basic status info
  status: string
  payment_status: string
  
  // Customer information
  customer_email: string | null
  customer_name: string | null
  customer_id: string | null
  
  // Subscription information
  subscription_id: string | null
  
  // Payment information
  amount_total: number | null
  currency: string | null
  
  // Product information
  line_items: any[]
  
  // Metadata and timestamps
  created: number
  expires_at: number | null
  metadata: Record<string, any>
  
  // Debug info (remove in production)
  _debug_full_session?: any
}

/**
 * Updates user profile with new access level and Stripe customer ID
 * Called after successful payment to upgrade user's subscription
 * Now passes raw Stripe session data to server for processing
 */
async function updateUserProfile(sessionData: SessionStatus) {
  console.log('Updating user profile with Stripe session data:', sessionData)
  
  try {
    const response = await axios.patch('/api/user', {
      stripeSessionData: sessionData // Pass raw session data to server for processing
    })
    
    console.log('User profile updated successfully:', response.data)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message
      throw new Error(`Failed to update user profile: ${errorMessage}`)
    }
    throw error
  }
}

/**
 * Checkout Return Page Component
 * Handles the return flow from Stripe checkout using query parameters
 * Follows Stripe's recommended pattern from their documentation:
 * https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=embedded-form
 */
export default function CheckoutReturn() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const session_id = searchParams.get('session_id')

  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch session status when component mounts
    const fetchSessionStatus = async () => {
      if (!session_id) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Call our Next.js API route to get session status
        const response = await axios.get(`/api/stripe/get-session-status?session_id=${session_id}`)
        const data = response.data
        
        // Comprehensive logging for database update planning
        console.log('=== STRIPE SESSION STATUS DATA ===')
        console.log('Full session data:', data)
        console.log('Session ID:', session_id)
        console.log('Session Status:', data.status)
        console.log('Payment Status:', data.payment_status)
        console.log('Customer Email:', data.customer_email)
        console.log('All available properties:', Object.keys(data))
        console.log('Raw data structure:', JSON.stringify(data, null, 2))
        console.log('=== END SESSION DATA ===')
        
        // Check if payment is complete and update database
        if (data.status === 'complete' && data.payment_status === 'paid') {
          console.log('Payment completed! Updating user profile...')
          console.log('Available data for DB update:')
          console.log('- Customer Email:', data.customer_email)
          console.log('- Customer Name:', data.customer_name)
          console.log('- Subscription ID:', data.subscription_id)
          console.log('- Customer ID:', data.customer_id)
          console.log('- Amount:', data.amount_total)
          console.log('- Currency:', data.currency)
          console.log('- Line Items:', data.line_items)
          
          // Update user profile with new access level and Stripe customer ID
          try {
            await updateUserProfile(data)
          } catch (updateError) {
            console.error('Failed to update user profile:', updateError)
            // Don't throw error here - payment was successful, just log the issue
          }
        }
        
        setSessionStatus(data)
        
      } catch (err) {
        console.error('Error fetching session status:', err)
        setError('Failed to load checkout status')
      } finally {
        setLoading(false)
      }
    }

    fetchSessionStatus()
  }, [session_id])

  // Show loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">Loading checkout status...</h1>
          <p className="text-gray-600">Please wait while we verify your payment.</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="page-container">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  // Handle different session statuses as per Stripe documentation
  if (sessionStatus?.status === 'open') {
    // Session is still open - remount embedded checkout
    return (
      <div className="page-container">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Complete Your Purchase</h1>
            <p className="text-gray-600">Your checkout session is still active. Please complete your payment below.</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <StripeCheckout />
          </div>
        </div>
      </div>
    )
  } 
  
  if (sessionStatus?.status === 'complete') {
    // Payment successful - show success page
    return (
      <div className="page-container">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your subscription is now active and you'll receive a confirmation email shortly.
            </p>
          </div>

          {/* Show payment details if available */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
            <h3 className="font-semibold mb-3 text-center">Payment Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium capitalize">{sessionStatus.payment_status}</span>
              </div>
              {sessionStatus.customer_email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{sessionStatus.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/products')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Products
            </button>
            <button 
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle other statuses (expired, etc.)
  return (
    <div className="page-container">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2">Checkout Status</h1>
        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
          <p><strong>Session Status:</strong> {sessionStatus?.status || 'Unknown'}</p>
          <p><strong>Payment Status:</strong> {sessionStatus?.payment_status || 'Unknown'}</p>
        </div>
        <button 
          onClick={() => router.push('/products')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Products
        </button>
      </div>
    </div>
  )
}
