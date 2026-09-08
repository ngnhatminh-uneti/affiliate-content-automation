# Affiliate Content Automation

Production-oriented AI workspace for turning affiliate products into short-form videos for TikTok, Reels and Shorts.

## End-to-end flow

`Product URL → Product normalization → Gemini scripts → variants → Gemini TTS → subtitles → Remotion 9:16 → MP4 preview → user confirmation → TikTok Content Posting API → publish status`

## Included

- Product URL import with redirect handling and private/local host protection
- Gemini-powered Vietnamese affiliate hooks, scripts, CTA, captions and hashtags
- Schema validation for AI output and conservative claim policy
- 1–10 content variants and batch generation for up to 20 products
- Gemini 2.5 Flash TTS with selectable voices
- Automatic subtitle timeline generation
- Animated vertical 1080×1920 Remotion composition
- Server-side MP4/H.264 rendering through Remotion renderer + FFmpeg
- Render job metadata and persistent local library
- Batch rendering endpoint (up to 10 items per request)
- Dashboard analytics for products, scripts, renders and TikTok publish outcomes
- TikTok OAuth v2, creator info, Direct Post upload, refresh tokens, status polling and webhook receiver
- Explicit preview/confirmation before TikTok upload
- Docker runtime with Chromium + FFmpeg
- GitHub Actions typecheck + production build
- BYOK secrets kept outside the repository

## Stack

- Next.js 15 App Router
- React 19 + TypeScript
- Tailwind CSS v4
- Gemini API
- Remotion 4
- FFmpeg/Chromium
- Filesystem job/library store for the self-hosted MVP

The architecture is inspired by [`cyberjalu/video-ai`](https://github.com/cyberjalu/video-ai), but the product model and workflow are redesigned for affiliate content production.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

### Environment

```env
GEMINI_API_KEY=
PEXELS_API_KEY=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=http://localhost:3000/api/tiktok/callback
```

Never commit real API keys or TikTok client secrets.

## Docker

```bash
docker build -t affiliate-content-automation .
docker run --rm -p 3000:3000 --env-file .env.local -v $(pwd)/data:/app/data -v $(pwd)/public/generated:/app/public/generated affiliate-content-automation
```

The mounted `data` and `public/generated` directories keep the local library, jobs, audio and rendered videos across container restarts.

## TikTok setup

Create a TikTok developer app, configure the OAuth redirect URI to the value of `TIKTOK_REDIRECT_URI`, and request the required Content Posting API permissions. The app queries creator info before presenting posting settings, shows the actual video preview, and only transfers media after explicit user confirmation.

For server-side video storage, TikTok recommends `PULL_FROM_URL` when media is already hosted on infrastructure controlled by the API client. The current single-user release uses `FILE_UPLOAD` because generated files are local to the application runtime; a production object-storage adapter can switch to `PULL_FROM_URL` after domain/URL-prefix verification.

## API surface

- `POST /api/products/import` — import and normalize a product page
- `POST /api/content/generate` — create content variants
- `POST /api/batch/generate` — generate content for up to 20 products
- `POST /api/tts` — generate narration audio
- `POST /api/render` — render one vertical video
- `POST /api/batch/render` — render up to 10 queued items sequentially
- `GET /api/jobs` — inspect render history
- `GET|POST /api/library` — persist and read product/content library
- `GET /api/analytics` — dashboard metrics
- `/api/tiktok/connect` + `/api/tiktok/callback` — OAuth
- `GET /api/tiktok/creator` — current creator info
- `POST /api/tiktok/publish` — confirmed Direct Post upload
- `POST /api/tiktok/status` — fetch publish status
- `POST /api/tiktok/webhook` — receive TikTok publishing events
- `GET /api/health` — readiness/health signal

## Storage and production hardening

The filesystem store is intentionally simple for a single-user self-hosted release. For multi-user production, replace it with Postgres/Redis and object storage, encrypt OAuth refresh tokens at rest, move render work to a dedicated worker/queue, and use signed media URLs rather than exposing a mutable local directory.

Remotion's current licensing terms should be reviewed for the deployment/company size and usage model before commercial operation.
