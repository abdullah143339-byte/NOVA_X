import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { SellerUser } from "./stats";

interface SellerSettingsProps {
  user: SellerUser | null;
  onSave: () => void;
}

const CONTACT_KEY = "nova_store_contact";
const INPUT_CLASS =
  "w-full h-10 rounded-xl bg-muted border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
const TEXTAREA_CLASS =
  "w-full rounded-xl bg-muted border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none";

/** Settings tab: store profile fields (name, bio, contact number). */
export default function SellerSettings({ user, onSave }: SellerSettingsProps) {
  const [contact, setContact] = useState("");

  useEffect(() => {
    try {
      setContact(window.localStorage.getItem(CONTACT_KEY) ?? "");
    } catch {
      // localStorage unavailable — start with an empty contact
    }
  }, []);

  const save = () => {
    try {
      window.localStorage.setItem(CONTACT_KEY, contact);
    } catch {
      // localStorage unavailable — contact won't persist
    }
    onSave();
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-base font-bold text-foreground mb-4">Store Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Store Name</label>
          <input
            defaultValue={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.username || ""}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Store Bio</label>
          <textarea rows={3} placeholder="Tell buyers about your store..." className={TEXTAREA_CLASS} />
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
        <Button onClick={save}>Save Settings</Button>
      </div>
    </div>
  );
}
