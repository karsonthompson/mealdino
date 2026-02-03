import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2023-10-16",
});

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  await connectMongo();

  if (session.user.id && /^[a-fA-F0-9]{24}$/.test(session.user.id)) {
    const byId = await User.findById(session.user.id);
    if (byId) return byId;
  }

  return User.findOne({ email: session.user.email });
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const returnUrl = body.returnUrl || `${baseUrl}/dashboard`;
    const customerId = user.customerId || user.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user" },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ portalUrl: portalSession.url });
  } catch (error) {
    console.error("create-portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    if (!user) {
      return NextResponse.redirect(new URL("/dashboard", baseUrl));
    }

    const customerId = user.customerId || user.stripeCustomerId;
    if (!customerId) {
      return NextResponse.redirect(new URL("/dashboard?portal_error=no_customer", baseUrl));
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (error) {
    console.error("create-portal GET error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/dashboard?portal_error=true", baseUrl));
  }
}
