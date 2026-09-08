# Affiliate Content Automation

AI-assisted affiliate content automation platform for creating short-form product videos for TikTok, Reels and Shorts.

## What it does

- Import a product from a URL or enter product details manually
- Generate hooks, scripts, CTAs, captions and hashtags with Gemini
- Create multiple content variants per product
- Render vertical 9:16 videos with Remotion
- Use browser-safe BYOK API keys via environment variables
- Batch product/content generation architecture
- Job-oriented architecture designed for later publishing and analytics integrations

## Architecture

`Next.js 15 + React 19 + TypeScript + Tailwind CSS + Gemini + Remotion + FFmpeg`

The project is inspired by the pipeline architecture of [cyberjalu/video-ai](https://github.com/cyberjalu/video-ai), but is redesigned around affiliate products and reusable content variants.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Environment

```env
GEMINI_API_KEY=
PEXELS_API_KEY=
```

Never commit real API keys.

## Roadmap

1. Product ingestion and normalization
2. AI content generation
3. Visual asset selection
4. Remotion rendering
5. Batch generation and job queue
6. Content library and analytics
7. Optional TikTok publishing integration
