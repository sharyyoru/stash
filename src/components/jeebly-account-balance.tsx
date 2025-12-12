"use client";

import { useState, useEffect } from "react";

type AccountBalance = {
  balance: number;
  currency: string;
  creditLimit: number;
  availableBalance: number;
};

export default function JeeblyAccountBalance() {
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/jeebly/balance");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch balance");
      }

      setBalance({
        balance: data.balance,
        currency: data.currency,
        creditLimit: data.creditLimit,
        availableBalance: data.availableBalance,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-red-800">Balance Error</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <button
            onClick={fetchBalance}
            className="text-xs text-red-700 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-xs text-neutral-600">Loading balance...</p>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Jeebly Account</p>
          <p className="text-sm font-semibold text-neutral-900">
            {balance.currency} {balance.balance.toFixed(2)}
          </p>
          {balance.creditLimit > 0 && (
            <p className="text-xs text-neutral-600">
              Credit: {balance.currency} {balance.creditLimit.toFixed(2)}
            </p>
          )}
          {balance.availableBalance !== balance.balance && (
            <p className="text-xs text-neutral-600">
              Available: {balance.currency} {balance.availableBalance.toFixed(2)}
            </p>
          )}
        </div>
        <button
          onClick={fetchBalance}
          className="text-xs text-neutral-500 hover:text-neutral-700"
          title="Refresh balance"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
