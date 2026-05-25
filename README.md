# AA Translator

AA(ASCII Art / Shift-JIS Art) 안의 일본어 대사를 한국어로 번역하는 로컬 우선 번역기입니다.

## Source Lineage

이 프로젝트의 근간이 되는 원본은 Google AI Studio applet
`https://aistudio.google.com/apps/640cb8e4-43ab-4833-839a-2204c25d265f?fullscreenApplet=true&showPreview=true&showAssistant=true`
에서 발췌한 AA translator입니다. 현재 저장소는 해당 원형을 pnpm/TypeScript/Hono 기반으로 정리하고, SFX/server/static pages 배포와 provider profile을 추가한 후속 구현입니다.

## Runtime Modes

공식 지원 모드는 세 가지입니다.

- **SFX mode**: Bun `build --compile`로 만든 단일 실행 파일입니다. 실행 파일 안에 backend와 client assets가 함께 포함됩니다.
- **Server mode**: Node.js에서 Hono backend를 실행합니다. homelab, 자체 VPC, reverse proxy 환경을 위한 모드입니다.
- **Browser BYOK mode**: GitHub Pages 같은 정적 호스팅에 올리는 SPA입니다. backend 없이 브라우저가 provider를 직접 호출하고, API key는 해당 브라우저의 localStorage에만 저장됩니다.

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

## Browser BYOK Mode

```bash
pnpm run build:pages
```

`dist/client`를 GitHub Pages, Cloudflare Pages 같은 정적 호스팅에 배포합니다.

제약:

- Gemini는 브라우저에서 직접 호출하는 기본 대상입니다.
- OpenAI-compatible profile도 만들 수 있지만 provider의 CORS 정책과 HTTPS page -> HTTP localhost mixed content 제한을 그대로 받습니다.
- Local LLM server는 Server/SFX mode에서 사용하는 것을 기본으로 합니다.
- Browser BYOK mode에는 backend secret 저장소가 없습니다. key는 사용자 본인 브라우저에만 저장됩니다.

## Docker

Server mode 이미지를 빌드합니다.

```bash
docker build -t aa-translator .
docker run --rm -p 3000:3000 -v aa-translator-data:/app/data aa-translator
```

Local LLM은 Docker container에서 접근 가능한 host 또는 같은 Docker network의 OpenAI-compatible endpoint를 profile로 등록합니다.

## GitHub Pages

`master` branch에 push하면 GitHub Actions가 `pnpm run build:pages` 결과를 GitHub Pages에 배포합니다. 정적 Pages 빌드는 Browser BYOK mode이므로 local LLM은 CORS/mixed-content 제약을 받을 수 있고, local LLM 사용자는 SFX 또는 Docker/server mode를 권장합니다.

## Release Artifacts

`v*` tag를 push하면 GitHub Actions가 다음 산출물을 만듭니다.

- Windows SFX binary
- Linux SFX binary
- GHCR Docker image

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
