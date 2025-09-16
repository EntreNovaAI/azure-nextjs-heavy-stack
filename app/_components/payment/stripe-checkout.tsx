import * as React from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// This follows Stripe's recommended pattern from their docs
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeCheckout() {
  // Create fetchClientSecret function following Stripe's recommended async pattern
  const fetchClientSecret = React.useCallback(async () => {
    try {
      // Get the selected product from sessionStorage
      const selectedProduct = sessionStorage.getItem('selectedProduct') || 'basic'

      // Create a Checkout Session using our Next.js API route
      const response = await axios.post("/api/stripe/create-checkout", {
        id: selectedProduct // Pass the selected product ID
      });

      const data = response.data;
      console.log('API Response:', data);
      
      // Ensure we have a client secret
      if (!data.clientSecret) {
        throw new Error('No client secret returned from API');
      }
      
      return data.clientSecret;
    } catch (error) {
      console.error('Error in fetchClientSecret:', error);
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        console.error('API Error:', errorData);
        throw new Error(errorData?.error || 'Failed to create checkout session');
      }
      throw error; // Re-throw to let Stripe handle it
    }
  }, []);

  const options = { fetchClientSecret };

  return (
    <div id="checkout">
      {/* Checkout will insert the payment form here */}
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}