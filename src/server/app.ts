import { Hono } from 'hono';
import type {
  TranslateBatchRequest,
  TranslateRequest,
  TranslationJobRequest,
  TranslationJobStatus,
  TranslationProfileInput,
} from '../../types.js';
import { DEFAULT_SYSTEM_PROMPT } from '../shared/prompts.js';
import { listModelsWithProvider, translateBatchWithProvider, translateWithProvider } from './providers/index.js';
import { ProfileStore } from './profiles/store.js';

export interface AppOptions {
  profiles?: ProfileStore;
}

interface TranslationJob {
  id: string;
  status: TranslationJobStatus;
  result?: unknown;
  error?: string;
  createdAt: number;
}

const MAX_TRANSLATION_JOBS = 100;

export const createApp = (options: AppOptions = {}) => {
  const app = new Hono();
  const profiles = options.profiles ?? ProfileStore.fromEnv();
  const translationJobs = new Map<string, TranslationJob>();

  const rememberJob = (job: TranslationJob) => {
    translationJobs.set(job.id, job);
    if (translationJobs.size <= MAX_TRANSLATION_JOBS) {
      return;
    }

    const oldest = [...translationJobs.values()].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) {
      translationJobs.delete(oldest.id);
    }
  };

  const runTranslationJob = async (job: TranslationJob, body: TranslationJobRequest) => {
    job.status = 'running';
    try {
      const profile = await profiles.get(body.profileId);
      if (body.mode === 'single') {
        if (!body.text) {
          throw new Error('Translation text is required.');
        }
        job.result = await translateWithProvider({
          profile,
          text: body.text,
          customDictionary: body.customDictionary ?? [],
          useDefaultDictionary: body.useDefaultDictionary ?? true,
          systemInstruction: body.systemInstruction ?? DEFAULT_SYSTEM_PROMPT,
        });
      } else {
        if (!body.texts) {
          throw new Error('Batch translation texts are required.');
        }
        job.result = await translateBatchWithProvider({
          profile,
          texts: body.texts,
          customDictionary: body.customDictionary ?? [],
          useDefaultDictionary: body.useDefaultDictionary ?? true,
          systemInstruction: body.systemInstruction ?? DEFAULT_SYSTEM_PROMPT,
        });
      }
      job.status = 'completed';
    } catch (error: any) {
      job.error = error.message || 'Translation job failed.';
      job.status = 'failed';
    }
  };

  app.get('/api/health', (c) => c.json({ ok: true }));

  app.get('/api/profiles', async (c) => c.json({ profiles: await profiles.list() }));

  app.post('/api/profiles', async (c) => {
    const input = await c.req.json<TranslationProfileInput>();
    return c.json({ profile: await profiles.save(input) }, 201);
  });

  app.put('/api/profiles/:id', async (c) => {
    const input = await c.req.json<TranslationProfileInput>();
    return c.json({ profile: await profiles.update(c.req.param('id'), input) });
  });

  app.delete('/api/profiles/:id', async (c) => {
    await profiles.delete(c.req.param('id'));
    return c.body(null, 204);
  });

  app.post('/api/profiles/:id/test', async (c) => {
    const profile = await profiles.get(c.req.param('id'));
    await translateWithProvider({
      profile,
      text: 'テストです。',
      customDictionary: [],
      useDefaultDictionary: false,
      systemInstruction: DEFAULT_SYSTEM_PROMPT,
    });
    return c.json({ ok: true });
  });

  app.get('/api/profiles/:id/models', async (c) => {
    const profile = await profiles.get(c.req.param('id'));
    return c.json({ models: await listModelsWithProvider({ profile }) });
  });

  app.post('/api/translate', async (c) => {
    const body = await c.req.json<TranslateRequest>();
    const profile = await profiles.get(body.profileId);
    const result = await translateWithProvider({
      profile,
      text: body.text,
      customDictionary: body.customDictionary ?? [],
      useDefaultDictionary: body.useDefaultDictionary ?? true,
      systemInstruction: body.systemInstruction ?? DEFAULT_SYSTEM_PROMPT,
    });
    return c.json(result);
  });

  app.post('/api/translate/batch', async (c) => {
    const body = await c.req.json<TranslateBatchRequest>();
    const profile = await profiles.get(body.profileId);
    const result = await translateBatchWithProvider({
      profile,
      texts: body.texts,
      customDictionary: body.customDictionary ?? [],
      useDefaultDictionary: body.useDefaultDictionary ?? true,
      systemInstruction: body.systemInstruction ?? DEFAULT_SYSTEM_PROMPT,
    });
    return c.json(result);
  });

  app.post('/api/translation-jobs', async (c) => {
    const body = await c.req.json<TranslationJobRequest>();
    const job: TranslationJob = {
      id: globalThis.crypto.randomUUID(),
      status: 'queued',
      createdAt: Date.now(),
    };
    rememberJob(job);
    void runTranslationJob(job, body);
    return c.json({ id: job.id, status: job.status }, 202);
  });

  app.get('/api/translation-jobs/:id', (c) => {
    const job = translationJobs.get(c.req.param('id'));
    if (!job) {
      return c.json({ error: 'Translation job not found.' }, 404);
    }
    return c.json({
      id: job.id,
      status: job.status,
      result: job.result,
      error: job.error,
    });
  });

  app.onError((error, c) => {
    return c.json({ error: error.message || 'Internal server error' }, 500);
  });

  return app;
};
