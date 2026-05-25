export interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

export interface TranslationHistoryItem {
  original: string;
  translated: string;
  timestamp: number;
}

export enum AppState {
  IDLE,
  FILE_LOADED,
  PROCESSING,
}

export interface TextSegment {
  id: string;
  text: string;
  original: string;
  isJapanese: boolean;
  isStrictJapanese?: boolean;
  isAutoSelected?: boolean;
  isBoxedDialogue?: boolean;
  isContextDialogue?: boolean;
  isArrowBox?: boolean;
  isVerticalBox?: boolean;
  isIndentedDialogue?: boolean;
  isIsolatedDialogue?: boolean;
  isSelected: boolean;
  isTranslated: boolean;
}

export type ViewMode = "raw" | "smart" | "viewer";

export interface ApiUsageStats {
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface DictionaryEntry {
  id: string;
  original: string;
  translated: string;
}

export type TranslationProvider = "gemini" | "openai-compatible" | "browser-llm";

export interface TranslationProfile {
  id: string;
  name: string;
  provider: TranslationProvider;
  baseUrl: string;
  model: string;
  maxContextTokens?: number;
  hasApiKey: boolean;
  isDefault: boolean;
}

export interface TranslationProfileInput {
  name: string;
  provider: TranslationProvider;
  baseUrl: string;
  model: string;
  maxContextTokens?: number;
  apiKey?: string;
  isDefault?: boolean;
}

export interface ProviderModelInfo {
  id: string;
  name: string;
  description?: string;
}

export interface TranslationUsage {
  inputTokens: number;
  outputTokens: number;
  requestCount?: number;
  cost: number;
}

export interface TranslateRequest {
  profileId?: string;
  text: string;
  customDictionary?: DictionaryEntry[];
  useDefaultDictionary?: boolean;
  systemInstruction?: string;
}

export interface TranslateBatchRequest {
  profileId?: string;
  texts: string[];
  customDictionary?: DictionaryEntry[];
  useDefaultDictionary?: boolean;
  systemInstruction?: string;
}

export type TranslationJobMode = "single" | "batch";
export type TranslationJobStatus = "queued" | "running" | "completed" | "failed";

export interface TranslationJobRequest
  extends Partial<TranslateRequest>, Partial<TranslateBatchRequest> {
  mode: TranslationJobMode;
}

export interface TranslationJobResponse {
  id: string;
  status: TranslationJobStatus;
}

export interface TranslationJobResult {
  id: string;
  status: TranslationJobStatus;
  result?:
    | { text: string; usage: TranslationUsage }
    | { translations: string[]; usage: TranslationUsage };
  error?: string;
}
