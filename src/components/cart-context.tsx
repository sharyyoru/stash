"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type CustomizationData = {
  text: string;
  imageUrl?: string;
  imagePath?: string;
};

export type CartItem = {
  id: string;
  title: string;
  slug?: string;
  priceText?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  quantity: number;
  customization?: CustomizationData;
};

const STORAGE_KEY = "stash_cart_v1";

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  totalAmount: number;
  currency: string;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const MAIL_CLUB_SLUG = "the-secret-stash-mail-club";

function parsePriceFromText(priceText?: string): number | undefined {
  if (!priceText) return undefined;
  const cleaned = priceText.replace(/,/g, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isNaN(value) ? undefined : value;
}

function inferCurrency(priceText?: string): string | undefined {
  if (!priceText) return undefined;
  const parts = priceText.trim().split(/\s+/);
  const first = parts[0];
  return /[A-Za-z]/.test(first) ? first : undefined;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) {
        itemsRef.current = parsed;
        setItems(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    if (!item.id || quantity <= 0) return false;

    const current = itemsRef.current;
    const cartHasMailClub = current.some((i) => i.slug === MAIL_CLUB_SLUG);
    const cartHasOther = current.some((i) => i.slug !== MAIL_CLUB_SLUG);
    const incomingIsMailClub = item.slug === MAIL_CLUB_SLUG;

    if (cartHasMailClub && !incomingIsMailClub) {
      return false;
    }
    if (cartHasOther && incomingIsMailClub) {
      return false;
    }

    // If item has customization, create a unique ID for it so each customized item is separate
    const itemId = item.customization 
      ? `${item.id}::custom::${Date.now()}`
      : item.id;

    let next: CartItem[];

    // For customized items, always add as new entry
    if (item.customization) {
      next = [
        ...current,
        {
          ...item,
          id: itemId,
          quantity,
        },
      ];
    } else {
      // For regular items, check if already exists
      const existing = current.find((i) => i.id === item.id && !i.customization);
      if (existing) {
        next = current.map((i) =>
          i.id === item.id && !i.customization ? { ...i, quantity: i.quantity + quantity } : i,
        );
      } else {
        next = [
          ...current,
          {
            ...item,
            quantity,
          },
        ];
      }
    }

    itemsRef.current = next;
    setItems(next);

    return true;
  };

  const removeItem: CartContextValue["removeItem"] = (id) => {
    const next = itemsRef.current.filter((i) => i.id !== id);
    itemsRef.current = next;
    setItems(next);
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (id, quantity) => {
    if (quantity <= 0) return;
    const next = itemsRef.current.map((i) => (i.id === id ? { ...i, quantity } : i));
    itemsRef.current = next;
    setItems(next);
  };

  const clear: CartContextValue["clear"] = () => {
    itemsRef.current = [];
    setItems([]);
  };

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalAmount = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unit =
          typeof item.price === "number"
            ? item.price
            : parsePriceFromText(item.priceText);
        if (!unit) return sum;
        return sum + unit * item.quantity;
      }, 0),
    [items],
  );

  const currency = useMemo(() => {
    const withCurrency = items.find((i) => i.currency)?.currency;
    if (withCurrency) return withCurrency;
    const withText = items.find((i) => i.priceText)?.priceText;
    return inferCurrency(withText) || "AED";
  }, [items]);

  const value = useMemo(
    () => ({ items, totalCount, totalAmount, currency, addItem, removeItem, updateQuantity, clear }),
    [items, totalCount, totalAmount, currency],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
