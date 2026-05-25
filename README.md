# AA Translator

AA(ASCII Art / Shift-JIS Art) 안의 일본어 대사를 한국어로 번역하는 로컬 우선 번역기입니다.

## Runtime Modes

공식 지원 모드는 두 가지입니다.

- **SFX mode**: Bun `build --compile`로 만든 단일 실행 파일입니다. 실행 파일 안에 backend와 client assets가 함께 포함됩니다.
- **Server mode**: Node.js에서 Hono backend를 실행합니다. homelab, 자체 VPC, reverse proxy 환경을 위한 모드입니다.

정적 SPA 단독 배포는 공식 지원하지 않습니다. 브라우저는 LLM provider를 직접 호출하지 않고 항상 backend의 `/api/*`를 호출합니다.

## Development

```bash
pnpm install
pnpm dev
```

개발 서버는 Vite client와 Hono backend를 함께 실행합니다.

## Server Mode

```bash
pnpm build
pnpm start:server
```

기본값:

- Host: `0.0.0.0`
- Port: `3000`
- Data dir: `./data`

환경 변수:

- `AA_TRANSLATOR_HOST`
- `AA_TRANSLATOR_PORT`
- `AA_TRANSLATOR_DATA_DIR`
- `GEMINI_API_KEY` 또는 `API_KEY`

Server mode에는 app-layer auth가 없습니다. 네트워크 경계, VPN, reverse proxy에서 접근 제어를 처리해야 합니다.

## SFX Mode

```bash
pnpm package:sfx
```

Windows에서는 `dist/aa-translator.exe`가 생성됩니다. Bun은 dependency 설치에 사용하지 않고 SFX compile에만 사용합니다.

기본값:

- Host: `127.0.0.1`
- Port: `3000`

## Provider Profiles

Provider 설정은 backend profile로 관리합니다.

- `gemini`
- `openai-compatible`

Ollama, LM Studio, vLLM, LocalAI는 OpenAI-compatible profile로 연결합니다.

## Quality Gates

```bash
pnpm test
pnpm run check
pnpm run lint
pnpm run build
pnpm run package:sfx
```

