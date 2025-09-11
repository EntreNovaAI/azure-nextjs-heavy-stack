'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProductCard } from '@/app/_components/product-card'
import { UserInfo } from '@/app/_components/user-info'
import { LoadingState, AuthRequiredState, AccessNotice } from '@/app/_components/page-states'
import { products } from '@/data/products'

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

  return (
    <div className="page-container">
      <div className="products-header">
        <h1>Premium Products</h1>
        <p>Welcome to our exclusive product catalog!</p>
        
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
          />
        ))}
      </div>

      {/* Access Level Notice */}
      <AccessNotice accessLevel={user?.accessLevel || 'free'} />
    </div>
  )
}
