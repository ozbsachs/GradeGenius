import { useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GradeDisplay } from './components/GradeDisplay';
import { FinalCalculator } from './components/FinalCalculator';
import { analyzeScreenshot } from './api/client';
import type { GradeData } from './types/grades';

type AppState = 'upload' | 'loading' | 'results' | 'error';

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setState('loading');
    setError(null);

    try {
      const response = await analyzeScreenshot(file);

      if (response.success && response.data) {
        setGradeData(response.data);
        setState('results');
      } else {
        setError(response.error || 'Failed to analyze screenshot');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('upload');
    setGradeData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-primary-300 font-medium">AI-Powered Grade Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Grade<span className="text-primary-400">Genius</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Upload your Canvas grades screenshot and instantly see what you need on your final
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {state === 'upload' && (
            <ScreenshotUpload onUpload={handleUpload} isLoading={false} />
          )}

          {state === 'loading' && <LoadingSpinner />}

          {state === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {state === 'results' && gradeData && (
            <>
              <GradeDisplay data={gradeData} />
              <FinalCalculator data={gradeData} />

              <div className="text-center pt-4">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Analyze Another Class
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>Built with Claude AI - Your data is never stored</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
