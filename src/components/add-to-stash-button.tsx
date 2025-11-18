"use client";

import { useState } from "react";
import { useCart } from "./cart-context";

export type AddToStashPayload = {
  id: string;
  title: string;
  slug?: string;
  priceText?: string;
  imageUrl?: string;
};

type AddToStashButtonProps = AddToStashPayload & {
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
};

export default function AddToStashButton({
  id,
  title,
  slug,
  priceText,
  imageUrl,
  quantity = 1,
  className,
  children,
}: AddToStashButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    addItem({ id, title, slug, priceText, imageUrl }, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
  };

  const label = children || (justAdded ? "Added to stash" : "Add to stash");

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        "mt-2 inline-flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-medium text-neutral-800 transition hover:border-neutral-400 hover:bg-neutral-50"
      }
    >
      {label}
    </button>
  );
}
