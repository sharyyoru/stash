"use client";

import { useState } from "react";
import { useCart, type CustomizationData } from "./cart-context";
import CustomizeModal from "./customize-modal";

export type AddToStashPayload = {
  id: string;
  title: string;
  slug?: string;
  priceText?: string;
  imageUrl?: string;
  badges?: string[];
};

type AddToStashButtonProps = AddToStashPayload & {
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
};

// Check if product requires customization
function requiresCustomization(badges?: string[]): boolean {
  if (!badges || !Array.isArray(badges)) return false;
  return badges.some(
    (badge) => badge.toLowerCase().replace(/[^a-z]/g, "") === "customize"
  );
}

export default function AddToStashButton({
  id,
  title,
  slug,
  priceText,
  imageUrl,
  badges,
  quantity = 1,
  className,
  children,
}: AddToStashButtonProps) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const isCustomizable = requiresCustomization(badges);

  const handleClick = () => {
    if (isCustomizable) {
      setShowCustomizeModal(true);
      return;
    }
    
    addItem({ id, title, slug, priceText, imageUrl }, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
  };

  const handleCustomizationConfirm = (customization: CustomizationData) => {
    addItem(
      { id, title, slug, priceText, imageUrl, customization },
      quantity
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 900);
    setShowCustomizeModal(false);
  };

  const label = children || (justAdded ? "Added to stash" : isCustomizable ? "Customize & Add" : "Add to stash");

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          `mt-2 inline-flex w-full items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
            isCustomizable
              ? "border-[#f3b560] bg-[#f3b560]/10 text-[#b08968] hover:bg-[#f3b560]/20"
              : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
          }`
        }
      >
        {label}
      </button>

      {isCustomizable && (
        <CustomizeModal
          open={showCustomizeModal}
          onClose={() => setShowCustomizeModal(false)}
          onConfirm={handleCustomizationConfirm}
          productId={id}
          productTitle={title}
          productImageUrl={imageUrl}
        />
      )}
    </>
  );
}
