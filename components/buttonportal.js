"use client";

import { useState } from "react";

export default function ButtonPortal() {
  const [isLoading, setIsLoading] = useState(false);

  const handlePortal = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/billing/create-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.portalUrl) {
        throw new Error(data.error || "Failed to create portal session");
      }

      window.location.href = data.portalUrl;
    } catch (error) {
      alert(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePortal}
      disabled={isLoading}
      className="inline-flex items-center rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-900 hover:bg-green-400 disabled:opacity-60"
    >
      {isLoading ? "Loading..." : "Manage Billing"}
    </button>
  );
}
