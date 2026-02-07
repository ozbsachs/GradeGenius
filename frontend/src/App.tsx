import { useState, useCallback, useRef } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { ScreenshotUpload } from './components/ScreenshotUpload';
import { ImagePreview } from './components/ImagePreview';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GradeDisplay } from './components/GradeDisplay';
import { FinalCalculator } from './components/FinalCalculator';
import { analyzeMultipleScreenshots, MultiAnalysisProgress } from './api/client';
import type { GradeData } from './types/grades';

type AppState = 'upload' | 'preview' | 'loading' | 'results' | 'error';

const MAX_IMAGES = 4;

function App() {
  const [state, setState] = useState<AppState>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [gradeData, setGradeData] = useState<GradeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<MultiAnalysisProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      // Limit to max images
      return combined.slice(0, MAX_IMAGES);
    });
    setState('preview');
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setState('upload');
      }
      return updated;
    });
  }, []);

  const handleAddMore = useCallback(() => {
    // Trigger file input click
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setState('loading');
    setError(null);
    setProgress(null);

    try {
      const response = await analyzeMultipleScreenshots(files, (p) => {
        setProgress(p);
      });

      if (response.success && response.data) {
        setGradeData(response.data);
        setState('results');
      } else {
        setError(response.error || 'Failed to analyze screenshots');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setState('error');
    }

    setProgress(null);
  };

  const handleReset = () => {
    setState('upload');
    setFiles([]);
    setGradeData(null);
    setError(null);
    setProgress(null);
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

        {/* Hidden file input for "Add More" functionality */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const newFiles = Array.from(e.target.files || []);
            if (newFiles.length > 0) {
              handleFilesAdded(newFiles);
            }
            // Reset input so same file can be selected again
            e.target.value = '';
          }}
        />

        {/* Main Content */}
        <div className="space-y-6">
          {state === 'upload' && (
            <ScreenshotUpload onFilesAdded={handleFilesAdded} />
          )}

          {state === 'preview' && (
            <ImagePreview
              files={files}
              onRemove={handleRemoveFile}
              onAddMore={handleAddMore}
              onSubmit={handleSubmit}
              maxImages={MAX_IMAGES}
            />
          )}

          {state === 'loading' && (
            <LoadingSpinner progress={progress || undefined} />
          )}

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
          <p>Built with AI - Your data is never stored</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
