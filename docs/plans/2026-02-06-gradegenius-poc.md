# GradeGenius POC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working proof-of-concept where users upload a Canvas grade screenshot, Claude extracts grade data, and the app displays current grade + "what score do I need on the final" calculator.

**Architecture:** Monorepo with two packages - a Vite+React+Tailwind frontend and a minimal Express backend. Frontend handles UI/UX, backend proxies Claude API calls (keeps API key secure). No auth, no database - pure stateless POC.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, Express.js, Claude API (claude-3-5-sonnet), Axios

---

## Project Structure

```
gradegenius/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ScreenshotUpload.tsx
│   │   │   ├── GradeDisplay.tsx
│   │   │   ├── FinalCalculator.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── types/
│   │   │   └── grades.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── analyze.ts
│   │   ├── services/
│   │   │   └── claude.ts
│   │   └── types/
│   │       └── grades.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json (workspace root)
└── .gitignore
```

---

## Task 1: Initialize Monorepo Structure

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Create root package.json with workspaces**

```json
{
  "name": "gradegenius",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend",
    "build": "npm run build --workspace=frontend && npm run build --workspace=backend"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 2: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.claude/
```

**Step 3: Create .env.example**

```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

**Step 4: Commit**

```bash
git add package.json .gitignore .env.example
git commit -m "chore: initialize monorepo structure"
```

---

## Task 2: Set Up Backend Express Server

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`

**Step 1: Create backend/package.json**

```json
{
  "name": "gradegenius-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/multer": "^1.4.12",
    "@types/node": "^22.13.1",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

**Step 2: Create backend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create backend/src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Step 4: Test the server starts**

Run: `cd backend && npm install && npm run dev`
Expected: "Server running on http://localhost:3001"

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat: add backend express server skeleton"
```

---

## Task 3: Create Shared Grade Types

**Files:**
- Create: `backend/src/types/grades.ts`

**Step 1: Define grade data types**

```typescript
export interface Assignment {
  name: string;
  category: string;
  score: number | null;  // null if not yet graded
  pointsPossible: number;
  weight?: number;
  dueDate?: string;
  isDropped?: boolean;
}

export interface Category {
  name: string;
  weight: number;  // percentage (0-100)
  dropLowest?: number;
}

export interface GradeData {
  className: string;
  instructor?: string;
  currentGrade: number;  // percentage
  letterGrade: string;
  assignments: Assignment[];
  categories: Category[];
  gradingScale: Record<string, number>;  // e.g., { "A": 90, "B": 80 }
}

export interface AnalysisResponse {
  success: boolean;
  data?: GradeData;
  error?: string;
}

export interface FinalCalculation {
  targetGrade: string;
  targetPercentage: number;
  currentGrade: number;
  finalWeight: number;
  neededScore: number;
  isPossible: boolean;
}
```

**Step 2: Commit**

```bash
git add backend/src/types/grades.ts
git commit -m "feat: add grade data type definitions"
```

---

## Task 4: Implement Claude Analysis Service

**Files:**
- Create: `backend/src/services/claude.ts`

**Step 1: Create Claude service with screenshot analysis**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { GradeData } from '../types/grades.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXTRACTION_PROMPT = `You are a grade extraction assistant. Analyze this Canvas/LMS grade screenshot and extract all grade information.

Return a JSON object with this exact structure:
{
  "className": "Course name from screenshot",
  "instructor": "Instructor name if visible",
  "currentGrade": 85.5,
  "letterGrade": "B",
  "assignments": [
    {
      "name": "Assignment name",
      "category": "Category like Homework, Exams, etc",
      "score": 45,
      "pointsPossible": 50,
      "dueDate": "2026-02-01"
    }
  ],
  "categories": [
    {
      "name": "Homework",
      "weight": 20,
      "dropLowest": 1
    }
  ],
  "gradingScale": {
    "A": 90,
    "B": 80,
    "C": 70,
    "D": 60,
    "F": 0
  }
}

Rules:
- Extract ALL visible assignments
- Use null for score if assignment is ungraded
- Infer category weights from the UI if shown
- Use standard grading scale if not visible
- Be precise with numbers - don't round
- Return ONLY valid JSON, no markdown or explanation`;

export async function analyzeScreenshot(imageBase64: string, mimeType: string): Promise<GradeData> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonStr = textContent.text.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  const gradeData: GradeData = JSON.parse(jsonStr.trim());
  return gradeData;
}
```

**Step 2: Commit**

```bash
git add backend/src/services/claude.ts
git commit -m "feat: implement Claude screenshot analysis service"
```

