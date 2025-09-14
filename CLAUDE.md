# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (uses nodemon for auto-restart)
- **Start production server**: `npm start`
- **Install dependencies**: `npm install` or `pnpm install`

## Docker Commands

- **Build image**: `docker build -t action-figure-builder .`
- **Run container**: `docker run --rm -p 3000:3000 --env-file .env action-figure-builder`

## Architecture Overview

This is a demo Express.js application originally intended to transform user photos into action figure images using Google's Gemini AI. **Currently runs in mock mode** as Gemini models are text-based and cannot generate images.

### Key Components

- **Server (`server.js`)**: Single-file Express server handling:
  - Static file serving from `public/` directory
  - Image upload via multer (in-memory, 10MB limit)
  - Rate limiting (20 requests per 15 minutes per IP)
  - CORS configuration (open for dev, configurable for production)
  - Google Gemini AI integration for image generation

- **Frontend (`public/`)**: Vanilla HTML/CSS/JS frontend with:
  - Image upload with live preview
  - Custom name input for packaging
  - Download functionality for generated images

### API Endpoints

- `GET /api/health`: Health check endpoint
- `POST /api/generate`: Main generation endpoint accepting multipart form data with `image` (file) and `name` (string)

### Environment Configuration

Required:
- `GOOGLE_API_KEY`: Google AI Studio API key

Optional:
- `GEMINI_MODEL`: Override default model (default: `gemini-2.5-flash-image-preview`)
- `PORT`: Server port (default: 3000)
- `ALLOWED_ORIGINS`: Comma-separated CORS origins for production
- `RATE_LIMIT_MAX`: Max requests per 15 minutes (default: 20)
- `GEMINI_TIMEOUT_MS`: Gemini request timeout (default: 90000ms)

### Key Implementation Details

- Uses ESM modules (`"type": "module"` in package.json)
- Implements timeout wrapper for Gemini API calls to prevent hanging requests
- Supports multiple image formats: JPEG, PNG, WEBP, HEIC/HEIF
- Returns mock response (original image) when `GOOGLE_API_KEY` is not set for UI testing
- Validates name input (1-40 characters, letters/numbers/spaces and basic punctuation)
- Parses Gemini response for inline image data in `candidates[].content.parts[]`