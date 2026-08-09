export interface MarketplaceItem {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  shortDescription?: string | null;
  type: string;
  category: string;
  tags?: string;
  price: number;
  currency: string;
  contact?: string | null;
  isFree?: boolean;
  images?: unknown;
  files?: unknown;
  demoUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  viewCount?: number;
  isFeatured?: boolean;
  status?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartLine {
  item: MarketplaceItem;
  quantity: number;
}

export interface OrderLine {
  itemId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string | null;
  status: string;
}

export type DeliveryOption = "standard" | "express" | "pickup";

export type PaymentMethod =
  | "card"
  | "paypal"
  | "apple_pay"
  | "google_pay"
  | "bank"
  | "cod";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: string;
  paymentMethod: PaymentMethod | "";
  address: ShippingAddress;
  delivery: DeliveryOption;
  couponCode?: string;
  createdAt: string;
  updatedAt?: string;
  tracking?: { label: string; date: string; note: string }[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface MarketplacePrefs {
  currency: string;
  language: string;
  location: string;
}
