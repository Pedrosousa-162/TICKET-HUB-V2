import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SLiRqCbHzj3iuuOH49d2NjjMvP9L6eNCJiFqP5WYADBCqdlCWrZ2oBzcuLkivqV4cESruF64f06qyZRDdE0USel00zTU58DCS'
    )
  }
  return stripePromise
}
