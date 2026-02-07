import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Analyzing your grades...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
        <div className="relative p-4 rounded-full bg-primary-500/10">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>
      <p className="mt-6 text-lg text-slate-300 animate-pulse">{message}</p>
      <p className="mt-2 text-sm text-slate-500">This usually takes 5-10 seconds</p>
    </div>
  );
}
