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
