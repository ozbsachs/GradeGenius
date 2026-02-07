import type { GradeData, Assignment, Category } from '../types/grades';

/**
 * Normalize assignment name for comparison
 */
function normalizeAssignmentName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Check if two assignments are the same
 */
function isSameAssignment(a: Assignment, b: Assignment): boolean {
  return normalizeAssignmentName(a.name) === normalizeAssignmentName(b.name);
}

/**
 * Pick the better assignment (one with more data)
 */
function pickBetterAssignment(a: Assignment, b: Assignment): Assignment {
  // Prefer the one with a score over null
  if (a.score !== null && b.score === null) return a;
  if (b.score !== null && a.score === null) return b;
  // If both have scores, prefer higher points possible (more complete data)
  if (a.pointsPossible >= b.pointsPossible) return a;
  return b;
}

/**
 * Merge multiple GradeData results into one
 */
export function mergeGradeData(results: GradeData[]): GradeData {
  if (results.length === 0) {
    throw new Error('No grade data to merge');
  }

  if (results.length === 1) {
    return results[0];
  }

  // Start with first result as base
  const base = results[0];
  const mergedAssignments: Assignment[] = [...base.assignments];
  const mergedCategories: Category[] = [...base.categories];

  // Merge in subsequent results
  for (let i = 1; i < results.length; i++) {
    const current = results[i];

    // Merge assignments
    for (const assignment of current.assignments) {
      const existingIndex = mergedAssignments.findIndex((a) =>
        isSameAssignment(a, assignment)
      );

      if (existingIndex === -1) {
        // New assignment, add it
        mergedAssignments.push(assignment);
      } else {
        // Duplicate, keep the better one
        mergedAssignments[existingIndex] = pickBetterAssignment(
          mergedAssignments[existingIndex],
          assignment
        );
      }
    }

    // Merge categories (by name)
    for (const category of current.categories) {
      const exists = mergedCategories.some(
        (c) => c.name.toLowerCase() === category.name.toLowerCase()
      );
      if (!exists) {
        mergedCategories.push(category);
      }
    }
  }

  // Recalculate current grade from merged assignments
  const gradedAssignments = mergedAssignments.filter((a) => a.score !== null);
  const totalPoints = gradedAssignments.reduce((sum, a) => sum + (a.score ?? 0), 0);
  const totalPossible = gradedAssignments.reduce((sum, a) => sum + a.pointsPossible, 0);
  const currentGrade = totalPossible > 0 ? (totalPoints / totalPossible) * 100 : 0;

  // Determine letter grade
  const gradingScale = base.gradingScale;
  let letterGrade = 'F';
  const grades = Object.entries(gradingScale).sort((a, b) => b[1] - a[1]);
  for (const [letter, minScore] of grades) {
    if (currentGrade >= minScore) {
      letterGrade = letter;
      break;
    }
  }

  return {
    className: base.className,
    instructor: base.instructor,
    currentGrade,
    letterGrade,
    assignments: mergedAssignments,
    categories: mergedCategories,
    gradingScale: base.gradingScale,
  };
}
