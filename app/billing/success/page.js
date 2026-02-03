import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-xl border border-gray-700 bg-gray-800 p-8 text-center">
        <h1 className="mb-3 text-3xl font-bold text-green-400">Success</h1>
        <p className="mb-8 text-gray-200">
          Thanks for subscribing. Your checkout is complete.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-green-500 px-5 py-3 font-semibold text-gray-900 hover:bg-green-400"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
