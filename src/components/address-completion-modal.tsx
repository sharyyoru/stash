"use client";

import { useState, useEffect } from "react";

export type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  mobile: string;
  whatsapp: string;
  whatsappSameAsMobile: boolean;
};

const emptyAddress: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  mobile: "",
  whatsapp: "",
  whatsappSameAsMobile: true,
};

const REQUIRED_FIELDS: (keyof Address)[] = ["line1", "mobile", "city", "state"];

type AddressCompletionModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (address: Address) => void;
  email?: string | null;
  existingAddress?: Partial<Address> | null;
};

export function isAddressComplete(address: Partial<Address> | null | undefined): boolean {
  if (!address) return false;
  return REQUIRED_FIELDS.every((field) => {
    const value = address[field];
    if (field === "mobile") {
      return typeof value === "string" && value.trim().length >= 7;
    }
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function getMissingFields(address: Partial<Address> | null | undefined): string[] {
  const missing: string[] = [];
  if (!address) {
    return ["Address Line 1", "Mobile Number", "City", "State/Emirate"];
  }
  
  if (!address.line1 || address.line1.trim().length === 0) {
    missing.push("Address Line 1");
  }
  if (!address.mobile || address.mobile.trim().length < 7) {
    missing.push("Mobile Number");
  }
  if (!address.city || address.city.trim().length === 0) {
    missing.push("City");
  }
  if (!address.state || address.state.trim().length === 0) {
    missing.push("State/Emirate");
  }
  
  return missing;
}

export default function AddressCompletionModal({
  open,
  onClose,
  onComplete,
  email,
  existingAddress,
}: AddressCompletionModalProps) {
  const [address, setAddress] = useState<Address>({
    ...emptyAddress,
    ...existingAddress,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && existingAddress) {
      setAddress((prev) => ({
        ...prev,
        ...existingAddress,
      }));
    }
  }, [open, existingAddress]);

  const handleChange = (field: keyof Address, value: Address[keyof Address]) => {
    setAddress((prev) => {
      const next: Address = { ...prev, [field]: value } as Address;

      if (field === "mobile" && next.whatsappSameAsMobile) {
        next.whatsapp = String(value ?? "");
      }

      if (field === "whatsappSameAsMobile") {
        if (value) {
          next.whatsapp = next.mobile;
        } else {
          next.whatsapp = "";
        }
      }

      return next;
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const missingFields = getMissingFields(address);
    if (missingFields.length > 0) {
      setError(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    // Save to localStorage
    if (email) {
      try {
        const storageKey = `stash_profile_address:${email}`;
        window.localStorage.setItem(storageKey, JSON.stringify(address));
      } catch {
        // ignore storage errors
      }
    }

    onComplete(address);
  };

  if (!open) return null;

  const missingFieldsList = getMissingFields(existingAddress);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="relative w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-neutral-200 max-h-[95vh] sm:max-h-[85vh] overflow-y-auto">
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Complete your address
            </p>
            <p className="text-sm text-neutral-700">
              We need your delivery address to proceed with checkout.
            </p>
            {missingFieldsList.length > 0 && (
              <p className="text-xs text-amber-600">
                Missing: {missingFieldsList.join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label htmlFor="modal-line1" className="text-xs font-medium text-neutral-700">
                Address line 1 <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-line1"
                type="text"
                value={address.line1}
                onChange={(e) => handleChange("line1", e.target.value)}
                placeholder="Street address, building name"
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="modal-line2" className="text-xs font-medium text-neutral-700">
                Address line 2 (optional)
              </label>
              <input
                id="modal-line2"
                type="text"
                value={address.line2}
                onChange={(e) => handleChange("line2", e.target.value)}
                placeholder="Apartment, suite, floor"
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="modal-city" className="text-xs font-medium text-neutral-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="modal-city"
                  type="text"
                  value={address.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Dubai, Abu Dhabi..."
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="modal-state" className="text-xs font-medium text-neutral-700">
                  Emirate <span className="text-red-500">*</span>
                </label>
                <select
                  id="modal-state"
                  value={address.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
                >
                  <option value="">Select emirate</option>
                  <option value="Dubai">Dubai</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Ajman">Ajman</option>
                  <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  <option value="Fujairah">Fujairah</option>
                  <option value="Umm Al Quwain">Umm Al Quwain</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="modal-mobile" className="text-xs font-medium text-neutral-700">
                Mobile number <span className="text-red-500">*</span>
              </label>
              <input
                id="modal-mobile"
                type="tel"
                value={address.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                placeholder="+971 50 123 4567"
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="modal-whatsapp" className="text-xs font-medium text-neutral-700">
                WhatsApp number
              </label>
              <input
                id="modal-whatsapp"
                type="tel"
                value={address.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                disabled={address.whatsappSameAsMobile}
                className="w-full rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-500"
              />
              <label className="mt-1 inline-flex items-center gap-2 text-[11px] text-neutral-600">
                <input
                  type="checkbox"
                  checked={address.whatsappSameAsMobile}
                  onChange={(e) => handleChange("whatsappSameAsMobile", e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300"
                />
                <span>Same as mobile</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-neutral-800"
            >
              Save &amp; Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
