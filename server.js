import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS: allow only configured origins in production; default open in dev.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length > 0) {
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // allow non-browser tools
        return allowedOrigins.includes(origin)
          ? cb(null, true)
          : cb(new Error('Not allowed by CORS'));
      },
    })
  );
} else {
  // Open for local dev
  app.use(cors());
}

// Serve static frontend
app.use(express.static('public'));

// Multer in-memory storage for uploaded image
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
    fields: 2, // name + image
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPEG, PNG, WEBP, HEIC/HEIF images are allowed'));
  },
});

// Rate limit generation endpoint
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Main generation endpoint
app.post('/api/generate', generateLimiter, upload.single('image'), async (req, res) => {
  try {
    const name = (req.body?.name || '').toString().trim();
    const image = req.file;

    if (!image) {
      return res.status(400).json({ error: 'Image file is required' });
    }
    // Validate name: 1-40 chars, letters/numbers/space and simple punctuation
    const nameOk = /^[\p{L}\p{N} .,'-]{1,40}$/u.test(name);
    if (!nameOk) {
      return res.status(400).json({ error: 'Name must be 1-40 characters and use letters, numbers, spaces, or . , \' -' });
    }

    // If no API key, return the original image as a mock so UI flow can be tested.
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(501).json({
        error: 'GOOGLE_API_KEY not set. Returning original image as mock.',
        mock: true,
        mimeType: image.mimetype,
        imageBase64: image.buffer.toString('base64'),
      });
    }


    // Call Gemini image editing
    const result = await generateWithGemini({
      name,
      buffer: image.buffer,
      mimeType: image.mimetype,
    });

    if (!result || !result.imageBase64) {
      return res.status(502).json({ error: 'Model did not return an image' });
    }

    res.json({
      mimeType: result.mimeType || 'image/png',
      imageBase64: result.imageBase64,
    });
  } catch (err) {
    console.error('Generation error:', err);
    // Distinguish timeout and surface a clearer 504
    if (err?.name === 'TimeoutError' || err?.code === 'ETIMEDOUT') {
      const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '90000', 10);
      return res.status(504).json({
        error: `Generation timed out after ${timeoutMs}ms`,
      });
    }
    const message = err?.message || 'Unexpected error';
    res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// --- Gemini integration ---
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateWithGemini({ name, buffer, mimeType }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  // Model fallback order - try the higher quota model first
  const fallbackModels = [
    process.env.GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25',
    'gemini-2.5-pro-preview-03-25',
    'gemini-2.5-flash-image-preview'
  ];

  const prompt =
    `Take this photo and turn the person into a collectible figurine inside a toy box. ` +
    `The box should include a clear plastic window, bold graphics, and the name "${name}" on the packaging. ` +
    `Style the figurine in a fun, toy-like way but keep the person's likeness recognizable.`;

  // Inline the uploaded image as input and request an image response.
  const imagePart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };

  const request = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          imagePart,
        ],
      },
    ],
  };

  // Try each model in fallback order
  for (const modelName of [...new Set(fallbackModels)]) { // Remove duplicates
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '90000', 10);
      const response = await withTimeout(
        model.generateContent(request),
        timeoutMs,
        `Gemini generateContent with ${modelName}`
      );

      // Try to extract inlineData image from candidates
      const candidates = response?.response?.candidates || [];

      for (const c of candidates) {
        const parts = c?.content?.parts || [];

        for (const p of parts) {
          if (p.inlineData?.data) {
            console.log(`✅ Success with model: ${modelName}`);
            return { imageBase64: p.inlineData.data, mimeType: p.inlineData.mimeType || 'image/png' };
          }
          // Some responses may return a "media" style payload; handle if present.
          if (p.media?.mimeType && p.media?.data) {
            console.log(`✅ Success with model: ${modelName}`);
            return { imageBase64: p.media.data, mimeType: p.media.mimeType };
          }
          // Log if we get text instead of images
          if (p.text) {
            console.log(`⚠️  ${modelName} returned text instead of image: "${p.text.substring(0, 100)}..."`);
          }
        }
      }

      // If no image data found, try next model
      console.log(`❌ No image data returned from model: ${modelName}, trying next...`);

    } catch (error) {
      console.log(`Model ${modelName} failed:`, error.message);
      // Continue to next model in fallback chain
      if (error.status === 500 || error.message.includes('Internal error')) {
        continue; // Try next model
      }
      // For other errors (auth, quota, etc.), don't continue
      throw error;
    }
  }

  // If all models failed to return image data
  return null;
}

// Utility: Promise timeout wrapper
class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'ETIMEDOUT';
  }
}

function withTimeout(promise, ms, label = 'operation') {
  let timeoutId;
  const t = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, t]).finally(() => clearTimeout(timeoutId));
}
