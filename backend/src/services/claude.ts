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
