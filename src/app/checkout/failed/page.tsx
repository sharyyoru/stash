"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">
            Payment Failed
          </h1>
          <p className="text-neutral-600">
            Unfortunately, your payment could not be processed. Please try again
            or use a different payment method.
          </p>
        </div>
        {orderId && (
          <p className="text-sm text-neutral-500">
            Order reference: {orderId}
          </p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/stash"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Back to Home
          </Link>
        </div>
        <p className="text-xs text-neutral-400 pt-4">
          If you continue to experience issues, please contact our support team.
        </p>
      </div>
    </div>
  );
}
