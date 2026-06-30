import type { UserProfile } from '@/types/domain';
import usePersistentState from '@/hooks/use-persistent-state';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { generateAvatarUrl } from '@/lib/utils';

export function useProfileState() {
  const [userProfile, setUserProfile, isProfileLoaded] = usePersistentState<UserProfile | null>(
    STORAGE_KEYS.userProfile,
    null
  );

  return {
    userProfile,
    setUserProfile,
    isProfileLoaded
  };
}
