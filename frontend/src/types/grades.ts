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
