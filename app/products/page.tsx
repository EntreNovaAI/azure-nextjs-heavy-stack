'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProductCard, LoadingState, AuthRequiredState, AccessNotice } from '@/app/_components/ui'
import { UserInfo } from '@/app/_components/auth'
import { Calculator } from '@/app/_components/features'
import { products } from '@/app/_data/products'

/**
 * Protected Products Page
 * Only accessible to authenticated users
 * Displays premium content and user access level
 */
export default function ProductsPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user details including access level when session is available
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserDetails()
    } else {
      setLoading(false)
    }
  }, [session])

  /**
   * Fetch user details including access level from database
   */
  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return <LoadingState message="Please wait while we load your products." />
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <AuthRequiredState message="Please sign in to access our premium products." />
  }

  // Get access level for display
  const accessLevel = user?.accessLevel || 'free'
  const accessLevelDisplay = accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)

  return (
    <div className="page-container">
      {/* Access Level Banner */}
      <div className={`access-level-banner ${accessLevel}`}>
        <div className="banner-content">
          <div className="access-info">
            <h2>
              {accessLevel === 'free' && '🆓 Free Version'}
              {accessLevel === 'basic' && '⭐ Basic Version'}
              {accessLevel === 'premium' && '🏢 Premium Version'}
            </h2>
            <p>
              {accessLevel === 'free' && 'You have access to basic calculator functions'}
              {accessLevel === 'basic' && 'You have access to memory functions and calculation history'}
              {accessLevel === 'premium' && 'You have access to all advanced calculator features'}
            </p>
          </div>
          {accessLevel !== 'premium' && (
            <div className="upgrade-prompt">
              <p>Want more features?</p>
              <a href="#upgrade-section" className="upgrade-link">
                Upgrade Now →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Calculator Section */}
      <div className="calculator-section">
        <div className="section-header">
          <h2>Calculator Demo</h2>
          <p>Try our calculator with features based on your current access level</p>
        </div>
        
        <Calculator accessLevel={accessLevel} />
      </div>

      {/* Products Section */}
      <div id="upgrade-section" className="products-section">
        <div className="products-header">
          <h2>Upgrade Your Plan</h2>
          <p>Unlock more calculator features with our premium plans</p>
          
          {/* Display user information */}
          <UserInfo user={user} />
        </div>

        {/* Product Grid */}
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              title={product.title}
              description={product.description}
              features={product.features}
              price={product.price}
              variant={product.variant}
              productId={product.id}
            />
          ))}
        </div>

        {/* Access Level Notice */}
        <AccessNotice accessLevel={accessLevel} />
      </div>
    </div>
  )
}
