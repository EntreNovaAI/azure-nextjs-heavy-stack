interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

/**
 * FeatureCard Component
 * Reusable card component for displaying features with icon, title, and description
 * Used in hero sections and feature showcases
 */
export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="feature-card">
      <h3>{icon} {title}</h3>
      <p>{description}</p>
    </div>
  )
}
