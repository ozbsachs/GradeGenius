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
