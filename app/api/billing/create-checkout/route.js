import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID in environment" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const successUrl =
      body.successUrl ||
      `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${baseUrl}/dashboard?canceled=true`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userEmail: session.user.email,
        ...(session.user.id ? { userId: session.user.id } : {}),
      },
      ...(session.user.id ? { client_reference_id: session.user.id } : {}),
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    console.error("create-checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID in environment" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email,
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?canceled=true`,
      metadata: {
        userEmail: session.user.email,
        ...(session.user.id ? { userId: session.user.id } : {}),
      },
      ...(session.user.id ? { client_reference_id: session.user.id } : {}),
    });

    return NextResponse.redirect(checkoutSession.url);
  } catch (error) {
    console.error("create-checkout GET error:", error);
    return NextResponse.redirect(new URL("/dashboard?checkout_error=true", process.env.NEXT_PUBLIC_URL || "http://localhost:3000"));
  }
}
