## Fashion Inspiration Library

A lightweight Next.js proof of concept for the fashion-garment case study. Designers can upload field imagery, generate structured garment metadata with a local multimodal mock, filter the library across product and contextual dimensions, and add their own annotations.

## What is implemented

- Image upload with local file persistence in `public/uploads`
- Heuristic AI classification that generates both natural-language descriptions and structured metadata
- Visual library with dynamic search and filters for garment, style, material, color, pattern, season, designer, country, city, month, and more
- Designer annotations with tags and notes stored separately from AI metadata
- SQLite persistence for uploaded images and annotations
- Evaluation harness in `eval/`
- Unit, integration, and end-to-end tests in `tests/`

## Local setup

Install dependencies, then run the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run lint
npm run test
npm run eval
```

## Architecture notes

- `app/page.tsx` is a server component that reads directly from SQLite instead of fetching the app's own route handlers. This follows the newer Next.js guidance in `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md`.
- Route Handlers are used only for public mutations and JSON access:
  - `POST /api/upload`
  - `GET /api/images`
  - `PATCH /api/images/[id]/annotations`
- Shared logic lives in `lib/` so the UI, routes, tests, and evaluation script all exercise the same classifier and filter code.
- The classifier is intentionally local and deterministic. It infers metadata from filename plus upload context, which makes the assignment runnable without external model credentials while still demonstrating the full product flow.

## Evaluation

The repository includes a 62-item labeled fixture set in `eval/test-set/labeled-fixtures.ts` and a script that reports per-attribute accuracy:

```bash
npm run eval
```

Current scope:

- `garmentType`
- `style`
- `material`
- `occasion`
- `country`

Current synthetic benchmark results from `npm run eval`:

- `garmentType`: `98.4%`
- `style`: `88.7%`
- `material`: `100.0%`
- `occasion`: `69.4%`
- `country`: `100.0%`

This is a timeboxed synthetic evaluation harness rather than a true open-source image benchmark. In a production follow-up, I would replace it with 50-100 manually labeled images from a real fashion dataset such as Pexels or DeepFashion and compare a real multimodal model against the same schema.

## Testing

Included tests:

- Unit test for parsing classifier output into normalized structured attributes
- Integration test for dynamic filter behavior with location and time facets
- End-to-end API test covering upload, classify, and filter

## Trade-offs and next steps

- The "AI" layer is a deterministic heuristic mock, chosen so the assignment runs locally with no secrets.
- Uploaded files are stored on local disk and metadata is stored in SQLite. For a multi-user deployment, I would move assets to object storage and SQLite to Postgres.
- Search is currently token-based over descriptions, metadata, and annotations. Given more time, I would add embeddings or FTS for more natural retrieval.
