"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "../../../components/cart-context";

type VerificationResult = {
  success: boolean;
  order?: {
    id: string;
    status: string;
    totalAmount: number;
    currency: string;
  };
  paymentStatus?: string;
  error?: string;
};

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paymentIntentId = searchParams.get("payment_intent_id");

  const { clear } = useCart();

  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!orderId || !paymentIntentId) {
      setIsVerifying(false);
      setResult({ success: false, error: "Missing order or payment information" });
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentIntentId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setResult({ success: false, error: data.error || "Verification failed" });
        } else {
          setResult({
            success: data.success,
            order: data.order,
            paymentStatus: data.paymentStatus,
          });
        }
      } catch (error) {
        setResult({ success: false, error: "Failed to verify payment" });
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [orderId, paymentIntentId]);

  useEffect(() => {
    if (result?.success) {
      clear();
    }
  }, [result?.success, clear]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {isVerifying ? (
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
            <p className="text-sm text-neutral-600">Verifying your payment...</p>
          </div>
        ) : result?.success ? (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-10 w-10 text-emerald-600"
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
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                Payment Successful!
              </h1>
              <p className="text-neutral-600">
                Thank you for your order. We've received your payment.
              </p>
            </div>
            {result.order && (
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm">
                <p className="font-medium text-neutral-900">
                  Order: {result.order.id}
                </p>
                <p className="text-neutral-600">
                  {result.order.currency} {result.order.totalAmount.toFixed(2)}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
              >
                View My Orders
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-10 w-10 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                Payment Pending
              </h1>
              <p className="text-neutral-600">
                {result?.error || "Your payment is being processed. We'll update you soon."}
              </p>
            </div>
            {orderId && (
              <p className="text-sm text-neutral-500">Order: {orderId}</p>
            )}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
              >
                Check Order Status
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
