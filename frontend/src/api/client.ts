import axios from 'axios';
import type { AnalysisResponse, GradeData } from '../types/grades';
import { mergeGradeData } from '../utils/mergeGrades';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s for AI processing
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

export interface MultiAnalysisProgress {
  current: number;
  total: number;
}

export async function analyzeMultipleScreenshots(
  files: File[],
  onProgress?: (progress: MultiAnalysisProgress) => void
): Promise<AnalysisResponse> {
  const results: GradeData[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    onProgress?.({ current: i + 1, total: files.length });

    try {
      const response = await analyzeScreenshot(files[i]);

      if (response.success && response.data) {
        results.push(response.data);
      } else {
        errors.push(response.error || `Failed to analyze image ${i + 1}`);
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `Error processing image ${i + 1}`);
    }
  }

  // If no results at all, return error
  if (results.length === 0) {
    return {
      success: false,
      error: errors.length > 0 ? errors[0] : 'Failed to analyze any images',
    };
  }

  // Merge results
  try {
    const mergedData = mergeGradeData(results);
    return {
      success: true,
      data: mergedData,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to merge grade data',
    };
  }
}

export default api;
