"use client";

import { useState } from "react";
import AddToStashButton from "./add-to-stash-button";

type ProductAddToStashProps = {
  id: string;
  title: string;
  slug?: string;
  priceText?: string;
  imageUrl?: string;
};

export default function ProductAddToStash({
  id,
  title,
  slug,
  priceText,
  imageUrl,
}: ProductAddToStashProps) {
  const [quantity, setQuantity] = useState<number>(1);

  const handleChange = (value: string) => {
    const num = Number(value);
    if (Number.isNaN(num) || num <= 0) {
      setQuantity(1);
    } else {
      setQuantity(Math.floor(num));
    }
  };

  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 shadow-sm">
        <label
          className="mr-2 text-xs text-neutral-500"
          htmlFor="quantity"
        >
          Qty
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => handleChange(e.target.value)}
          className="w-14 border-0 bg-transparent text-sm text-neutral-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
      <AddToStashButton
        id={id}
        title={title}
        slug={slug}
        priceText={priceText}
        imageUrl={imageUrl}
        quantity={quantity}
        className="inline-flex flex-1 items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800"
      >
        Add to stash
      </AddToStashButton>
    </div>
  );
}
