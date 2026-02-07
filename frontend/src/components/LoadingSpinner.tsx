import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  progress?: {
    current: number;
    total: number;
  };
}

export function LoadingSpinner({
  message = 'Analyzing your grades...',
  progress
}: LoadingSpinnerProps) {
  const progressMessage = progress && progress.total > 1
    ? `Analyzing screenshot ${progress.current} of ${progress.total}...`
    : message;

  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : null;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
        <div className="relative p-4 rounded-full bg-primary-500/10">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>

      <p className="mt-6 text-lg text-slate-300 animate-pulse">{progressMessage}</p>

      {/* Progress bar for multiple images */}
      {progress && progress.total > 1 && (
        <div className="mt-4 w-64">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">
            {progressPercent}% complete
          </p>
        </div>
      )}

      {!progress && (
        <p className="mt-2 text-sm text-slate-500">This usually takes 5-10 seconds</p>
      )}
    </div>
  );
}
