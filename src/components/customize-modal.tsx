"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadCustomImage } from "../lib/supabase";

export type CustomizationData = {
  text: string;
  imageUrl?: string;
  imagePath?: string;
};

type CustomizeModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (customization: CustomizationData) => void;
  productId: string;
  productTitle: string;
  productImageUrl?: string;
};

export default function CustomizeModal({
  open,
  onClose,
  onConfirm,
  productId,
  productTitle,
  productImageUrl,
}: CustomizeModalProps) {
  const [customText, setCustomText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customText.trim()) {
      setError("Please enter your customization request");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let imageData: { url: string; path: string } | null = null;

      // Upload image if selected
      if (selectedFile) {
        imageData = await uploadCustomImage(selectedFile, productId);
        if (!imageData) {
          setError("Failed to upload image. Please try again.");
          setIsUploading(false);
          return;
        }
      }

      // Call onConfirm with customization data
      onConfirm({
        text: customText.trim(),
        imageUrl: imageData?.url,
        imagePath: imageData?.path,
      });

      // Reset form
      setCustomText("");
      setSelectedFile(null);
      setPreviewUrl(null);
      onClose();
    } catch (err) {
      console.error("Error submitting customization:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="relative w-full sm:max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-lg ring-1 ring-neutral-200 max-h-[95vh] sm:max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          onClick={onClose}
        >
          <span aria-hidden="true" className="text-lg">×</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Header */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
              Customize Your Order
            </p>
            <h2 className="text-base font-semibold text-neutral-900">
              {productTitle}
            </h2>
          </div>

          {/* Product preview */}
          {productImageUrl && (
            <div className="relative h-32 w-32 overflow-hidden rounded-2xl bg-neutral-100">
              <Image
                src={productImageUrl}
                alt={productTitle}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Custom text input */}
          <div className="space-y-2">
            <label
              htmlFor="custom-text"
              className="text-xs font-medium text-neutral-700"
            >
              Your customization request <span className="text-red-500">*</span>
            </label>
            <textarea
              id="custom-text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Describe what you'd like us to customize (e.g., name, colors, specific design changes...)"
              rows={4}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200 resize-none"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-700">
              Reference image (optional)
            </label>
            <p className="text-[11px] text-neutral-500">
              Upload an image to help us understand your vision. Max 5MB.
            </p>

            {previewUrl ? (
              <div className="relative">
                <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-neutral-100">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Click to upload image</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !customText.trim()}
              className="flex-1 rounded-full bg-[#f3b560] px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-[#e9a946] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Processing..." : "Add to Stash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