---

## Task 5: Create Analyze Endpoint with File Upload

**Files:**
- Create: `backend/src/routes/analyze.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create analyze route with multer**

```typescript
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
```

**Step 2: Update index.ts to use analyze route**

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRouter from './routes/analyze.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', analyzeRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Step 3: Test with curl (manual test)**

Run backend with valid ANTHROPIC_API_KEY in .env, then:
```bash
curl -X POST http://localhost:3001/api/analyze \
  -F "screenshot=@test-screenshot.png"
```
Expected: JSON response with grade data

**Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat: add /api/analyze endpoint for screenshot upload"
```

---

## Task 6: Set Up Frontend with Vite + React + Tailwind

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/App.tsx`

**Step 1: Create frontend/package.json**

```json
{
  "name": "gradegenius-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "lucide-react": "^0.474.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.3.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.1",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.0.11"
  }
}
```

**Step 2: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 3: Create frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**Step 4: Create frontend/tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};
```

**Step 5: Create frontend/postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 6: Create frontend/index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GradeGenius - AI Grade Calculator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 7: Create frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  @apply bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen text-white;
}
```

**Step 8: Create frontend/src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 9: Create frontend/src/App.tsx (placeholder)**

```tsx
function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">GradeGenius</h1>
    </div>
  );
}

export default App;
```

**Step 10: Install and test**

Run: `cd frontend && npm install && npm run dev`
Expected: Vite dev server at http://localhost:5173 showing "GradeGenius"

**Step 11: Commit**

```bash
git add frontend/
git commit -m "feat: initialize frontend with Vite, React, Tailwind"
```

---

## Task 7: Create Frontend Type Definitions

**Files:**
- Create: `frontend/src/types/grades.ts`

**Step 1: Create matching types (same as backend)**

```typescript
export interface Assignment {
  name: string;
  category: string;
  score: number | null;
  pointsPossible: number;
  weight?: number;
  dueDate?: string;
  isDropped?: boolean;
}

export interface Category {
  name: string;
  weight: number;
  dropLowest?: number;
}

export interface GradeData {
  className: string;
  instructor?: string;
  currentGrade: number;
  letterGrade: string;
  assignments: Assignment[];
  categories: Category[];
  gradingScale: Record<string, number>;
}

export interface AnalysisResponse {
  success: boolean;
  data?: GradeData;
  error?: string;
}

export interface FinalCalculation {
  targetGrade: string;
  targetPercentage: number;
  currentGrade: number;
  finalWeight: number;
  neededScore: number;
  isPossible: boolean;
}
```

**Step 2: Commit**

```bash
git add frontend/src/types/
git commit -m "feat: add frontend type definitions"
```

---

## Task 8: Create API Client

**Files:**
- Create: `frontend/src/api/client.ts`

**Step 1: Create axios client with upload function**

```typescript
import axios from 'axios';
import type { AnalysisResponse } from '../types/grades';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for Claude processing
});

