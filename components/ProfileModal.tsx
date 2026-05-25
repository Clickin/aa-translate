import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Save, Server, Trash2, X } from 'lucide-react';
import type { ProviderModelInfo, TranslationProfile, TranslationProvider } from '../types';
import { DEFAULT_GEMINI_MODEL } from '../src/shared/gemini-models';
import { isBrowserDeployTarget } from '../src/shared/runtime';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: TranslationProfile[];
  activeProfileId?: string;
  onSelectProfile: (id: string) => void;
  onSaveProfile: (profile: {
    id?: string;
    name: string;
    provider: TranslationProvider;
    baseUrl: string;
    model: string;
    maxContextTokens?: number;
    apiKey?: string;
    isDefault: boolean;
  }) => Promise<TranslationProfile>;
  onDeleteProfile: (id: string) => Promise<void>;
  onTestProfile: (id: string) => Promise<void>;
  onFetchModels: (id: string) => Promise<ProviderModelInfo[]>;
}

const serverEmptyForm = {
  id: undefined as string | undefined,
  name: 'Local LLM',
  provider: 'openai-compatible' as TranslationProvider,
  baseUrl: 'http://127.0.0.1:11434',
  model: 'llama3.1',
  maxContextTokens: 4096,
  apiKey: '',
  isDefault: false,
};

const browserEmptyForm = {
  ...serverEmptyForm,
  name: 'Gemini BYOK',
  provider: 'gemini' as TranslationProvider,
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: DEFAULT_GEMINI_MODEL,
  maxContextTokens: undefined as number | undefined,
};

