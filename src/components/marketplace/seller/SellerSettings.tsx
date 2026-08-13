import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { SellerUser } from "./stats";

interface SellerSettingsProps {
  user: SellerUser | null;
  onSave: () => void;
}

const CONTACT_KEY = "novax_store_contact";
const NAME_KEY = "novax_store_name";
const BIO_KEY = "novax_store_bio";
const INPUT_CLASS =
  "w-full h-10 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
const TEXTAREA_CLASS =
  "w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none";

function read(key: string, fallback: string) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Settings tab: store profile fields (name, bio, contact number). */
export default function SellerSettings({ user, onSave }: SellerSettingsProps) {
  const defaultName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username || "";
  const [contact, setContact] = useState("");
  const [name, setName] = useState(defaultName);
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContact(read(CONTACT_KEY, ""));
    setName(read(NAME_KEY, defaultName));
    setBio(read(BIO_KEY, ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    try {
      window.localStorage.setItem(CONTACT_KEY, contact);
      window.localStorage.setItem(NAME_KEY, name);
      window.localStorage.setItem(BIO_KEY, bio);
    } catch {
      // localStorage unavailable — settings won't persist
    }
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-foreground mb-4">Store Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Store Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Store Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell buyers about your store..."
            className={TEXTAREA_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Contact Number</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g., +92 300 1234567"
            inputMode="tel"
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save}>Save Settings</Button>
          {saved && <span className="text-xs text-green-500">Saved!</span>}
        </div>
      </div>
    </div>
  );
}
