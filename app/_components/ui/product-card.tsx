'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

interface ProductCardProps {
  title: string
  description: string
  features: string[]
  price: string
  variant?: 'default' | 'basic' | 'premium'
  productId?: string // Add product ID for checkout
}

/**
 * ProductCard Component
 * Reusable card component for displaying product/subscription tiers
 * Supports different styling variants and handles purchase flow
 */
export function ProductCard({ 
  title, 
  description, 
  features, 
  price, 
  variant = 'default',
  productId 
}: ProductCardProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  
  const cardClass = `product-card ${variant !== 'default' ? variant : ''}`
  const isFree = price === 'Free'
  
  // Handle purchase button click
  const handlePurchase = async () => {
    // If not authenticated, redirect to login
    if (!session) {
      router.push('/api/auth/signin')
      return
    }
    
    // If it's a free plan, just show success (or redirect to dashboard)
    if (isFree) {
      alert('Free plan activated! You now have access to basic features.')
      return
    }
    
    // For paid plans, redirect to checkout with product selection
    if (productId) {
      setLoading(true)
      try {
        // Store the selected product in sessionStorage for checkout
        sessionStorage.setItem('selectedProduct', productId)
        router.push('/checkout')
      } catch (error) {
        console.error('Error starting checkout:', error)
        setLoading(false)
      }
    }
  }
  
  return (
    <div className={cardClass}>
      <div className="product-card-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      
      <div className="product-features">
        <ul>
          {features.map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="product-footer">
        <div className="product-price">{price}</div>
        
        <button 
          onClick={handlePurchase}
          disabled={loading}
          className={`product-button ${variant} ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            <>
              {isFree ? 'Get Started' : 
               !session ? 'Sign In to Purchase' : 
               'Choose This Plan'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
