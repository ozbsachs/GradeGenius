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
