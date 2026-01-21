"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type VerificationResult = {
  success: boolean;
  subscription?: {
    id: string;
    status: string;
    productTitle: string;
    amount: number;
    currency: string;
    nextBillingDate: string;
    billingDay: number;
  };
  paymentStatus?: string;
  error?: string;
};

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscription_id");
  const paymentIntentId = searchParams.get("payment_intent_id");

  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!subscriptionId || !paymentIntentId) {
      setIsVerifying(false);
      setResult({ success: false, error: "Missing subscription or payment information" });
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch("/api/subscriptions/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId, paymentIntentId }),
        });

        const data = await res.json();

        if (!res.ok) {
          setResult({ success: false, error: data.error || "Verification failed" });
        } else {
          setResult({
            success: data.success,
            subscription: data.subscription,
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
  }, [subscriptionId, paymentIntentId]);

  if (isVerifying) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
          <p className="text-sm text-neutral-600">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-10 w-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-neutral-900">Subscription Issue</h1>
            <p className="text-neutral-600">{result?.error || "Something went wrong with your subscription."}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/category/the-secret-stash"
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
            >
              Try Again
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sub = result.subscription;
  const nextBillingFormatted = sub?.nextBillingDate
    ? new Date(sub.nextBillingDate).toLocaleDateString("en-AE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900">Subscription Active!</h1>
          <p className="text-neutral-600">
            Thank you for subscribing to {sub?.productTitle || "The Secret Stash"}.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-50 p-4 space-y-3 text-left text-sm">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Subscription ID</span>
            <span className="font-mono text-neutral-900">{sub?.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Monthly Amount</span>
            <span className="font-medium text-neutral-900">
              {sub?.currency} {sub?.amount?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Next Billing</span>
            <span className="text-neutral-900">{nextBillingFormatted}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Billing Day</span>
            <span className="text-neutral-900">
              {sub?.billingDay}{getOrdinalSuffix(sub?.billingDay || 1)} of each month
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          You'll receive a payment link via email each month on your billing day.
          You can manage your subscription from your account.
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-neutral-800"
          >
            View My Subscriptions
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

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
