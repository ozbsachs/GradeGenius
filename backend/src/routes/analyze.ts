import { Router } from 'express';
import multer from 'multer';
import { analyzeScreenshot } from '../services/claude.js';
import type { AnalysisResponse } from '../types/grades.js';

const router = Router();
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

router.post('/analyze', upload.single('screenshot'), async (req, res) => {
  try {
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
    console.error('Analysis error:', error);
    const response: AnalysisResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    res.status(500).json(response);
  }
});

export default router;
