import type { DeliveryOption } from "./types";

// Shared pricing rules used by the cart, checkout and order placement.
// Keeping this math in one place means the numbers shown to the buyer
// always match what the order actually records.

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_THRESHOLD = 50;
export const DELIVERY_COSTS: Record<DeliveryOption, number> = {
  standard: 5,
  express: 12,
  pickup: 0,
};

/** Round to the nearest cent (avoids floating point drift). */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Shipping cost for a delivery option (free above the threshold). */
export function calcShipping(subtotal: number, delivery: DeliveryOption): number {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return DELIVERY_COSTS[delivery] ?? DELIVERY_COSTS.standard;
}

/** Tax and grand total for an order. */
export function calcTotals(subtotal: number, discount: number, shipping: number) {
  const tax = roundMoney((subtotal - discount) * TAX_RATE);
  const total = roundMoney(subtotal - discount + shipping + tax);
  return { tax, total };
}
