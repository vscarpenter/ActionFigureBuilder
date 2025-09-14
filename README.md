# Action Figure Builder

Turn a user photo into a stylized “action figure in a toy box” using Google’s Gemini image-capable models. Simple Express backend + vanilla JS frontend.

## Features

- Image upload with live preview
- Custom "Name for Packaging" field
- Server-side call to a Gemini model with an editing prompt
- Returns a generated image and provides a download link

## Tech Stack

- `Node.js` + `Express` backend
- `multer` for image upload (in-memory)
- `@google/generative-ai` SDK for Gemini
- Static frontend (HTML/CSS/JS)

## Requirements

- Node.js 18+ (uses fetch/ESM)
- A Google AI Studio API key with access to an image-capable Gemini model

## Quick Start

1. Install dependencies:
   - `npm install` (or `pnpm install`)

2. Create `.env` in the project root:
   - `GOOGLE_API_KEY=your_api_key_here`
   - Optional: `GEMINI_MODEL=gemini-2.5-flash-image-preview`
   - Optional: `PORT=3000`

3. Run in dev (auto-restart with nodemon):
   - `npm run dev`

   Or run normally:
   - `npm start`

4. Open `http://localhost:3000` and try an image + name.

## Docker

- Build the image:
  - `docker build -t action-figure-builder .`

- Run the container (uses `.env` for config):
  - `docker run --rm -p 3000:3000 --env-file .env action-figure-builder`

- Then open: `http://localhost:3000`

Notes:
- The Dockerfile installs production dependencies only and runs `node server.js`.
- Configure CORS for production by setting `ALLOWED_ORIGINS` in your `.env`.
- `.dockerignore` prevents `.env`, `node_modules`, logs, and other dev files from bloating the build context.

## Environment Variables

- `GOOGLE_API_KEY` (required): API key for Google Generative AI.
- `GEMINI_MODEL` (optional): Overrides default model. Defaults to `gemini-2.5-flash-image-preview`.
- `PORT` (optional): Server port (default `3000`).
- `ALLOWED_ORIGINS` (optional): Comma-separated list of allowed CORS origins. If unset, CORS is open for local dev.
- `RATE_LIMIT_MAX` (optional): Max requests per 15 minutes per IP for `/api/generate` (default `20`).
- `GEMINI_TIMEOUT_MS` (optional): Timeout for the Gemini request in ms (default `30000`).

## How It Works

- Frontend POSTs `multipart/form-data` with fields:
  - `image` (file)
  - `name` (string)
- Backend route `POST /api/generate`:
  - Validates inputs and size/type (JPEG, PNG, WEBP, HEIC/HEIF up to 10MB)
  - Calls Gemini with the image + prompt
  - Returns `{ mimeType, imageBase64 }` on success
  - If no `GOOGLE_API_KEY`, returns a mock payload echoing the uploaded image so you can test the UI.

### API

- `POST /api/generate`
  - Request: `multipart/form-data` with `image`, `name`
  - Response 200: `{ mimeType: string, imageBase64: string }`
  - Errors: `400` invalid input, `501` when key missing (mock), `502/500` on generation issues

## Model Notes

- Default model is `gemini-2.5-flash-image-preview`.
- Some preview models may not always return inline image data. The server scans `candidates[].content.parts[]` for `inlineData`/`media` and returns the first image found.
- If you only receive text responses, try a different image-capable model by setting `GEMINI_MODEL`.

## Troubleshooting

- 400 Bad Request about `response_mime_type`:
  - Fixed in this repo by not setting `generationConfig.responseMimeType`. The API only accepts text mime types there. The server now parses image parts from the response.
- 413 Payload Too Large:
  - Images are limited to 10MB. Resize before upload.
- CORS issues:
  - Set `ALLOWED_ORIGINS` to the exact origins you want to allow in production.

## Project Structure

- `server.js` — Express server and Gemini integration
- `public/` — Static frontend assets (`index.html`, `styles.css`, `script.js`)
- `.env` — Environment variables (not committed). See `.gitignore`. Consider adding `.env.example` for contributors.

## Security & Usage

- Never commit real secrets. `.env` is ignored by git. See `.env.example` for a template.
- Using Google Generative AI may incur costs; review your quota and pricing.
- Ensure you comply with Google’s terms and any content policies.

## License

MIT — see `LICENSE` for details.
