interface ProductCardProps {
  title: string
  description: string
  features: string[]
  price: string
  variant?: 'default' | 'premium' | 'enterprise'
}

/**
 * ProductCard Component
 * Reusable card component for displaying product/subscription tiers
 * Supports different styling variants for different plan types
 */
export function ProductCard({ 
  title, 
  description, 
  features, 
  price, 
  variant = 'default' 
}: ProductCardProps) {
  const cardClass = `product-card ${variant !== 'default' ? variant : ''}`
  
  return (
    <div className={cardClass}>
      <h3>{title}</h3>
      <p>{description}</p>
      
      <div className="product-features">
        <ul>
          {features.map((feature, index) => (
            <li key={index}>✅ {feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="product-price">{price}</div>
    </div>
  )
}
