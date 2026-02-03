"use client";

import { useState } from "react";

export default function ButtonCheckout() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      alert(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className="inline-flex items-center rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-900 hover:bg-green-400 disabled:opacity-60"
    >
      {isLoading ? "Loading..." : "Checkout"}
    </button>
  );
}
