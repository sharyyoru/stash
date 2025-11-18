"use client";

import { useState } from "react";

type CopyableTextProps = {
  text: string;
  className?: string;
};

export default function CopyableText({ text, className = "" }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ||
        "inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
      }
    >
      <span>{text || "—"}</span>
      {text && (
        <span className="text-[10px] text-neutral-500">{copied ? "Copied" : "Copy"}</span>
      )}
    </button>
  );
}
