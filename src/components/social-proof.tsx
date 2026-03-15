"use client";

import { useState, useEffect } from "react";

type SocialProofProps = {
  productSlug: string;
  productTitle?: string;
  className?: string;
};

type ViewData = {
  recentViews: number;
  totalViews: number;
};

export default function SocialProof({ productSlug, productTitle, className = "" }: SocialProofProps) {
  const [viewData, setViewData] = useState<ViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAndTrackViews() {
      try {
        // Track the view
        await fetch("/api/analytics/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productSlug,
            productTitle,
          }),
        });

        // Fetch view counts
        const response = await fetch(`/api/analytics/view?slug=${productSlug}`);
        if (response.ok) {
          const data = await response.json();
          setViewData(data);
        }
      } catch (error) {
        console.error("Error tracking/fetching views:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndTrackViews();
  }, [productSlug, productTitle]);

  // Don't show if no significant views
  if (isLoading || !viewData || viewData.recentViews < 2) {
    return null;
  }

  // Format the view count for display
  const displayCount = viewData.recentViews;
  const timeframe = "24 hours";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
        {/* Fire/trending icon */}
        <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-amber-700">
          {displayCount} {displayCount === 1 ? "person" : "people"} viewed this in the last {timeframe}
        </span>
      </div>
    </div>
  );
}

// Compact version for product cards
export function SocialProofBadge({ viewCount }: { viewCount?: number }) {
  if (!viewCount || viewCount < 5) return null;

  return (
    <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path
          fillRule="evenodd"
          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
          clipRule="evenodd"
        />
      </svg>
      {viewCount}+ views
    </div>
  );
}

// Low stock urgency indicator
export function LowStockIndicator({ stock }: { stock?: number }) {
  if (!stock || stock > 10) return null;

  const urgencyLevel = stock <= 3 ? "high" : stock <= 5 ? "medium" : "low";
  const colors = {
    high: "bg-red-50 text-red-600 border-red-200",
    medium: "bg-orange-50 text-orange-600 border-orange-200",
    low: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${colors[urgencyLevel]}`}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span className="text-sm font-medium">
        {stock <= 3 ? "Almost gone!" : `Only ${stock} left`}
      </span>
    </div>
  );
}

// Recently purchased indicator
export function RecentPurchaseIndicator({ count, timeframe = "today" }: { count: number; timeframe?: string }) {
  if (count < 1) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-green-700">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm font-medium">
        {count} {count === 1 ? "person" : "people"} bought this {timeframe}
      </span>
    </div>
  );
}
