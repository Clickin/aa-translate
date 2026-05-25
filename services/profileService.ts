import type { ProviderModelInfo, TranslationProfile, TranslationProfileInput } from '../types';
import {
  listBrowserProfileModels,
  testBrowserProfile,
  type BrowserStoredProfile,
} from './browserProviderService';
import { DEFAULT_GEMINI_MODEL } from '../src/shared/gemini-models';
import { isBrowserDeployTarget } from '../src/shared/runtime';

const jsonHeaders = { 'content-type': 'application/json' };
const browserProfilesStorageKey = 'aa-translator.browser-profiles.v1';
let useBrowserProfileFallback = false;

const defaultBrowserProfile: BrowserStoredProfile = {
  id: 'browser-gemini',
  name: 'Gemini BYOK',
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: DEFAULT_GEMINI_MODEL,
  isDefault: true,
};

const normalizeMaxContextTokens = (value?: number): number | undefined => {
  if (!Number.isFinite(value) || value === undefined) {
    return undefined;
  }
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : undefined;
};

const publicBrowserProfile = (profile: BrowserStoredProfile): TranslationProfile => ({
  id: profile.id,
  name: profile.name,
  provider: profile.provider,
  baseUrl: profile.baseUrl,
  model: profile.model.trim(),
  maxContextTokens: profile.maxContextTokens,
  hasApiKey: Boolean(profile.apiKey),
  isDefault: profile.isDefault,
});

const normalizeBrowserProfile = (profile: BrowserStoredProfile): BrowserStoredProfile => ({
  ...profile,
  model: profile.model.trim(),
});

const readBrowserProfiles = (): BrowserStoredProfile[] => {
  const raw = globalThis.localStorage?.getItem(browserProfilesStorageKey);
  if (!raw) {
    return [defaultBrowserProfile];
  }

  try {
    const parsed = JSON.parse(raw) as BrowserStoredProfile[];
    return parsed.length > 0 ? parsed.map(normalizeBrowserProfile) : [defaultBrowserProfile];
  } catch {
    return [defaultBrowserProfile];
  }
};

const writeBrowserProfiles = (profiles: BrowserStoredProfile[]): void => {
  const storage = globalThis.localStorage;
  if (!storage) {
    throw new Error('이 브라우저에서 profile 저장소를 사용할 수 없습니다.');
  }

  const serialized = JSON.stringify(profiles);
  storage.setItem(browserProfilesStorageKey, serialized);
  if (storage.getItem(browserProfilesStorageKey) !== serialized) {
    throw new Error('브라우저 localStorage에 profile을 저장하지 못했습니다.');
  }
};

const shouldUseBrowserProfiles = (): boolean => {
  return isBrowserDeployTarget() || useBrowserProfileFallback;
};

const activateBrowserProfileFallback = () => {
  useBrowserProfileFallback = true;
};

export const __resetProfileServiceForTests = () => {
  useBrowserProfileFallback = false;
};

const isMissingBackendResponse = (response: Response): boolean => {
  return response.status === 404 || response.status === 405;
};

export const getBrowserStoredProfile = (id?: string): BrowserStoredProfile => {
  const profiles = readBrowserProfiles();
  const profile = id ? profiles.find((item) => item.id === id) : profiles.find((item) => item.isDefault);
  if (!profile) {
    throw new Error(id ? `Profile not found: ${id}` : 'Default profile not found.');
  }
  return profile;
};

export const fetchProfiles = async (): Promise<TranslationProfile[]> => {
  if (shouldUseBrowserProfiles()) {
    return readBrowserProfiles().map(publicBrowserProfile);
  }

  try {
    const response = await fetch('/api/profiles');
    if (!response.ok) {
      if (isMissingBackendResponse(response)) {
        activateBrowserProfileFallback();
        return readBrowserProfiles().map(publicBrowserProfile);
      }
      throw new Error('프로필 목록을 불러오지 못했습니다.');
    }
    const payload = await response.json() as { profiles: TranslationProfile[] };
    return payload.profiles;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      activateBrowserProfileFallback();
      return readBrowserProfiles().map(publicBrowserProfile);
    }
    throw error;
  }
};

export const saveProfile = async (profile: TranslationProfileInput & { id?: string }): Promise<TranslationProfile> => {
  if (shouldUseBrowserProfiles()) {
    const profiles = readBrowserProfiles();
    const existing = profile.id ? profiles.find((item) => item.id === profile.id) : undefined;
    const saved: BrowserStoredProfile = {
      id: existing?.id ?? globalThis.crypto.randomUUID(),
      name: profile.name.trim(),
      provider: profile.provider,
      baseUrl: profile.baseUrl.trim(),
      model: profile.model.trim(),
      maxContextTokens: normalizeMaxContextTokens(profile.maxContextTokens),
      apiKey: profile.apiKey?.trim() || existing?.apiKey,
      isDefault: profile.isDefault ?? existing?.isDefault ?? profiles.length === 0,
    };
    const nextProfiles = existing
      ? profiles.map((item) => item.id === saved.id ? saved : saved.isDefault ? { ...item, isDefault: false } : item)
      : [...(saved.isDefault ? profiles.map((item) => ({ ...item, isDefault: false })) : profiles), saved];
    writeBrowserProfiles(nextProfiles);
    return publicBrowserProfile(saved);
  }

  try {
    const response = await fetch(profile.id ? `/api/profiles/${profile.id}` : '/api/profiles', {
      method: profile.id ? 'PUT' : 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      if (isMissingBackendResponse(response)) {
        activateBrowserProfileFallback();
        return saveProfile(profile);
      }
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || '프로필 저장에 실패했습니다.');
    }
    const payload = await response.json() as { profile: TranslationProfile };
    return payload.profile;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      activateBrowserProfileFallback();
      return saveProfile(profile);
    }
    throw error;
  }
};

export const deleteProfile = async (id: string): Promise<void> => {
  if (shouldUseBrowserProfiles()) {
    const profiles = readBrowserProfiles();
    const next = profiles.filter((item) => item.id !== id);
    if (next.length === profiles.length) {
      throw new Error(`Profile not found: ${id}`);
    }
    if (next.length > 0 && !next.some((item) => item.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    writeBrowserProfiles(next);
    return;
  }

  const response = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '프로필 삭제에 실패했습니다.');
  }
};

export const testProfile = async (id: string): Promise<void> => {
  if (shouldUseBrowserProfiles()) {
    await testBrowserProfile(getBrowserStoredProfile(id));
    return;
  }

  const response = await fetch(`/api/profiles/${id}/test`, { method: 'POST' });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '프로필 테스트에 실패했습니다.');
  }
};

export const fetchProfileModels = async (id: string): Promise<ProviderModelInfo[]> => {
  if (shouldUseBrowserProfiles()) {
    return listBrowserProfileModels(getBrowserStoredProfile(id));
  }

  const response = await fetch(`/api/profiles/${id}/models`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '모델 목록을 불러오지 못했습니다.');
  }
  const payload = await response.json() as { models: ProviderModelInfo[] };
  return payload.models;
};
