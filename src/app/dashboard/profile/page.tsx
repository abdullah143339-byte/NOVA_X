import { ProfileProvider } from "@/components/profile/ProfileProvider";
import ProfilePage from "@/components/profile/ProfilePage";
import ProfileToasts from "@/components/profile/ProfileToasts";

export default function Page() {
  return (
    <ProfileProvider>
      <ProfilePage />
      <ProfileToasts />
    </ProfileProvider>
  );
}
