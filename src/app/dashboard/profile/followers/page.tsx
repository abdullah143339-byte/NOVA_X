import { ProfileProvider } from "@/components/profile/ProfileProvider";
import FollowersPageView from "@/components/profile/FollowersPageView";
import ProfileToasts from "@/components/profile/ProfileToasts";

export default function FollowersPage() {
  return (
    <ProfileProvider>
      <FollowersPageView mode="followers" />
      <ProfileToasts />
    </ProfileProvider>
  );
}
