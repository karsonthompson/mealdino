import { auth } from "@/auth";
import { redirect } from "next/navigation";

import UpgradeButton from '@/components/UpgradeButton';

export default async function TestStripePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Stripe Integration Test</h1>
      <div className="space-y-4">
        <p className="text-gray-600">
          Test the Stripe checkout flow with the upgrade button below.
          Note: You need to be signed in to access the checkout.
        </p>
        <UpgradeButton />
      </div>
    </div>
  );
}
