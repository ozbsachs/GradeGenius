# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GradeGenius is an AI-powered web app that analyzes Canvas grade screenshots to provide grade calculations and "what do I need on my final" predictions. Currently a working POC.

## Commands

```bash
# Install dependencies
npm install

# Run development (frontend + backend)
npm run dev

# Frontend only (http://localhost:5173)
npm run dev:frontend

# Backend only (http://localhost:3001)
npm run dev:backend

# Build for production
npm run build

# Type check
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

## Tech Stack (Current POC)

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Dropzone for image uploads
- Lucide React for icons

### Backend
- Node.js + Express.js + TypeScript
- Google Gemini API (gemini-2.0-flash) for vision
- Multer for file uploads

## Project Structure

```
gradegenius/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ScreenshotUpload.tsx  # Drag/drop/paste upload
│       │   ├── ImagePreview.tsx      # Multi-image preview + submit
│       │   ├── LoadingSpinner.tsx    # Progress indicator
│       │   ├── GradeDisplay.tsx      # Grade visualization
│       │   └── FinalCalculator.tsx   # "What do I need" calc
│       ├── api/client.ts             # API calls + multi-image merge
│       ├── utils/mergeGrades.ts      # Merge multiple screenshots
│       ├── types/grades.ts
│       └── App.tsx
├── backend/
│   └── src/
│       ├── routes/analyze.ts         # /api/analyze endpoint
│       ├── services/gemini.ts        # Gemini API integration
│       └── types/grades.ts
├── .env                              # GOOGLE_API_KEY (not committed)
└── .env.example
```

## App Flow

```
Upload/Paste → Preview (1-4 images) → Submit → Loading → Results
```

1. User uploads or pastes Canvas grade screenshots (supports multiple)
2. Preview shows thumbnails with add/remove buttons
3. User clicks "Submit" to analyze
4. Backend calls Gemini API for each image
5. Frontend merges results and displays grade + final calculator

## Environment Variables

```bash
# .env (in project root)
GOOGLE_API_KEY=your_gemini_api_key
PORT=3001
```

Get free Gemini API key: https://aistudio.google.com/apikey

## Key Features

- **Multi-screenshot support**: Upload up to 4 images, merged automatically
- **Paste from clipboard**: Ctrl+V / Cmd+V to paste screenshots
- **Rate limiting**: 5 requests/minute per IP
- **User-friendly errors**: Technical errors hidden from users
- **"What do I need" calculator**: Target grade → required final score

## API Endpoint

```
POST /api/analyze
Content-Type: multipart/form-data
Body: screenshot (file)

Response: {
  success: boolean,
  data?: GradeData,
  error?: string
}
```
