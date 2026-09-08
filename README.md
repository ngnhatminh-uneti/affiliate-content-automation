# Affiliate Content Automation

AI-assisted affiliate content automation platform for turning product information into short-form vertical videos and sending approved videos to TikTok.

## Current pipeline

```text
Product URL / manual product data
        ↓
Product import
        ↓
Gemini content engine
        ↓
Multiple hooks + scripts + CTAs + captions + hashtags
        ↓
Content variant selection
        ↓
Remotion 1080×1920 H.264 render
        ↓
Local video library / MP4 download
        ↓
TikTok OAuth v2
        ↓
Creator info → user confirmation → chunk upload → publish status
```

## Features

- Product import from URL with manual fallback
- Gemini-powered Vietnamese affiliate scripts
- 1 / 3 / 5 / 10 content variants
- Viral, review, educational and story tones
- Vertical TikTok composition at 1080×1920
- Render jobs persisted to local filesystem
- MP4 preview and download
- TikTok Login Kit OAuth v2 with CSRF state validation
- Access-token refresh support
- TikTok creator info lookup
- Confirmed Direct Post upload using the Content Posting API
- Publish status endpoint
- GitHub Actions build workflow

## Stack

Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Gemini via `@google/genai`, Remotion 4, Node.js 20+.

The architecture is inspired by [cyberjalu/video-ai](https://github.com/cyberjalu/video-ai), but the product/content model and workflow are designed specifically for affiliate short-form video production.

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

Never commit real API keys or TikTok user tokens.

## TikTok setup

Create an app in the TikTok for Developers portal, enable Login Kit and Content Posting API, and register the exact redirect URI used by the app. The current OAuth flow uses `https://www.tiktok.com/v2/auth/authorize/` and exchanges the authorization code at `https://open.tiktokapis.com/v2/oauth/token/`.

For Direct Post, TikTok requires creator information to be queried before the post flow, and the user must explicitly consent before media is sent. Unaudited clients are restricted to private viewing until TikTok completes an audit, so the UI intentionally publishes with `SELF_ONLY` during initial integration.

## Local storage

- `data/jobs/*.json` stores render-job metadata.
- `data/tiktok.json` stores the local development TikTok token bundle.
- `public/generated/*.mp4` stores rendered videos.

These paths are ignored by Git. For production, replace filesystem token/job storage with encrypted persistent storage and a queue-backed worker.

## Render locally without the web UI

```bash
npm run remotion:studio
```

## Next production upgrades

1. Persistent database for products, scripts, render jobs and publishing history.
2. Queue/worker architecture for concurrent batch rendering.
3. Pexels/media asset search, subtitle generation and TTS/voice pipeline.
4. Video template editor and per-scene timeline controls.
5. Analytics, scheduling and A/B testing.
6. Multi-account TikTok token storage with encrypted secrets and role-based access.
