import Link from 'next/link'
import { Session } from 'next-auth'

interface HeroSectionProps {
  title: string
  subtitle: string
  session: Session | null
  authenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
  unauthenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
  className?: string
}

export interface HeroContent {
  title: string
  subtitle: string
  authenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
  unauthenticatedContent: {
    message: string
    buttonText: string
    buttonHref: string
  }
}

// Homepage hero content
export const homeHeroContent: HeroContent = {
  title: "🚀 Azure Next Stack",
  subtitle: "Secure subscription platform with Stripe integration",
  authenticatedContent: {
    message: "",
    buttonText: "View Premium Products →",
    buttonHref: "/products"
  },
  unauthenticatedContent: {
    message: "Sign in to access our premium subscription plans",
    buttonText: "Explore Products →", 
    buttonHref: "/products"
  }
}

// Products page hero content (example for future use)
export const productsHeroContent: HeroContent = {
  title: "🛍️ Premium Products",
  subtitle: "Choose the perfect plan for your needs",
  authenticatedContent: {
    message: "Select your subscription plan below.",
    buttonText: "View Calculator →",
    buttonHref: "#calculator"
  },
  unauthenticatedContent: {
    message: "Sign in to purchase and access premium features.",
    buttonText: "Sign In →",
    buttonHref: "/api/auth/signin"
  }
}

/**
 * HeroSection Component
 * Reusable hero section with authentication-aware content
 * Displays different messages and CTAs based on user authentication status
 */
export function HeroSection({
  title,
  subtitle,
  session,
  authenticatedContent,
  unauthenticatedContent,
  className = "home-hero"
}: HeroSectionProps) {
  const content = session ? authenticatedContent : unauthenticatedContent
  
  return (
    <div className={className}>
      <h1>{title}</h1>
      <p className="text-xl text-gray-600 mb-8">
        {subtitle}
      </p>
      
      <div className="mb-8">
        <p className="text-lg mb-4 text-gray-600">
          {session ? (
            <>
              Welcome back, <strong>{session.user?.name || session.user?.email}</strong>! {content.message}
            </>
          ) : (
            content.message
          )}
        </p>
        <Link 
          href={content.buttonHref}
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {content.buttonText}
        </Link>
      </div>
    </div>
  )
}
