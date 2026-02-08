import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GradeData } from '../types/grades.js';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000; // 2 seconds

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate') || msg.includes('quota') || msg.includes('resource exhausted');
  }
  return false;
}

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
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
        { text: EXTRACTION_PROMPT },
      ]);

      const response = result.response;
      const text = response.text();

      // Parse JSON from response (handle potential markdown wrapping)
      let jsonStr = text.trim();
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Only retry on rate limit errors
      if (isRateLimitError(error) && attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt); // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }

      // Non-rate-limit error or final attempt, throw immediately
      throw lastError;
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('Failed after retries');
}
