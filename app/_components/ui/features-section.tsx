import { FeatureCard } from './feature-card'

interface Feature {
  icon: string
  title: string
  description: string
}

interface FeaturesSectionProps {
  features: Feature[]
  className?: string
}

/**
 * FeaturesSection Component
 * Data-driven features section that renders a grid of feature cards
 * Accepts an array of features to display, making it reusable across pages
 */
export function FeaturesSection({ features, className = "hero-features" }: FeaturesSectionProps) {
  return (
    <div className={className}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  )
}