const defaultsForProvider = (provider: TranslationProvider, isBrowserMode: boolean) => {
  if (provider === 'gemini') {
    return isBrowserMode ? browserEmptyForm : {
      ...serverEmptyForm,
      name: 'Gemini Flash',
      provider,
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: DEFAULT_GEMINI_MODEL,
      maxContextTokens: undefined,
    };
  }
  return serverEmptyForm;
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
  onTestProfile,
  onFetchModels,
}) => {
  const isBrowserMode = isBrowserDeployTarget();
  const emptyForm = isBrowserMode ? browserEmptyForm : serverEmptyForm;
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('');
  const [models, setModels] = useState<ProviderModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const active = profiles.find((profile) => profile.id === activeProfileId) ?? profiles.find((profile) => profile.isDefault);
    if (active) {
      setForm({
        id: active.id,
        name: active.name,
        provider: active.provider,
        baseUrl: active.baseUrl,
        model: active.model,
        maxContextTokens: active.maxContextTokens ?? (active.provider === 'openai-compatible' ? 4096 : undefined),
        apiKey: '',
        isDefault: active.isDefault,
      });
    } else {
      setForm(emptyForm);
    }
    setStatus('');
    setModels([]);
  }, [activeProfileId, isOpen, profiles]);

  if (!isOpen) {
    return null;
  }

  const save = async () => {
    const saved = await onSaveProfile(form);
    setForm({
      id: saved.id,
      name: saved.name,
      provider: saved.provider,
      baseUrl: saved.baseUrl,
      model: saved.model,
      maxContextTokens: saved.maxContextTokens ?? (saved.provider === 'openai-compatible' ? 4096 : undefined),
      apiKey: '',
      isDefault: saved.isDefault,
    });
    setStatus('저장했습니다.');
  };

  const test = async () => {
    if (!form.id) {
      setStatus('먼저 저장해야 테스트할 수 있습니다.');
      return;
    }
    await onTestProfile(form.id);
    setStatus('연결 테스트를 통과했습니다.');
  };

  const loadModels = async () => {
    if (!form.id) {
      setStatus('먼저 프로필을 저장해야 모델 목록을 불러올 수 있습니다.');
      return;
    }

    setIsLoadingModels(true);
    try {
      const discovered = await onFetchModels(form.id);
      setModels(discovered);
      if (discovered.length > 0 && !discovered.some((model) => model.id === form.model)) {
        setForm({ ...form, model: discovered[0].id });
      }
      setStatus(discovered.length > 0 ? `${discovered.length}개 모델을 불러왔습니다.` : '표시할 모델이 없습니다.');
    } catch (error: any) {
      setStatus(error.message || '모델 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="aa-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="aa-modal flex w-full max-w-3xl flex-col rounded-md shadow-2xl">
        <div className="aa-modal-header flex items-center justify-between border-b p-5">
          <h2 className="aa-title flex items-center gap-2 text-lg font-bold">
            <Server className="aa-linkish w-5 h-5" />
            Provider Profiles
          </h2>
          <button onClick={onClose} className="aa-muted hover:text-[var(--aa-text)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[420px]">
          <div className="aa-divider space-y-2 border-r p-3">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  onSelectProfile(profile.id);
                  setForm({
                    id: profile.id,
                    name: profile.name,
                    provider: profile.provider,
                    baseUrl: profile.baseUrl,
                    model: profile.model,
                    maxContextTokens: profile.maxContextTokens ?? (profile.provider === 'openai-compatible' ? 4096 : undefined),
                    apiKey: '',
                    isDefault: profile.isDefault,
                  });
                }}
                className={`w-full rounded border px-3 py-2 text-left text-sm ${
                  profile.id === activeProfileId ? 'aa-button-active' : 'aa-button'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{profile.name}</span>
                  {profile.isDefault && <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--aa-success)]" />}
                </div>
                <div className="aa-subtle mt-1 truncate text-[11px]">{profile.provider} / {profile.model}</div>
              </button>
            ))}
            <button
              onClick={() => setForm(emptyForm)}
              className="aa-button w-full rounded px-3 py-2 text-sm"
            >
              새 프로필
            </button>
          </div>

          <div className="p-5 space-y-4">
            {isBrowserMode && (
              <p className="aa-panel-soft aa-muted rounded px-3 py-2 text-xs">
                Browser BYOK mode: API key는 이 브라우저 localStorage에만 저장됩니다.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="aa-muted space-y-1 text-sm">
                <span>이름</span>
                <input className="aa-input w-full rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="aa-muted space-y-1 text-sm">
                <span>Provider</span>
                <select
                  className="aa-input w-full rounded px-3 py-2"
                  value={form.provider}
                  onChange={(e) => {
                    setForm(defaultsForProvider(e.target.value as TranslationProvider, isBrowserMode));
                    setModels([]);
                  }}
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai-compatible">OpenAI-compatible</option>
                </select>
              </label>
              <label className="aa-muted space-y-1 text-sm md:col-span-2">
                <span>Base URL</span>
                <input className="aa-input w-full rounded px-3 py-2 font-mono text-xs" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} />
              </label>
              <div className="aa-muted space-y-1 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>Model</span>
                  <button
                    type="button"
                    onClick={loadModels}
                    disabled={isLoadingModels}
                    className="aa-linkish inline-flex items-center gap-1 text-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? 'animate-spin' : ''}`} />
                    새로고침
                  </button>
                </div>
                <input
                  list="profile-model-options"
                  className="aa-input w-full rounded px-3 py-2 font-mono text-xs"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
                <datalist id="profile-model-options">
                  {models.map((model) => (
                    <option key={model.id} value={model.id} title={model.description}>
                      {model.name === model.id ? model.id : `${model.name} (${model.id})`}
                    </option>
                  ))}
                </datalist>
              </div>
              <label className="aa-muted space-y-1 text-sm">
                <span>API Key</span>
                <input type="password" className="aa-input w-full rounded px-3 py-2 font-mono text-xs" value={form.apiKey} placeholder="저장된 key 유지" onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
              </label>
              <label className="aa-muted space-y-1 text-sm">
                <span>Context tokens</span>
                <input
                  type="number"
                  min={0}
                  step={512}
                  className="aa-input w-full rounded px-3 py-2 font-mono text-xs"
                  value={form.maxContextTokens ?? ''}
                  placeholder="4096"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxContextTokens: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </label>
            </div>

            <label className="aa-muted inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              기본 프로필로 사용
            </label>

            {status && <p className="aa-status text-sm">{status}</p>}

            <div className="aa-modal-footer flex items-center justify-end gap-2 border-t pt-3">
              {form.id && (
                <button onClick={() => onDeleteProfile(form.id!)} className="aa-button-danger mr-auto flex items-center gap-2 rounded px-3 py-2 text-sm">
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              )}
              <button onClick={test} className="aa-button rounded px-4 py-2 text-sm">테스트</button>
              <button onClick={save} className="aa-button-primary flex items-center gap-2 rounded px-4 py-2 text-sm">
                <Save className="w-4 h-4" />
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
