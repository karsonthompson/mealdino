"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

interface SubscriptionData {
  isActive: boolean;
  status: string;
  plan: string | null;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
}

const features = [
  "Unlimited recipe browsing & creation",
  "Custom meal planning (weekly & monthly)",
  "Recipe collections & organization",
  "Full macro & nutrition tracking",
  "Cooking session scheduling",
  "Meal prep & batch cooking support",
  "All future features included",
];

export default function PricingPageClient({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setCheckingStatus(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setCheckingStatus(false);
      }
    }

    fetchSubscription();
  }, [isAuthenticated]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      signIn(undefined, { callbackUrl: "/pricing" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal", {
        method: "POST",
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isActive = subscription?.isActive;
  const isCanceled = subscription?.status === "canceled";

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        {/* Pricing Card */}
        <div className="bg-gray-800 rounded-xl border-2 border-green-400 p-6 sm:p-8 shadow-lg shadow-green-400/10">
          {/* Badge */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 bg-green-400/10 text-green-400 text-sm font-semibold rounded-full border border-green-400/30">
              {isActive ? "✓ Your Current Plan" : "Pro Plan"}
            </span>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center">
              <span className="text-5xl sm:text-6xl font-bold text-white">$3</span>
              <span className="text-xl text-gray-400 ml-2">/week</span>
            </div>
            <p className="text-gray-400 mt-2 text-sm">
              Less than a coffee. Better meals every day.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 my-6"></div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          {checkingStatus ? (
            <div className="w-full py-3 text-center text-gray-400">
              Checking subscription...
            </div>
          ) : isActive ? (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-400">
                {subscription?.currentPeriodEnd && (
                  <p>
                    {isCanceled ? "Access until" : "Renews"}{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Manage Subscription"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 px-6 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/25"
            >
              {loading
                ? "Loading..."
                : !isAuthenticated
                  ? "Sign Up to Subscribe"
                  : "Subscribe Now"}
            </button>
          )}

          {/* Cancel note */}
          {!isActive && (
            <p className="text-center text-gray-500 text-xs mt-4">
              Cancel anytime. No questions asked.
            </p>
          )}
        </div>

        {/* FAQ-style note below */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Payments securely processed by{" "}
            <span className="text-gray-300 font-medium">Stripe</span>
          </p>
        </div>
      </div>
    </div>
  );
}
