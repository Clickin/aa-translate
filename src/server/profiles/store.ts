import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { TranslationProfileInput } from '../../../types.js';
import { DEFAULT_GEMINI_MODEL } from '../../shared/gemini-models.js';
import type { PublicTranslationProfile, StoredTranslationProfile } from '../providers/types.js';

const defaultProfile: StoredTranslationProfile = {
  id: 'default-gemini',
  name: 'Gemini Flash',
  provider: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: DEFAULT_GEMINI_MODEL,
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
  isDefault: true,
};

const normalizeMaxContextTokens = (value?: number): number | undefined => {
  if (!Number.isFinite(value) || value === undefined) {
    return undefined;
  }
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : undefined;
};

export class ProfileStore {
  constructor(private readonly filePath: string) {}

  static fromEnv(): ProfileStore {
    const dataDir = process.env.AA_TRANSLATOR_DATA_DIR || join(process.cwd(), 'data');
    return new ProfileStore(join(dataDir, 'profiles.json'));
  }

  async list(): Promise<PublicTranslationProfile[]> {
    return (await this.read()).map(publicProfile);
  }

  async get(id?: string): Promise<StoredTranslationProfile> {
    const profiles = await this.read();
    const profile = id ? profiles.find((item) => item.id === id) : profiles.find((item) => item.isDefault);
    if (!profile) {
      throw new Error(id ? `Profile not found: ${id}` : 'Default profile not found.');
    }
    return profile;
  }

  async save(input: TranslationProfileInput): Promise<PublicTranslationProfile> {
    const profiles = await this.read();
    const profile: StoredTranslationProfile = {
      id: globalThis.crypto.randomUUID(),
      name: input.name.trim(),
      provider: input.provider,
      baseUrl: input.baseUrl.trim(),
      model: input.model.trim(),
      maxContextTokens: normalizeMaxContextTokens(input.maxContextTokens),
      apiKey: input.apiKey?.trim() || undefined,
      isDefault: input.isDefault ?? profiles.length === 0,
    };

    const next = profile.isDefault ? profiles.map((item) => ({ ...item, isDefault: false })) : profiles;
    next.push(profile);
    await this.write(next);
    return publicProfile(profile);
  }

  async update(id: string, input: TranslationProfileInput): Promise<PublicTranslationProfile> {
    const profiles = await this.read();
    const existing = profiles.find((item) => item.id === id);
    if (!existing) {
      throw new Error(`Profile not found: ${id}`);
    }

    const updated: StoredTranslationProfile = {
      ...existing,
      name: input.name.trim(),
      provider: input.provider,
      baseUrl: input.baseUrl.trim(),
      model: input.model.trim(),
      maxContextTokens: normalizeMaxContextTokens(input.maxContextTokens),
      apiKey: input.apiKey?.trim() || existing.apiKey,
      isDefault: input.isDefault ?? existing.isDefault,
    };

    const next = profiles.map((item) => {
      if (item.id === id) {
        return updated;
      }
      return updated.isDefault ? { ...item, isDefault: false } : item;
    });
    await this.write(next);
    return publicProfile(updated);
  }

  async delete(id: string): Promise<void> {
    const profiles = await this.read();
    const next = profiles.filter((item) => item.id !== id);
    if (next.length === profiles.length) {
      throw new Error(`Profile not found: ${id}`);
    }
    if (next.length > 0 && !next.some((item) => item.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    await this.write(next);
  }

  private async read(): Promise<StoredTranslationProfile[]> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as StoredTranslationProfile[];
      return parsed.length > 0 ? parsed.map(normalizeProfile) : [defaultProfile];
    } catch {
      return [defaultProfile];
    }
  }

  private async write(profiles: StoredTranslationProfile[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(profiles, null, 2), 'utf8');
  }
}

const publicProfile = (profile: StoredTranslationProfile): PublicTranslationProfile => ({
  id: profile.id,
  name: profile.name,
  provider: profile.provider,
  baseUrl: profile.baseUrl,
  model: profile.model.trim(),
  maxContextTokens: profile.maxContextTokens,
  hasApiKey: Boolean(profile.apiKey),
  isDefault: profile.isDefault,
});

const normalizeProfile = (profile: StoredTranslationProfile): StoredTranslationProfile => ({
  ...profile,
  model: profile.model.trim(),
});
