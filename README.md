# Dezhonger Knowledge

A bilingual, Markdown-first technical knowledge site for backend systems, computer science, and AI engineering.

## Local development

```bash
npm ci
npm run dev
```

The site uses the `/knowledge/` base path in development and production.

## Build

```bash
npm run build
```

The generated site is written to `docs/.vitepress/dist`.

## Deployment

The repository is deployed independently under `~/knowledge` with Docker Compose. Its `knowledge` container joins the external `dezhonger-edge` network. The public Nginx service in `dezhonger-service` proxies `/knowledge/` to that container.
