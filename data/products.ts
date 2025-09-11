export interface Product {
  id: string
  title: string
  description: string
  features: string[]
  price: string
  variant: 'default' | 'premium' | 'enterprise'
}

/**
 * Product Data
 * Centralized product/subscription tier information
 * Makes it easy to update pricing and features
 */
export const products: Product[] = [
  {
    id: 'free',
    title: '🚀 Free Plan',
    description: 'Perfect for beginners getting started with our platform.',
    features: [
      'Basic features',
      'Email support',
      '5GB storage'
    ],
    price: 'Free',
    variant: 'default'
  },
  {
    id: 'basic',
    title: '⭐ Basic Plan',
    description: 'Advanced features for growing businesses.',
    features: [
      'All Free features',
      'Priority support',
      '50GB storage',
      'Advanced analytics'
    ],
    price: '$9.99/month',
    variant: 'premium'
  },
  {
    id: 'premium',
    title: '🏢 Premium Plan',
    description: 'Complete solution for large organizations.',
    features: [
      'All Basic features',
      '24/7 phone support',
      'Unlimited storage',
      'Custom integrations',
      'Dedicated account manager'
    ],
    price: '$29.99/month',
    variant: 'enterprise'
  }
]
