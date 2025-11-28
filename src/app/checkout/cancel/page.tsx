"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
          <svg
            className="h-10 w-10 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">
            Payment Cancelled
          </h1>
          <p className="text-neutral-600">
            Your payment was cancelled. No charges were made.
          </p>
        </div>
        {orderId && (
          <p className="text-sm text-neutral-500">
            Your order ({orderId}) is saved. You can complete payment anytime.
          </p>
        )}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/stash"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
          >
            Return to Stash
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
