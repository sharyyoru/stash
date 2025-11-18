"use client";

import { useState } from "react";

type OrderProofUploadProps = {
  orderId: string;
  proofUrl?: string;
};

export default function OrderProofUpload({ orderId, proofUrl }: OrderProofUploadProps) {
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(proofUrl);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    setFile(next);
    setStatus("idle");
    setErrorMessage(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = (data as any)?.error || "Upload failed";
        throw new Error(message);
      }
      const url: string | undefined = data?.proofUrl || data?.order?.proofUrl;
      if (url) {
        setCurrentUrl(url);
      }
      setFile(null);
      setStatus("idle");
      setErrorMessage(null);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error?.message || "Could not upload proof.");
    }
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="text-[11px]"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || status === "uploading"}
          className="rounded-full bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-800"
        >
          {status === "uploading" ? "Uploading..." : "Upload proof"}
        </button>
      </div>
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
        >
          View proof
        </a>
      )}
      {status === "error" && (
        <p className="text-[11px] text-red-600">{errorMessage || "Could not upload proof. Try again."}</p>
      )}
    </div>
  );
}
