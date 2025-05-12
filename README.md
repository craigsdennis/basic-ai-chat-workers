# Basic Chat App

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/craigsdennis/basic-ai-chat-workers)

This is a Chat app powered by [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai). It is a [React](https://react.dev) app using the [Cloudflare 🧡 Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) and [Tailwind](https://tailwindcss.com).

Messages are stored in [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) and sends them up on each request.

👀 the [Workers code](./worker/index.ts)

You can change the System Message by pressing the settings icon.

## Develop

```bash
npm run dev
```

## Deploy 

```bash
npm run deploy
```