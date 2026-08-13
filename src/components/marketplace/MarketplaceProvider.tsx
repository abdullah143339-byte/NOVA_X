"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import api from "@/lib/api";
import { calcShipping, calcTotals } from "./pricing";
import type {
  CartLine,
  DeliveryOption,
  MarketplaceItem,
  MarketplacePrefs,
  Order,
  PaymentMethod,
  ShippingAddress,
  ToastMessage,
} from "./types";

interface PlaceOrderInput {
  address: ShippingAddress;
  payment: PaymentMethod;
  delivery: DeliveryOption;
}

interface MarketplaceContextValue {
  cart: CartLine[];
  wishlist: MarketplaceItem[];
  compare: MarketplaceItem[];
  recentlyViewed: MarketplaceItem[];
  orders: Order[];
  toasts: ToastMessage[];
  prefs: MarketplacePrefs;
  setPrefs: (prefs: Partial<MarketplacePrefs>) => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  addToCart: (item: MarketplaceItem, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  isInCart: (itemId: string) => boolean;
  toggleWishlist: (item: MarketplaceItem) => void;
  isWishlisted: (itemId: string) => boolean;
  toggleCompare: (item: MarketplaceItem) => void;
  isCompared: (itemId: string) => boolean;
  clearCompare: () => void;
  addRecentlyViewed: (item: MarketplaceItem) => void;
  placeOrder: (input: PlaceOrderInput) => Promise<Order | null>;
  notify: (message: string, type?: ToastMessage["type"]) => void;
  dismissToast: (id: string) => void;
}

const MarketplaceContext = createContext<MarketplaceContextValue | undefined>(undefined);

const CART_KEY = "novax_market_cart";
const WISHLIST_KEY = "novax_market_wishlist";
const COMPARE_KEY = "novax_market_compare";
const RECENT_KEY = "novax_market_recent";
const ORDERS_KEY = "novax_market_orders";
const PREFS_KEY = "novax_market_prefs";

const DEFAULT_PREFS: MarketplacePrefs = { currency: "PKR", language: "en", location: "karachi" };

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  // ---- State ----------------------------------------------------------------
  // All of this is persisted to localStorage so a buyer's cart, wishlist,
  // orders and preferences survive page reloads.
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<MarketplaceItem[]>([]);
  const [compare, setCompare] = useState<MarketplaceItem[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<MarketplaceItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [prefs, setPrefsState] = useState<MarketplacePrefs>(DEFAULT_PREFS);
  const hydratedRef = useRef(false);
  const toastTimers = useRef<number[]>([]);

  // ---- Hydration ------------------------------------------------------------
  // Load saved data on mount (inside requestAnimationFrame so it never runs
  // during the server render) and write each slice back to localStorage.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setCart(readStorage<CartLine[]>(CART_KEY, []));
      setWishlist(readStorage<MarketplaceItem[]>(WISHLIST_KEY, []));
      setCompare(readStorage<MarketplaceItem[]>(COMPARE_KEY, []));
      setRecentlyViewed(readStorage<MarketplaceItem[]>(RECENT_KEY, []));
      setOrders(readStorage<Order[]>(ORDERS_KEY, []));
      setPrefsState({ ...DEFAULT_PREFS, ...readStorage<Partial<MarketplacePrefs>>(PREFS_KEY, {}) });
      hydratedRef.current = true;
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(COMPARE_KEY, JSON.stringify(compare));
  }, [compare]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // ---- Notifications --------------------------------------------------------
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = window.setTimeout(() => dismissToast(id), 3600);
    toastTimers.current.push(timer);
  }, [dismissToast]);

  // ---- Cart actions ---------------------------------------------------------
  const addToCart = useCallback((item: MarketplaceItem, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [...prev, { item, quantity }];
    });
    notify(`${item.title} added to cart`);
  }, [notify]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.item.id !== itemId)
        : prev.map((l) => (l.item.id === itemId ? { ...l, quantity } : l))
    );
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((l) => l.item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const isInCart = useCallback((itemId: string) => cart.some((l) => l.item.id === itemId), [cart]);

  // ---- Wishlist / compare / recently viewed ---------------------------------
  const toggleWishlist = useCallback((item: MarketplaceItem) => {
    setWishlist((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= 100) return prev;
      return [item, ...prev];
    });
  }, []);

  const isWishlisted = useCallback((itemId: string) => wishlist.some((i) => i.id === itemId), [wishlist]);

  const toggleCompare = useCallback((item: MarketplaceItem) => {
    setCompare((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= 4) return prev;
      return [...prev, item];
    });
  }, []);

  const isCompared = useCallback((itemId: string) => compare.some((i) => i.id === itemId), [compare]);

  const clearCompare = useCallback(() => setCompare([]), []);

  const addRecentlyViewed = useCallback((item: MarketplaceItem) => {
    setRecentlyViewed((prev) => {
      const rest = prev.filter((i) => i.id !== item.id);
      return [item, ...rest].slice(0, 12);
    });
  }, []);

  const setPrefs = useCallback((next: Partial<MarketplacePrefs>) => {
    setPrefsState((prev) => ({ ...prev, ...next }));
  }, []);

  // ---- Cart totals ------------------------------------------------------------
  const cartSubtotal = cart.reduce((sum, l) => sum + (l.item.price || 0) * l.quantity, 0);
  const cartCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  // Volume/quantity discounts are not applied yet.
  const cartDiscount = 0;

  // ---- Order placement ------------------------------------------------------
  const placeOrder = useCallback(async (input: PlaceOrderInput): Promise<Order | null> => {
    if (cart.length === 0) return null;
    const subtotal = cart.reduce((sum, l) => sum + (l.item.price || 0) * l.quantity, 0);
    const shipping = calcShipping(subtotal, input.delivery);
    const discount = 0;
    const { tax, total } = calcTotals(subtotal, discount, shipping);

    const order: Order = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      lines: cart.map((l) => ({
        itemId: l.item.id,
        title: l.item.title,
        price: l.item.price,
        quantity: l.quantity,
        image: Array.isArray(l.item.images) && typeof l.item.images[0] === "string" ? l.item.images[0] : null,
        status: "Processing",
      })),
      subtotal,
      shipping,
      tax,
      discount,
      total,
      currency: prefs.currency,
      status: "Processing",
      paymentMethod: input.payment,
      address: input.address,
      delivery: input.delivery,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracking: [
        { label: "Order Placed", date: new Date().toISOString(), note: "Payment confirmed" },
        { label: "Processing", date: new Date().toISOString(), note: "Seller preparing your order" },
        { label: "Shipped", date: "", note: "Awaiting shipment" },
        { label: "Delivered", date: "", note: "Awaiting delivery" },
      ],
    };

    setOrders((prev) => [order, ...prev]);
    setCart([]);

    order.lines.forEach((line) => {
      api.purchaseItem(line.itemId).catch(() => {});
    });

    return order;
  }, [cart, prefs.currency]);

  const value: MarketplaceContextValue = {
    cart,
    wishlist,
    compare,
    recentlyViewed,
    orders,
    toasts,
    prefs,
    setPrefs,
    cartCount,
    cartSubtotal,
    cartDiscount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isInCart,
    toggleWishlist,
    isWishlisted,
    toggleCompare,
    isCompared,
    clearCompare,
    addRecentlyViewed,
    placeOrder,
    notify,
    dismissToast,
  };

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </MarketplaceContext.Provider>
  );
}

// ---- Toast UI ---------------------------------------------------------------
// Rendered by the provider so any page inside the marketplace can show
// a notification via the `notify()` helper from useMarketplace().

function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-[70] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-80">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`text-left px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border text-sm transition-all ${
            t.type === "success"
              ? "bg-green-600/90 text-white border-green-500"
              : t.type === "error"
              ? "bg-red-600/90 text-white border-red-500"
              : "bg-surface/90 text-foreground border-border"
          }`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}

export function useMarketplace(): MarketplaceContextValue {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used within MarketplaceProvider");
  return ctx;
}
