# PUBLIC COMPANY DATA FR

Starter repo for a French public-company-data app:
- search by company name or SIREN
- autocomplete the company profile with free public sources
- validate the company
- launch public financial-data enrichment

## What is already wired

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express
- **Connected now**:
  - API Recherche d'entreprises for name search
  - API SIRENE for detailed company bootstrap
- **Scaffolded**:
  - INPI connector
  - BODACC connector
  - normalized merged report endpoint

## Repo structure

```text
frontend/   React app
backend/    API aggregator
```

## Quick start

```bash
cp .env.example .env
npm install
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8787`

## Environment variables

- `INSEE_API_KEY`: required for API SIRENE
- `FRONTEND_ORIGIN`: CORS origin for local frontend
- `INPI_BASE_URL`: optional until you wire your chosen INPI endpoints
- `BODACC_BASE_URL`: optional until you wire your chosen BODACC endpoints

## API routes

### `GET /api/health`
Healthcheck.

### `GET /api/search?q=edf`
Searches companies by name or text.

### `GET /api/company/:siren/bootstrap`
Returns normalized SIRENE-based company data.

### `POST /api/company/:siren/enrich`
Runs the full enrichment pipeline and merges:
- SIRENE
- INPI (stub)
- BODACC (stub)

## GitHub Pages deployment

This repo is set up so the frontend can later be deployed on GitHub Pages.
The backend must remain on a serverless/server runtime because the INSEE key must stay private.

## Next steps

1. Add exact INPI endpoints you want to consume
2. Add exact BODACC query patterns by SIREN
3. Add caching and retry logic
4. Add PDF extraction for annual accounts if needed
5. Add authentication if you want saved searches
