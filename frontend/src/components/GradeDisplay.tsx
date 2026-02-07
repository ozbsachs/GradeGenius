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
