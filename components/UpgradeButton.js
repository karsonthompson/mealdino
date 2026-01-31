'use client';

import { useState } from 'react';

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      const { url, error } = await res.json();

      if (error) {
        alert('Failed to start checkout');
        setLoading(false);
        return;
      }

      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Upgrade to Premium - $3/week'}
    </button>
  );
}
