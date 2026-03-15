"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

type PopupType = "shop" | "subscription";

const POPUP_STORAGE_KEY = "stash_exit_popup_shown";
const POPUP_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  // Determine popup type based on current page
  const popupType: PopupType = pathname?.startsWith("/secret-stash") ? "subscription" : "shop";

  // Check if popup should be shown
  const shouldShowPopup = useCallback(() => {
    if (typeof window === "undefined") return false;
    
    try {
      const stored = localStorage.getItem(POPUP_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const lastShown = data.timestamp || 0;
        if (Date.now() - lastShown < POPUP_COOLDOWN_MS) {
          return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  }, []);

  // Mark popup as shown
  const markPopupShown = useCallback(() => {
    try {
      localStorage.setItem(
        POPUP_STORAGE_KEY,
        JSON.stringify({ timestamp: Date.now(), type: popupType })
      );
    } catch {
      // Ignore storage errors
    }
  }, [popupType]);

  // Handle exit intent detection
  useEffect(() => {
    if (!shouldShowPopup()) return;

    let timeoutId: NodeJS.Timeout;
    let hasTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from top of viewport
      if (e.clientY <= 0 && !hasTriggered) {
        hasTriggered = true;
        // Small delay to prevent accidental triggers
        timeoutId = setTimeout(() => {
          setIsOpen(true);
          markPopupShown();
        }, 100);
      }
    };

    // Also trigger after 30 seconds of inactivity on mobile
    const handleScroll = () => {
      // Reset inactivity timer on scroll
    };

    // Delay adding the listener to avoid immediate triggers
    const addListenerTimeout = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000); // Wait 5 seconds before enabling exit intent

    return () => {
      clearTimeout(addListenerTimeout);
      clearTimeout(timeoutId);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [shouldShowPopup, markPopupShown]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: popupType === "subscription" ? "exit_popup_subscription" : "exit_popup_shop",
          pageUrl: pathname,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setDiscountCode(data.discountCode);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close popup
  const handleClose = () => {
    setIsOpen(false);
    setEmail("");
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Popup */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-neutral-500 backdrop-blur-sm transition hover:bg-white hover:text-neutral-700"
            aria-label="Close popup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {!isSuccess ? (
            <>
              {/* Header with gradient */}
              <div className={`px-8 pb-6 pt-10 ${
                popupType === "subscription"
                  ? "bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50"
                  : "bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50"
              }`}>
                <div className="text-center">
                  <span className="mb-2 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-700">
                    {popupType === "subscription" ? "Special Offer" : "Wait! Before you go..."}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-neutral-900">
                    {popupType === "subscription"
                      ? "Get 15% Off Your First Month"
                      : "Get 10% Off Your Order"}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    {popupType === "subscription"
                      ? "Join the Secret Stash Mail Club and receive exclusive stationery surprises every month."
                      : "Subscribe to get exclusive deals, new arrivals, and stationery inspiration."}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="px-8 pb-8 pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>

                  {error && (
                    <p className="text-center text-sm text-red-500">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-amber-500 py-3 font-medium text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 hover:shadow-amber-500/40 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Get My ${popupType === "subscription" ? "15%" : "10%"} Off`
                    )}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-neutral-400">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </div>
            </>
          ) : (
            /* Success state */
            <div className="px-8 py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">You're In! 🎉</h2>
              <p className="mt-2 text-neutral-600">
                Use this code at checkout:
              </p>
              
              {discountCode && (
                <div className="mt-4 inline-block rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-6 py-3">
                  <code className="text-xl font-bold text-amber-700">{discountCode}</code>
                </div>
              )}

              <p className="mt-4 text-sm text-neutral-500">
                {popupType === "subscription"
                  ? "Apply this code to get 15% off your first subscription month."
                  : "Apply this code to get 10% off your entire order."}
              </p>

              <button
                onClick={handleClose}
                className="mt-6 rounded-xl bg-neutral-100 px-6 py-2 font-medium text-neutral-700 transition hover:bg-neutral-200"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
