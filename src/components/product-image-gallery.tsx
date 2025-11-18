"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImage = {
  url?: string;
};

type ProductImageGalleryProps = {
  images: ProductImage[];
  alt: string;
};

export default function ProductImageGallery({
  images,
  alt,
}: ProductImageGalleryProps) {
  const validImages = (images || []).filter((img) => img && img.url);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const mainImage = validImages[selectedIndex] ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-neutral-100">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-100">
          {mainImage?.url ? (
            <Image
              src={mainImage.url}
              alt={alt}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">
              Product imagery coming soon.
            </div>
          )}
        </div>
      </div>

      {validImages.length > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {validImages.map((img, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 transition ring-1 ring-transparent hover:ring-neutral-300 ${
                index === selectedIndex ? "ring-neutral-900" : ""
              }`}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={alt}
                  fill
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
