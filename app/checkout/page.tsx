'use client'

import { useSession } from 'next-auth/react'
import { StripeCheckout } from '@/app/_components/payment'

/**
 * Checkout Page Component
 * Displays the Stripe embedded checkout form
 * Follows Stripe's recommended patterns for embedded checkout
 */
export default function CheckoutPage() {
  const { data: session } = useSession()

  return (
    <div className="page-container">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Complete Your Purchase</h1>
          <p className="text-gray-600" style={{ paddingBottom: '2rem' }}>
            Secure checkout powered by Stripe. Your payment information is encrypted and secure.
          </p>
        </div>
        
        {/* Stripe Embedded Checkout Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <StripeCheckout />
        </div>
        
        {/* Security notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🔒 Your payment is secured with Stripe</p>
        </div>
      </div>
    </div>
  )
}
