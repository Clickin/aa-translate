import type { ProviderModelInfo } from '../../types.js';

export interface BrowserLlmModelInfo extends ProviderModelInfo {
  url: string;
  sizeLabel: string;
  mobileRecommended?: boolean;
}

export const BROWSER_LLM_RECOMMENDED_MODELS: BrowserLlmModelInfo[] = [
  {
    id: 'hauhaucs-gemma-4-e2b-q2-k-p',
    name: 'Gemma 4 E2B Uncensored Q2_K_P',
    sizeLabel: 'E2B / Q2',
    mobileRecommended: true,
    url: 'https://huggingface.co/HauhauCS/Gemma-4-E2B-Uncensored-HauhauCS-Aggressive/resolve/main/Gemma-4-E2B-Uncensored-HauhauCS-Aggressive-Q2_K_P.gguf',
    description: 'Smallest baked Gemma 4 E2B GGUF option for mobile-first browser LLM use.',
  },
  {
    id: 'hauhaucs-gemma-4-e2b-iq3-m',
    name: 'Gemma 4 E2B Uncensored IQ3_M',
    sizeLabel: 'E2B / IQ3',
    mobileRecommended: true,
    url: 'https://huggingface.co/HauhauCS/Gemma-4-E2B-Uncensored-HauhauCS-Aggressive/resolve/main/Gemma-4-E2B-Uncensored-HauhauCS-Aggressive-IQ3_M.gguf',
    description: 'Recommended quality/size balance for browser LLM translation on stronger mobile or desktop devices.',
  },
  {
    id: 'trevorjs-gemma-4-e2b-q4-k-m',
    name: 'TrevorJS Gemma 4 E2B Uncensored Q4_K_M',
    sizeLabel: 'E2B / Q4',
    url: 'https://huggingface.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF/resolve/main/gemma-4-E2B-it-uncensored-Q4_K_M.gguf',
    description: 'Larger E2B GGUF option for desktop browser LLM use.',
  },
];

export const DEFAULT_BROWSER_LLM_MODEL = BROWSER_LLM_RECOMMENDED_MODELS[0];

export const findBrowserLlmModel = (id: string): BrowserLlmModelInfo | undefined => {
  return BROWSER_LLM_RECOMMENDED_MODELS.find((model) => model.id === id);
};
