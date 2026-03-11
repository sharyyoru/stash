"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type SyncResult = {
  total: number;
  synced: number;
  updated: number;
  inserted: number;
  errors: number;
  details: Array<{
    subscriptionId: string;
    email: string;
    action?: string;
    status: string;
    error?: string;
  }>;
};

type Comparison = {
  database: {
    count: number;
    active: number;
    latest: any[];
  };
  stripe: {
    count: number;
    active: number;
    latest: Array<{
      id: string;
      status: string;
      customer?: string;
      created: string;
    }>;
  };
  missing: string[];
  extra: string[];
};

export default function StripeSyncPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.email) {
      router.push("/sign-in");
      return;
    }
    fetchComparison();
  }, [session, sessionStatus, router]);

  const fetchComparison = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stripe-sync");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch comparison");
      }
      const data = await res.json();
      setComparison(data.comparison);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const performSync = async () => {
    if (!confirm("This will sync all Stripe subscriptions to your database. Continue?")) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      setSyncResult(null);

      const res = await fetch("/api/admin/stripe-sync", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }

      const data = await res.json();
      setSyncResult(data.results);
      setMessage({
        type: "success",
        text: data.message || "Sync completed successfully",
      });

      // Refresh comparison after sync
      await fetchComparison();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Sync failed",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === "loading" || (loading && !comparison)) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-64"></div>
            <div className="h-32 bg-neutral-200 rounded"></div>
            <div className="h-96 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-50 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={fetchComparison}
              className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-purple-600">
            Admin Tools
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Stripe Subscription Sync
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Bridge the gap between Stripe subscriptions and your admin database
          </p>
        </div>

        {/* Action Message */}
        {message && (
          <div
            className={`rounded-xl p-4 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-2 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Sync Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Sync Actions</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Sync all active Stripe subscriptions to your database
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchComparison}
                disabled={loading}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Refresh Comparison
              </button>
              <button
                onClick={performSync}
                disabled={loading}
                className="inline-flex items-center rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Perform Full Sync
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Database vs Stripe Comparison</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Database Stats */}
              <div className="space-y-3">
                <h3 className="font-medium text-neutral-700">Your Database</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Total Subscriptions:</span>
                    <span className="font-semibold">{comparison.database.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Active:</span>
                    <span className="font-semibold text-emerald-600">{comparison.database.active}</span>
                  </div>
                </div>
              </div>

              {/* Stripe Stats */}
              <div className="space-y-3">
                <h3 className="font-medium text-neutral-700">Stripe API</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Total Subscriptions:</span>
                    <span className="font-semibold">{comparison.stripe.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-600">Active:</span>
                    <span className="font-semibold text-emerald-600">{comparison.stripe.active}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Status */}
            <div className="border-t border-neutral-100 pt-4">
              <h3 className="font-medium text-neutral-700 mb-3">Sync Status</h3>
              
              {comparison.missing.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-700">
                      {comparison.missing.length} subscriptions in Stripe but NOT in database
                    </span>
                  </div>
                  <p className="text-xs text-red-600">
                    These need to be synced. Click "Perform Full Sync" to import them.
                  </p>
                </div>
              )}

              {comparison.extra.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-700">
                      {comparison.extra.length} subscriptions in database but NOT in Stripe
                    </span>
                  </div>
                  <p className="text-xs text-yellow-600">
                    These may be cancelled or archived subscriptions.
                  </p>
                </div>
              )}

              {comparison.missing.length === 0 && comparison.extra.length === 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">
                    All subscriptions are in sync!
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sync Results */}
        {syncResult && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Sync Results</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-neutral-900">{syncResult.total}</p>
                <p className="text-xs text-neutral-500">Processed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{syncResult.synced}</p>
                <p className="text-xs text-neutral-500">Synced</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{syncResult.inserted}</p>
                <p className="text-xs text-neutral-500">New</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{syncResult.errors}</p>
                <p className="text-xs text-neutral-500">Errors</p>
              </div>
            </div>

            {/* Detailed Results */}
            {syncResult.details.length > 0 && (
              <div className="border-t border-neutral-100 pt-4">
                <h3 className="font-medium text-neutral-700 mb-3">Detailed Results</h3>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Subscription ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Action</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {syncResult.details.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 font-mono text-xs">{detail.subscriptionId}</td>
                          <td className="px-3 py-2 text-xs">{detail.email}</td>
                          <td className="px-3 py-2 text-xs">{detail.action || "-"}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              detail.status === "success" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {detail.status}
                            </span>
                            {detail.error && (
                              <p className="text-xs text-red-600 mt-1">{detail.error}</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <h3 className="font-semibold text-blue-900 mb-2">How This Works</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Comparison:</strong> Shows the difference between your database and Stripe API</p>
            <p>• <strong>Missing:</strong> Subscriptions in Stripe but not in your database (need sync)</p>
            <p>• <strong>Extra:</strong> Subscriptions in database but not in Stripe (may be cancelled)</p>
            <p>• <strong>Full Sync:</strong> Imports all active Stripe subscriptions into your database</p>
            <p>• <strong>Smart Updates:</strong> Existing subscriptions are updated, new ones are inserted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
