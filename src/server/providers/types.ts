import type { DictionaryEntry, ProviderModelInfo, TranslationProfile, TranslationUsage } from '../../../types.js';

export interface ProviderTranslateOptions {
  profile: StoredTranslationProfile;
  text: string;
  customDictionary: DictionaryEntry[];
  useDefaultDictionary: boolean;
  systemInstruction: string;
}

export interface ProviderBatchTranslateOptions {
  profile: StoredTranslationProfile;
  texts: string[];
  customDictionary: DictionaryEntry[];
  useDefaultDictionary: boolean;
  systemInstruction: string;
}

export interface ProviderTranslationResult {
  text: string;
  usage: TranslationUsage;
}

export interface ProviderBatchTranslationResult {
  translations: string[];
  usage: TranslationUsage;
}

export interface StoredTranslationProfile extends Omit<TranslationProfile, 'hasApiKey'> {
  apiKey?: string;
}

export type PublicTranslationProfile = TranslationProfile;

export interface ProviderListModelsOptions {
  profile: StoredTranslationProfile;
}

export type ProviderModelList = ProviderModelInfo[];
