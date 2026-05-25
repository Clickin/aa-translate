import type { ProviderModelInfo, TranslationProfile, TranslationProfileInput } from '../types';

const jsonHeaders = { 'content-type': 'application/json' };

export const fetchProfiles = async (): Promise<TranslationProfile[]> => {
  const response = await fetch('/api/profiles');
  if (!response.ok) {
    throw new Error('프로필 목록을 불러오지 못했습니다.');
  }
  const payload = await response.json() as { profiles: TranslationProfile[] };
  return payload.profiles;
};

export const saveProfile = async (profile: TranslationProfileInput & { id?: string }): Promise<TranslationProfile> => {
  const response = await fetch(profile.id ? `/api/profiles/${profile.id}` : '/api/profiles', {
    method: profile.id ? 'PUT' : 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '프로필 저장에 실패했습니다.');
  }
  const payload = await response.json() as { profile: TranslationProfile };
  return payload.profile;
};

export const deleteProfile = async (id: string): Promise<void> => {
  const response = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '프로필 삭제에 실패했습니다.');
  }
};

export const testProfile = async (id: string): Promise<void> => {
  const response = await fetch(`/api/profiles/${id}/test`, { method: 'POST' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '프로필 테스트에 실패했습니다.');
  }
};

export const fetchProfileModels = async (id: string): Promise<ProviderModelInfo[]> => {
  const response = await fetch(`/api/profiles/${id}/models`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '모델 목록을 불러오지 못했습니다.');
  }
  const payload = await response.json() as { models: ProviderModelInfo[] };
  return payload.models;
};
