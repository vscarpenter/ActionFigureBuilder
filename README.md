# Action Figure Builder

**Demo application** showing API integration with Google's Gemini AI. Originally intended to transform user photos into action figure images. Simple Express backend + vanilla JS frontend.

## Features

- Image upload with live preview
- Custom "Name for Packaging" field
- Server-side integration with Google Gemini API
- **Mock Mode**: Returns original image as Gemini cannot generate images
- Download functionality for demonstration purposes

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

3. Test your API key (optional but recommended):
   - `./test-api.sh` (or `bash test-api.sh` on Windows)
   - This validates your Google AI credentials before starting the app

4. Run in dev (auto-restart with nodemon):
   - `npm run dev`

   Or run normally:
   - `npm start`

   Or run the full demo (starts server + opens browser):
   - `npm run demo`

5. Open `http://localhost:3000` and try an image + name.

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
- `GEMINI_TIMEOUT_MS` (optional): Timeout for the Gemini request in ms (default `90000`).

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

- Default model is `gemini-2.5-pro-preview-03-25` (higher quota limits).
- The server includes automatic fallback logic that tries multiple models in order.
- If one model returns a 500 error, it automatically tries the next one.
- The server scans `candidates[].content.parts[]` for `inlineData`/`media` and returns the first image found.
- Preview models can be unstable - the app will fallback to more stable alternatives.

## API Validation

Before running the app, you can test if your Google AI credentials are working:

```bash
./test-api.sh
```

This script will:
- Check if your `.env` file exists and contains `GOOGLE_API_KEY`
- Make a test request to the Gemini API
- Display a success message or helpful error information
- Verify you can access the required AI models

## Troubleshooting

- **API Key Issues**: Run `./test-api.sh` first to validate your credentials
- 400 Bad Request about `response_mime_type`:
  - Fixed in this repo by not setting `generationConfig.responseMimeType`. The API only accepts text mime types there. The server now parses image parts from the response.
- 413 Payload Too Large:
  - Images are limited to 10MB. Resize before upload.
- CORS issues:
  - Set `ALLOWED_ORIGINS` to the exact origins you want to allow in production.
- 504 Gateway Timeout from `/api/generate`:
  - The model call exceeded the timeout (default 90s). Try a smaller image, use a faster model via `GEMINI_MODEL`, or increase `GEMINI_TIMEOUT_MS`.

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
