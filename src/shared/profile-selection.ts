import type { TranslationProfile } from '../../types';

export const selectProfileId = (
  profiles: TranslationProfile[],
  currentId?: string,
  preferredId?: string,
): string | undefined => {
  if (preferredId && profiles.some((profile) => profile.id === preferredId)) {
    return preferredId;
  }
  if (currentId && profiles.some((profile) => profile.id === currentId)) {
    return currentId;
  }
  return profiles.find((profile) => profile.isDefault)?.id ?? profiles[0]?.id;
};
