import type { ProviderModelInfo, TranslationProfile, TranslationProfileInput } from '../types';
import {
  listBrowserProfileModels,
  testBrowserProfile,
  type BrowserStoredProfile,
} from './browserProviderService';
import { DEFAULT_BROWSER_LLM_MODEL } from '../src/shared/browser-llm-models';
import { isBrowserDeployTarget } from '../src/shared/runtime';

const jsonHeaders = { 'content-type': 'application/json' };
const browserProfilesStorageKey = 'aa-translator.browser-profiles.v1';

const defaultBrowserProfile: BrowserStoredProfile = {
  id: 'browser-gemini',
  name: 'Gemini BYOK',
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: 'gemini-3-flash-preview',
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
  model: profile.model,
  maxContextTokens: profile.maxContextTokens,
  hasApiKey: Boolean(profile.apiKey),
  isDefault: profile.isDefault,
});

const readBrowserProfiles = (): BrowserStoredProfile[] => {
  const raw = globalThis.localStorage?.getItem(browserProfilesStorageKey);
  if (!raw) {
    return [defaultBrowserProfile];
  }

  try {
    const parsed = JSON.parse(raw) as BrowserStoredProfile[];
    return parsed.length > 0 ? parsed : [defaultBrowserProfile];
  } catch {
    return [defaultBrowserProfile];
  }
};

const writeBrowserProfiles = (profiles: BrowserStoredProfile[]): void => {
  globalThis.localStorage?.setItem(browserProfilesStorageKey, JSON.stringify(profiles));
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
  if (isBrowserDeployTarget()) {
    return readBrowserProfiles().map(publicBrowserProfile);
  }

  const response = await fetch('/api/profiles');
  if (!response.ok) {
    throw new Error('프로필 목록을 불러오지 못했습니다.');
  }
  const payload = await response.json() as { profiles: TranslationProfile[] };
  return payload.profiles;
};

export const saveProfile = async (profile: TranslationProfileInput & { id?: string }): Promise<TranslationProfile> => {
  if (isBrowserDeployTarget()) {
    const profiles = readBrowserProfiles();
    const existing = profile.id ? profiles.find((item) => item.id === profile.id) : undefined;
    const saved: BrowserStoredProfile = {
      id: existing?.id ?? globalThis.crypto.randomUUID(),
      name: profile.name.trim(),
      provider: profile.provider,
      baseUrl: profile.baseUrl.trim() || (profile.provider === 'browser-llm' ? DEFAULT_BROWSER_LLM_MODEL.url : ''),
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
  if (isBrowserDeployTarget()) {
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
  if (isBrowserDeployTarget()) {
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
  if (isBrowserDeployTarget()) {
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
