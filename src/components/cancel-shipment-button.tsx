"use client";

import { useState } from "react";

type CancelShipmentButtonProps = {
  orderId: string;
  awbNumber?: string;
  shippingStatus?: string;
};

export default function CancelShipmentButton({
  orderId,
  awbNumber,
  shippingStatus,
}: CancelShipmentButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  // Only show for shipments that can be cancelled
  const canCancel = awbNumber && 
    shippingStatus && 
    shippingStatus !== "delivered" && 
    shippingStatus !== "cancelled";

  const handleCancelClick = () => {
    setShowReasonInput(true);
    setResult(null);
  };

  const handleConfirmCancel = async () => {
    if (!canCancel || isCancelling) return;

    setIsCancelling(true);
    setResult(null);

    try {
      const res = await fetch("/api/shipping/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          awbNumber,
          reason: reason.trim() || "Admin cancellation",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          success: false,
          error: data.error || "Failed to cancel shipment",
        });
      } else {
        setResult({
          success: true,
        });
        // Refresh the page to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "Failed to cancel shipment",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancel = () => {
    setShowReasonInput(false);
    setReason("");
    setResult(null);
  };

  if (!canCancel) {
    return null;
  }

  if (showReasonInput) {
    return (
      <div className="flex flex-col gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
        <p className="text-xs font-medium text-red-800">Cancel Shipment</p>
        <input
          type="text"
          placeholder="Reason for cancellation (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="text-xs px-2 py-1 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-400"
          disabled={isCancelling}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            className="flex-1 inline-flex items-center justify-center rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? (
              <>
                <svg
                  className="mr-1 h-3 w-3 animate-spin"
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
                Cancelling...
              </>
            ) : (
              "Confirm Cancel"
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {result && (
          <div className={`text-[11px] ${result.success ? "text-green-700" : "text-red-700"}`}>
            {result.success ? "Shipment cancelled successfully!" : result.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCancelClick}
      className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100"
    >
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Cancel Shipment
    </button>
  );
}
