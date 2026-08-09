"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Store, BadgeCheck, Package, ShoppingBag, Star, Settings } from "lucide-react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import { useMarketplace } from "@/components/marketplace/MarketplaceProvider";
import { extractItems } from "@/components/marketplace/itemUtils";
import { computeSellerStats } from "@/components/marketplace/seller/stats";
import SellerStats from "@/components/marketplace/seller/SellerStats";
import SellerInventory from "@/components/marketplace/seller/SellerInventory";
import SellerAddProductForm, { EMPTY_FORM, type SellForm } from "@/components/marketplace/seller/SellerAddProductForm";
import SellerOrders from "@/components/marketplace/seller/SellerOrders";
import SellerReviews from "@/components/marketplace/seller/SellerReviews";
import SellerSettings from "@/components/marketplace/seller/SellerSettings";
import { cn } from "@/lib/utils";
import type { MarketplaceItem } from "@/components/marketplace/types";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Store },
  { id: "products", label: "Inventory", icon: Package },
  { id: "add", label: "Add Product", icon: Plus },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "settings", label: "Settings", icon: Settings },
];

type TabId = (typeof TABS)[number]["id"];

export default function SellerCenterPage() {
  const { user } = useAuth();
  const { orders, notify } = useMarketplace();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [listings, setListings] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SellForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ---- Data -----------------------------------------------------------------
  const loadListings = useCallback(() => {
    if (!user?.id) return Promise.resolve();
    return api
      .getMarketplaceItems(1, undefined, undefined, user.id)
      .then((res) => setListings(extractItems(res.data)))
      .catch(() => setListings([]));
  }, [user]);

  useEffect(() => {
    loadListings().finally(() => setLoading(false));
  }, [loadListings]);

  const stats = computeSellerStats(listings);

  // ---- Add-product form -----------------------------------------------------
  const formField =
    (key: keyof SellForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit =
    form.title.trim().length > 2 &&
    form.description.trim().length > 5 &&
    form.contact.trim().length >= 7 &&
    Number(form.price) > 0;

  // Read an uploaded image/video into a data URL so it can be previewed
  // and stored without a separate file server.
  const addMedia = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const isVideo = file.type.startsWith("video/");
      setForm((f) => ({
        ...f,
        images: isVideo ? f.images : [...f.images, reader.result as string],
        videos: isVideo ? [...f.videos, reader.result as string] : f.videos,
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (index: number) => {
    setForm((f) => {
      if (index < f.images.length) {
        return { ...f, images: f.images.filter((_, i) => i !== index) };
      }
      const videoIndex = index - f.images.length;
      return { ...f, videos: f.videos.filter((_, i) => i !== videoIndex) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        price: Number(form.price),
        contact: form.contact.trim(),
        category: form.category,
        type: form.type,
        status: "ACTIVE",
      };
      if (form.images.length > 0) payload.images = form.images;
      if (form.videos.length > 0) payload.files = form.videos;
      if (form.stock.trim() && Number(form.stock) >= 0) payload.stock = Number(form.stock);
      await api.createMarketplaceItem(payload);
      notify("Product published successfully");
      setForm(EMPTY_FORM);
      await loadListings();
      setTab("products");
    } catch {
      notify("Failed to publish product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <SellerHeader user={user} rating={stats.storeRating} onAddNew={() => setTab("add")} />

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "dashboard" && <SellerStats stats={stats} listings={listings} />}
      {tab === "products" && <SellerInventory listings={listings} loading={loading} onAddFirst={() => setTab("add")} />}
      {tab === "add" && (
        <SellerAddProductForm
          form={form}
          submitting={submitting}
          canSubmit={canSubmit}
          onChange={formField}
          onPublish={handleSubmit}
          onClear={() => setForm(EMPTY_FORM)}
          onAddMedia={addMedia}
          onRemoveMedia={removeMedia}
        />
      )}
      {tab === "orders" && <SellerOrders orders={orders} />}
      {tab === "reviews" && <SellerReviews />}
      {tab === "settings" && <SellerSettings user={user} onSave={() => notify("Settings saved")} />}
    </div>
  );
}

// ---- Small layout pieces ----------------------------------------------------
// Kept local because they are shared by every tab of the seller center.

function SellerHeader({
  user,
  rating,
  onAddNew,
}: {
  user: { firstName?: string; lastName?: string; username?: string } | null;
  rating: number;
  onAddNew: () => void;
}) {
  const [contact, setContact] = useState("");
  useEffect(() => {
    try {
      setContact(window.localStorage.getItem("nova_store_contact") ?? "");
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            Seller Center <BadgeCheck className="w-4 h-4 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">
            {user?.firstName ?? user?.username} · @{user?.username} · ⭐ {rating.toFixed(1)} store rating
            {contact && <> · 📞 {contact}</>}
          </p>
        </div>
      </div>
      <Button onClick={onAddNew}>
        <Plus className="w-4 h-4" /> List New Product
      </Button>
    </div>
  );
}

function TabBar<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string; icon: React.ComponentType<{ className?: string }> }[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-6">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              active === t.id ? "bg-primary text-white" : "glass text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        );
      })}
    </div>
  );
}
