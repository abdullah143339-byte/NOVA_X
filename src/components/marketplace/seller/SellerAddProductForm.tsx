import { useRef } from "react";
import { Upload, X, Sparkles, Loader2, Film, Image as ImageIcon } from "lucide-react";
import Button from "@/components/ui/Button";
import { MEGA_CATEGORIES } from "../catalog";

export interface SellForm {
  title: string;
  description: string;
  shortDescription: string;
  price: string;
  contact: string;
  category: string;
  type: string;
  sku: string;
  stock: string;
  images: string[];
  videos: string[];
}

export const EMPTY_FORM: SellForm = {
  title: "",
  description: "",
  shortDescription: "",
  price: "",
  contact: "",
  category: "Digital Products",
  type: "TEMPLATE",
  sku: "",
  stock: "-1",
  images: [],
  videos: [],
};

const TYPE_OPTIONS = [
  "TEMPLATE",
  "COMPONENT",
  "PLUGIN",
  "COURSE",
  "EBOOK",
  "CODE_SNIPPET",
  "AI_MODEL",
  "SERVICE",
  "HARDWARE",
  "DIGITAL_ART",
];

interface SellerAddProductFormProps {
  form: SellForm;
  submitting: boolean;
  canSubmit: boolean;
  onChange: (key: keyof SellForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onPublish: (e: React.FormEvent) => void;
  onClear: () => void;
  onAddMedia: (file: File) => void;
  onRemoveMedia: (index: number) => void;
}

const INPUT_CLASS =
  "w-full h-10 rounded-xl bg-muted border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
const TEXTAREA_CLASS =
  "w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none";

/** Add Product tab: form to publish a new listing (with photo/video upload). */
export default function SellerAddProductForm({
  form,
  submitting,
  canSubmit,
  onChange,
  onPublish,
  onClear,
  onAddMedia,
  onRemoveMedia,
}: SellerAddProductFormProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl">
      <form onSubmit={onPublish} className="glass rounded-2xl p-5 sm:p-6 space-y-4">
        <Field label="Product Title *">
          <input value={form.title} onChange={onChange("title")} placeholder="e.g., AI SaaS Starter Template" className={INPUT_CLASS} />
        </Field>

        <Field label="Short Description">
          <input value={form.shortDescription} onChange={onChange("shortDescription")} placeholder="One-line summary shown in listings" className={INPUT_CLASS} />
        </Field>

        <Field label="Full Description *">
          <textarea value={form.description} onChange={onChange("description")} rows={4} placeholder="Describe your product in detail..." className={TEXTAREA_CLASS} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (PKR) *">
            <input type="number" value={form.price} onChange={onChange("price")} placeholder="4999" min="0" step="1" className={INPUT_CLASS} />
          </Field>
          <Field label="Contact Number *">
            <input type="tel" value={form.contact} onChange={onChange("contact")} placeholder="0300 1234567" className={INPUT_CLASS} />
          </Field>
          <Field label="Stock (leave -1 for unlimited)">
            <input type="number" value={form.stock} onChange={onChange("stock")} className={INPUT_CLASS} />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={onChange("category")} className={INPUT_CLASS}>
              {MEGA_CATEGORIES.map((c) => (
                <option key={c.id} value={c.label}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={onChange("type")} className={INPUT_CLASS}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Field>
          <Field label="SKU">
            <input value={form.sku} onChange={onChange("sku")} placeholder="Optional SKU code" className={INPUT_CLASS} />
          </Field>
        </div>

        <Field label="Photos & Videos">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => imageInputRef.current?.click()}>
              <ImageIcon className="w-3.5 h-3.5" /> Upload Photos
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => videoInputRef.current?.click()}>
              <Film className="w-3.5 h-3.5" /> Upload Video
            </Button>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              Array.from(e.target.files ?? []).forEach(onAddMedia);
              e.target.value = "";
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => {
              Array.from(e.target.files ?? []).forEach(onAddMedia);
              e.target.value = "";
            }}
          />

          {(form.images.length > 0 || form.videos.length > 0) && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
              {form.images.map((src, i) => (
                <div key={`img-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={src} alt={`Product photo ${i + 1}`} className="w-full h-full object-cover" />
                  <RemoveButton onClick={() => onRemoveMedia(i)} />
                </div>
              ))}
              {form.videos.map((src, i) => (
                <div key={`vid-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <video src={src} muted playsInline className="w-full h-full object-cover" />
                  <RemoveButton onClick={() => onRemoveMedia(form.images.length + i)} />
                </div>
              ))}
            </div>
          )}
        </Field>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Publish Product
          </Button>
          <Button type="button" variant="secondary" onClick={onClear}>
            <X className="w-4 h-4" /> Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove media"
      className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-all"
    >
      <X className="w-3 h-3" />
    </button>
  );
}
