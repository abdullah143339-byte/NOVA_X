import { ProfileProvider } from "@/components/profile/ProfileProvider";
import FollowersPageView from "@/components/profile/FollowersPageView";
import ProfileToasts from "@/components/profile/ProfileToasts";

export default function FollowingPage() {
  return (
    <ProfileProvider>
      <FollowersPageView mode="following" />
      <ProfileToasts />
    </ProfileProvider>
  );
}