export async function analyzeScreenshot(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('screenshot', file);

  const response = await api.post<AnalysisResponse>('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export default api;
```

**Step 2: Commit**

```bash
git add frontend/src/api/
git commit -m "feat: add API client for screenshot analysis"
```

---

## Task 9: Create Screenshot Upload Component

**Files:**
- Create: `frontend/src/components/ScreenshotUpload.tsx`

**Step 1: Create dropzone upload component**

```tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image } from 'lucide-react';

interface ScreenshotUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function ScreenshotUpload({ onUpload, isLoading }: ScreenshotUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300 ease-out
        ${isDragActive
          ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
          : 'border-slate-600 hover:border-primary-500 hover:bg-slate-800/50'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div className={`
          p-4 rounded-full
          ${isDragActive ? 'bg-primary-500/20' : 'bg-slate-700/50'}
          transition-colors duration-300
        `}>
          {isDragActive ? (
            <Image className="w-10 h-10 text-primary-400" />
          ) : (
            <Upload className="w-10 h-10 text-slate-400" />
          )}
        </div>

        <div>
          <p className="text-lg font-medium text-white mb-1">
            {isDragActive ? 'Drop your screenshot here' : 'Upload your Canvas grades'}
          </p>
          <p className="text-sm text-slate-400">
            Drag & drop or click to select • PNG, JPG, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/ScreenshotUpload.tsx
git commit -m "feat: add screenshot upload dropzone component"
```

---

## Task 10: Create Loading Spinner Component

**Files:**
- Create: `frontend/src/components/LoadingSpinner.tsx`

**Step 1: Create animated loading component**

```tsx
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Analyzing your grades...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
        <div className="relative p-4 rounded-full bg-primary-500/10">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>
      <p className="mt-6 text-lg text-slate-300 animate-pulse">{message}</p>
      <p className="mt-2 text-sm text-slate-500">This usually takes 5-10 seconds</p>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/LoadingSpinner.tsx
git commit -m "feat: add loading spinner component"
```

---

## Task 11: Create Grade Display Component

**Files:**
- Create: `frontend/src/components/GradeDisplay.tsx`

**Step 1: Create grade visualization component**

```tsx
import { BookOpen, TrendingUp, Award } from 'lucide-react';
import type { GradeData } from '../types/grades';

interface GradeDisplayProps {
  data: GradeData;
}

function getGradeColor(grade: number): string {
  if (grade >= 90) return 'text-emerald-400';
  if (grade >= 80) return 'text-blue-400';
  if (grade >= 70) return 'text-yellow-400';
  if (grade >= 60) return 'text-orange-400';
  return 'text-red-400';
}

function getGradeBg(grade: number): string {
  if (grade >= 90) return 'bg-emerald-500/10 border-emerald-500/30';
  if (grade >= 80) return 'bg-blue-500/10 border-blue-500/30';
  if (grade >= 70) return 'bg-yellow-500/10 border-yellow-500/30';
  if (grade >= 60) return 'bg-orange-500/10 border-orange-500/30';
  return 'bg-red-500/10 border-red-500/30';
}

export function GradeDisplay({ data }: GradeDisplayProps) {
  const gradedAssignments = data.assignments.filter((a) => a.score !== null);
  const totalPoints = gradedAssignments.reduce((sum, a) => sum + (a.score ?? 0), 0);
  const totalPossible = gradedAssignments.reduce((sum, a) => sum + a.pointsPossible, 0);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`rounded-2xl border p-6 ${getGradeBg(data.currentGrade)}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">{data.className}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl font-bold ${getGradeColor(data.currentGrade)}`}>
                {data.currentGrade.toFixed(1)}%
              </span>
              <span className={`text-3xl font-semibold ${getGradeColor(data.currentGrade)}`}>
                {data.letterGrade}
              </span>
            </div>
          </div>
          <div className="text-right text-slate-400">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Current Standing</span>
            </div>
            <p className="text-sm mt-1">
              {totalPoints} / {totalPossible} points
            </p>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      {data.categories.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Category Weights
          </h3>
          <div className="space-y-3">
            {data.categories.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <span className="text-slate-300">{category.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${category.weight}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-12 text-right">
                    {category.weight}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300">
            Assignments ({gradedAssignments.length} graded)
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50 max-h-64 overflow-y-auto">
          {data.assignments.map((assignment, idx) => (
            <div
              key={idx}
              className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{assignment.name}</p>
                <p className="text-xs text-slate-500">{assignment.category}</p>
              </div>
              <div className="text-right ml-4">
                {assignment.score !== null ? (
                  <>
                    <p className="text-sm font-medium text-white">
                      {assignment.score} / {assignment.pointsPossible}
                    </p>
                    <p className={`text-xs ${getGradeColor((assignment.score / assignment.pointsPossible) * 100)}`}>
                      {((assignment.score / assignment.pointsPossible) * 100).toFixed(0)}%
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Not graded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/GradeDisplay.tsx
git commit -m "feat: add grade display visualization component"
```

---

## Task 12: Create Final Calculator Component

**Files:**
- Create: `frontend/src/components/FinalCalculator.tsx`

**Step 1: Create "what do I need on the final" calculator**

```tsx
import { useState, useMemo } from 'react';
import { Calculator, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import type { GradeData, FinalCalculation } from '../types/grades';

interface FinalCalculatorProps {
  data: GradeData;
}

export function FinalCalculator({ data }: FinalCalculatorProps) {
  const [targetGrade, setTargetGrade] = useState<string>('A');
  const [finalWeight, setFinalWeight] = useState<number>(20);

  const calculation = useMemo((): FinalCalculation => {
    const targetPercentage = data.gradingScale[targetGrade] ?? 90;
    const currentGrade = data.currentGrade;
    const currentWeight = 100 - finalWeight;

    // Formula: (target - current * currentWeight/100) / (finalWeight/100)
    const neededScore = (targetPercentage - (currentGrade * currentWeight / 100)) / (finalWeight / 100);

    return {
      targetGrade,
      targetPercentage,
      currentGrade,
      finalWeight,
      neededScore: Math.max(0, neededScore),
      isPossible: neededScore <= 100 && neededScore >= 0,
    };
  }, [targetGrade, finalWeight, data]);

  const gradeOptions = Object.keys(data.gradingScale).sort((a, b) => {
    return data.gradingScale[b] - data.gradingScale[a];
  });

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-2xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-white">What Do I Need on the Final?</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Target Grade Selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Target Grade</label>
          <div className="flex gap-2 flex-wrap">
            {gradeOptions.map((grade) => (
              <button
                key={grade}
                onClick={() => setTargetGrade(grade)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${targetGrade === grade
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }
                `}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Final Weight Slider */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Final Exam Weight: <span className="text-white font-medium">{finalWeight}%</span>
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={finalWeight}
            onChange={(e) => setFinalWeight(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-primary-500
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>
      </div>

      {/* Result Display */}
      <div className={`
        rounded-xl p-5 text-center
        ${calculation.isPossible
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-red-500/10 border border-red-500/30'
        }
      `}>
        {calculation.isPossible ? (
          <>
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Score Needed</span>
            </div>
            <p className="text-5xl font-bold text-white mb-2">
              {calculation.neededScore.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm">
              on your final to get a <span className="text-white font-semibold">{targetGrade}</span> ({calculation.targetPercentage}%)
            </p>
            {calculation.neededScore < 60 && (
              <div className="flex items-center justify-center gap-1 mt-3 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Looking good! Very achievable.</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Not Possible</span>
            </div>
            <p className="text-slate-300">
              You would need <span className="text-red-400 font-bold">{calculation.neededScore.toFixed(1)}%</span> on the final
            </p>
            <p className="text-slate-500 text-sm mt-1">
              Consider aiming for a {gradeOptions[gradeOptions.indexOf(targetGrade) + 1] || 'lower grade'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/FinalCalculator.tsx
git commit -m "feat: add final exam score calculator component"
```

---

## Task 13: Wire Up Main App Component

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Update App.tsx with full flow**

```tsx
import { useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GradeDisplay } from './components/GradeDisplay';
import { FinalCalculator } from './components/FinalCalculator';
import { analyzeScreenshot } from './api/client';
import type { GradeData } from './types/grades';

type AppState = 'upload' | 'loading' | 'results' | 'error';

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setState('loading');
    setError(null);

    try {
      const response = await analyzeScreenshot(file);

      if (response.success && response.data) {
        setGradeData(response.data);
        setState('results');
      } else {
        setError(response.error || 'Failed to analyze screenshot');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('upload');
    setGradeData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300 font-medium">AI-Powered Grade Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Grade<span className="text-primary-400">Genius</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Upload your Canvas grades screenshot and instantly see what you need on your final
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {state === 'upload' && (
            <ScreenshotUpload onUpload={handleUpload} isLoading={false} />
          )}

          {state === 'loading' && <LoadingSpinner />}

          {state === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {state === 'results' && gradeData && (
            <>
              <GradeDisplay data={gradeData} />
              <FinalCalculator data={gradeData} />

              <div className="text-center pt-4">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Analyze Another Class
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>Built with Claude AI • Your data is never stored</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
```

**Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire up main app with upload flow"
```

---

## Task 14: Install Dependencies and Test End-to-End

**Step 1: Install root dependencies**

Run: `npm install`

**Step 2: Create .env file with your API key**

Create `backend/.env`:
```
ANTHROPIC_API_KEY=your_actual_key_here
PORT=3001
```

**Step 3: Start both servers**

Run: `npm run dev`
Expected: Backend on :3001, frontend on :5173

**Step 4: Test the full flow**

1. Open http://localhost:5173
2. Upload a Canvas grades screenshot
3. Verify grade extraction and display
4. Test the final calculator

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: complete GradeGenius POC with full functionality"
```

---

## Task 15: Verification Checklist

Use **superpowers:verification-before-completion** to verify:

- [ ] Backend starts without errors
- [ ] Frontend builds without TypeScript errors
- [ ] Screenshot upload accepts images
- [ ] Claude API call succeeds with valid key
- [ ] Grade data displays correctly
- [ ] Final calculator computes correctly
- [ ] Error states display properly
- [ ] "Try Again" resets state correctly

---

## Deployment (Optional Next Step)

After verification, deploy:
- Frontend to Vercel: `cd frontend && npx vercel`
- Backend to Railway: Connect GitHub repo

---

**Plan complete and saved to `docs/plans/2026-02-06-gradegenius-poc.md`.**

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
