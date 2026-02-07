import { Router, Request, Response } from 'express';
import multer from 'multer';
import { analyzeScreenshot } from '../services/gemini.js';
import type { AnalysisResponse } from '../types/grades.js';

const router = Router();

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Sanitize errors for users
function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('rate') || msg.includes('quota') || msg.includes('429')) {
      return 'Service is busy. Please wait a moment and try again.';
    }
    if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('403')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    if (msg.includes('parse') || msg.includes('json')) {
      return 'Could not read the grades from this image. Please try a clearer screenshot.';
    }
    if (msg.includes('timeout') || msg.includes('network')) {
      return 'Connection issue. Please check your internet and try again.';
    }
  }

  return 'Something went wrong. Please try again.';
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.'));
    }
  },
});

router.post('/analyze', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    // Rate limiting
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(clientIp)) {
      const response: AnalysisResponse = {
        success: false,
        error: 'Too many requests. Please wait a minute before trying again.',
      };
      return res.status(429).json(response);
    }

    if (!req.file) {
      const response: AnalysisResponse = {
        success: false,
        error: 'No screenshot file provided',
      };
      return res.status(400).json(response);
    }

    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const gradeData = await analyzeScreenshot(base64, mimeType);

    const response: AnalysisResponse = {
      success: true,
      data: gradeData,
    };

    res.json(response);
  } catch (error) {
    // Log full error for debugging (server-side only)
    console.error('Analysis error:', error);

    // Send sanitized error to user
    const response: AnalysisResponse = {
      success: false,
      error: getUserFriendlyError(error),
    };
    res.status(500).json(response);
  }
});

export default router;
