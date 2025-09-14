import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })
  const sig = req.headers.get("stripe-signature")!
  const body = await req.text()
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

  if (event.type === "checkout.session.completed") {
    // TODO: fulfill purchase
  }
  return NextResponse.json({ received: true })
}
