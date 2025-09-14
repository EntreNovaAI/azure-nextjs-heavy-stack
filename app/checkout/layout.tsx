export const metadata = {
  title: 'Checkout - Azure Next Stack',
  description: 'Secure checkout powered by Stripe. Complete your purchase safely and securely.',
}

/**
 * Checkout Layout Component
 * Provides layout structure specifically for checkout pages
 * Inherits auth and navigation from parent layout
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="checkout-layout">
      <div className="min-h-screen bg-gray-50 py-8">
        {children}
      </div>
    </div>
  )
}
