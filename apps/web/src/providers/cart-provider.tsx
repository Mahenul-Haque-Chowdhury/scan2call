'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  calculateTagUnitPriceInCents,
  TAG_DEFAULT_DURATION_YEARS,
  TAG_MAX_DURATION_YEARS,
  TAG_MIN_DURATION_YEARS,
} from '@scan2call/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const CART_STORAGE_KEY = 'scan2call_cart';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  /** Per-year (QR yearly) price in AUD cents. */
  priceInCents: number;
  /** Find My device flat price (includes year 1), AUD cents. */
  devicePriceInCents?: number | null;
  hasFindMy?: boolean;
  quantity: number;
  /** QR duration the buyer selected (1-5 years). */
  durationYears: number;
  /** Whether to auto-renew the QR before it expires. */
  autoRenew: boolean;
  image?: string;
}

/** New items default to the minimum duration with auto-renew off. */
type NewCartItem = Omit<CartItem, 'quantity' | 'durationYears' | 'autoRenew'> &
  Partial<Pick<CartItem, 'durationYears' | 'autoRenew'>>;

interface CartContextValue {
  items: CartItem[];
  addItem: (product: NewCartItem, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDuration: (productId: string, durationYears: number) => void;
  updateAutoRenew: (productId: string, autoRenew: boolean) => void;
  clearCart: () => void;
  /** Total for a single line (unit price for the chosen duration x quantity). */
  getLineTotal: (item: CartItem) => number;
  getTotal: () => number;
  itemCount: number;
}

/** Unit price for a cart item given its product shape and chosen duration. */
export function getUnitPriceInCents(item: CartItem): number {
  return calculateTagUnitPriceInCents({
    priceInCents: item.priceInCents,
    hasFindMy: item.hasFindMy ?? false,
    devicePriceInCents: item.devicePriceInCents ?? null,
    years: item.durationYears,
  });
}

function clampDuration(years: number): number {
  if (!Number.isFinite(years)) return TAG_DEFAULT_DURATION_YEARS;
  return Math.max(TAG_MIN_DURATION_YEARS, Math.min(TAG_MAX_DURATION_YEARS, Math.round(years)));
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<CartItem>[];
      // Backfill fields added after the per-year pricing change.
      return parsed
        .filter((item): item is CartItem => !!item && typeof item.productId === 'string')
        .map((item) => ({
          ...item,
          quantity: item.quantity ?? 1,
          durationYears: clampDuration(item.durationYears ?? TAG_DEFAULT_DURATION_YEARS),
          autoRenew: item.autoRenew ?? false,
        }));
    }
  } catch {
    // Corrupted storage - start fresh
  }
  return [];
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadCartFromStorage());
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever items change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(items);
    }
  }, [items, isHydrated]);

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------

  const addItem = useCallback(
    (product: NewCartItem, quantity: number = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (item) => item.productId === product.productId,
        );
        if (existing) {
          return prev.map((item) =>
            item.productId === product.productId
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [
          ...prev,
          {
            ...product,
            quantity,
            durationYears: clampDuration(
              product.durationYears ?? TAG_DEFAULT_DURATION_YEARS,
            ),
            autoRenew: product.autoRenew ?? false,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter((item) => item.productId !== productId),
        );
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [],
  );

  const updateDuration = useCallback((productId: string, durationYears: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, durationYears: clampDuration(durationYears) }
          : item,
      ),
    );
  }, []);

  const updateAutoRenew = useCallback((productId: string, autoRenew: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, autoRenew } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getLineTotal = useCallback((item: CartItem) => {
    return getUnitPriceInCents(item) * item.quantity;
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce(
      (sum, item) => sum + getUnitPriceInCents(item) * item.quantity,
      0,
    );
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // --------------------------------------------------
  // Memoised context value
  // --------------------------------------------------

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateDuration,
      updateAutoRenew,
      clearCart,
      getLineTotal,
      getTotal,
      itemCount,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateDuration,
      updateAutoRenew,
      clearCart,
      getLineTotal,
      getTotal,
      itemCount,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === undefined) {
    throw new Error('useCart must be used within a <CartProvider>');
  }
  return ctx;
}
