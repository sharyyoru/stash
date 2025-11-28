"use client";

import { useState } from "react";

type CreateShipmentButtonProps = {
  orderId: string;
  orderStatus: string;
  existingAwb?: string;
};

export default function CreateShipmentButton({
  orderId,
  orderStatus,
  existingAwb,
}: CreateShipmentButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    awbNumber?: string;
    error?: string;
  } | null>(null);

  // Only show for paid or processing orders without existing AWB
  const canCreateShipment =
    (orderStatus === "paid" || orderStatus === "processing") && !existingAwb;

  const handleCreateShipment = async () => {
    if (!canCreateShipment || isCreating) return;

    setIsCreating(true);
    setResult(null);

    try {
      const res = await fetch("/api/shipping/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          deliveryType: "Next Day",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          success: false,
          error: data.error || "Failed to create shipment",
        });
      } else {
        setResult({
          success: true,
          awbNumber: data.awbNumber,
        });
        // Refresh the page to show updated AWB
        window.location.reload();
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Failed to create shipment",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // If shipment already exists, show the AWB number
  if (existingAwb) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-neutral-900">AWB:</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          {existingAwb}
        </span>
      </div>
    );
  }

  // If order is not eligible for shipment
  if (!canCreateShipment) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCreateShipment}
        disabled={isCreating}
        className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-medium text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? (
          <>
            <svg
              className="mr-1.5 h-3 w-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Creating...
          </>
        ) : (
          <>
            <svg
              className="mr-1.5 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            Create Jeebly Shipment
          </>
        )}
      </button>

      {result && !result.success && (
        <span className="text-[11px] text-red-600">{result.error}</span>
      )}
    </div>
  );
}
