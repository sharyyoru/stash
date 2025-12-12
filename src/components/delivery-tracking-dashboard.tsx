"use client";

import { useState, useEffect } from "react";
import { formatTrackingStatus } from "../lib/jeebly";

type TrackingEvent = {
  status: string;
  description: string;
  hubName: string;
  timestamp: string;
  riderName?: string;
  podImage?: string;
  failureReason?: string;
};

type DeliveryInfo = {
  orderId: string;
  awbNumber: string;
  status: string;
  statusText: string;
  pickupDate?: string;
  bookingDate?: string;
  events: TrackingEvent[];
  customerName?: string | null;
  totalAmount: number;
  currency: string;
};

type DeliveryTrackingDashboardProps = {
  deliveries: DeliveryInfo[];
  onRefresh?: () => void;
};

export default function DeliveryTrackingDashboard({
  deliveries,
  onRefresh,
}: DeliveryTrackingDashboardProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) {
      // If no onRefresh function provided, just reload the page
      window.location.reload();
      return;
    }
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pickup_completed":
      case "inscan_at_hub":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pickup_scheduled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dubai",
    });
  };

  const inTransitDeliveries = deliveries.filter(d => 
    d.status !== "delivered" && d.status !== "cancelled" && d.status !== "failed"
  );

  const completedDeliveries = deliveries.filter(d => 
    d.status === "delivered" || d.status === "cancelled" || d.status === "failed"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Delivery Tracking Dashboard
          </h2>
          <p className="text-sm text-neutral-600">
            {inTransitDeliveries.length} ongoing deliveries, {completedDeliveries.length} completed
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Refreshing...
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh All
            </>
          )}
        </button>
      </div>

      {/* Ongoing Deliveries */}
      {inTransitDeliveries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-900">Ongoing Deliveries</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inTransitDeliveries.map((delivery) => (
              <div
                key={delivery.awbNumber}
                className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-neutral-500">{delivery.orderId}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.statusText}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{delivery.customerName || "Customer"}</p>
                    <p className="text-xs text-neutral-600">
                      {delivery.currency} {delivery.totalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-neutral-600">
                      <span className="font-medium">AWB:</span> {delivery.awbNumber}
                    </p>
                    {delivery.pickupDate && (
                      <p className="text-xs text-neutral-600">
                        <span className="font-medium">Pickup:</span> {formatDate(delivery.pickupDate)}
                      </p>
                    )}
                  </div>

                  {delivery.events.length > 0 && (
                    <div className="border-t border-neutral-100 pt-3">
                      <p className="text-xs font-medium text-neutral-700 mb-1">Latest Update:</p>
                      <p className="text-xs text-neutral-600">
                        {delivery.events[0].description}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(delivery.events[0].timestamp)}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedDelivery(
                      selectedDelivery === delivery.awbNumber ? null : delivery.awbNumber
                    )}
                    className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedDelivery === delivery.awbNumber ? "Hide Details" : "View Details"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed View */}
      {selectedDelivery && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          {(() => {
            const delivery = deliveries.find(d => d.awbNumber === selectedDelivery);
            if (!delivery) return null;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-900">
                    Delivery Details - {delivery.orderId}
                  </h3>
                  <button
                    onClick={() => setSelectedDelivery(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">Shipment Info</h4>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <p><span className="font-medium">AWB:</span> {delivery.awbNumber}</p>
                      <p><span className="font-medium">Status:</span> {delivery.statusText}</p>
                      {delivery.bookingDate && (
                        <p><span className="font-medium">Booked:</span> {formatDate(delivery.bookingDate)}</p>
                      )}
                      {delivery.pickupDate && (
                        <p><span className="font-medium">Pickup:</span> {formatDate(delivery.pickupDate)}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-2">Order Info</h4>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <p><span className="font-medium">Customer:</span> {delivery.customerName || "N/A"}</p>
                      <p><span className="font-medium">Amount:</span> {delivery.currency} {delivery.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {delivery.events.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Tracking History</h4>
                    <div className="space-y-3">
                      {delivery.events.map((event, index) => (
                        <div key={index} className="flex gap-3 pb-3 border-b border-neutral-100 last:border-b-0">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-neutral-900">{event.description}</p>
                            <p className="text-xs text-neutral-600">{event.hubName}</p>
                            <p className="text-xs text-neutral-500">{formatDate(event.timestamp)}</p>
                            {event.riderName && (
                              <p className="text-xs text-neutral-600">Rider: {event.riderName}</p>
                            )}
                            {event.failureReason && (
                              <p className="text-xs text-red-600">Reason: {event.failureReason}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Completed Deliveries Summary */}
      {completedDeliveries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-neutral-900">Recent Completed Deliveries</h3>
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    AWB
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {completedDeliveries.slice(0, 10).map((delivery) => (
                  <tr key={delivery.awbNumber} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-900">{delivery.orderId}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{delivery.customerName || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(delivery.status)}`}>
                        {delivery.statusText}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{delivery.awbNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deliveries.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-8 8-4-4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900">No deliveries found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            No shipments have been created yet.
          </p>
        </div>
      )}
    </div>
  );
}
