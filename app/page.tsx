'use client'

import { useSession } from 'next-auth/react'
import { ProductCard, FeaturesSection, HeroSection, homeHeroContent } from '@/app/_components/ui'
import { products } from '@/app/_data/products'
import { heroFeatures } from '@/app/_data/features'

/**
 * Home Page Component
 * Landing page showcasing products and authentication
 * Creates clear path to products and checkout flow
 */
export default function Home() {
  const { data: session } = useSession()

  return (
    <div className="page-container">
      {/* Hero Section */}
      <HeroSection
        title={homeHeroContent.title}
        subtitle={homeHeroContent.subtitle}
        session={session}
        authenticatedContent={homeHeroContent.authenticatedContent}
        unauthenticatedContent={homeHeroContent.unauthenticatedContent}
      />

      {/* Product Preview Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Select the perfect plan for your needs. All plans include secure payment processing and instant access.
        </p>
        
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
      </div>

      {/* Features Section */}
      <FeaturesSection features={heroFeatures} />
    </div>
  )
}
