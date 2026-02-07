import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, Clipboard } from 'lucide-react';

interface ScreenshotUploadProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function ScreenshotUpload({ onFilesAdded, disabled = false }: ScreenshotUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded]
  );

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        onFilesAdded(imageFiles);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onFilesAdded, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300 ease-out
        ${isDragActive
          ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
          : 'border-slate-600 hover:border-primary-500 hover:bg-slate-800/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div className={`
          p-4 rounded-full
          ${isDragActive ? 'bg-primary-500/20' : 'bg-slate-700/50'}
          transition-colors duration-300
        `}>
          {isDragActive ? (
            <Image className="w-10 h-10 text-primary-400" />
          ) : (
            <Upload className="w-10 h-10 text-slate-400" />
          )}
        </div>

        <div>
          <p className="text-lg font-medium text-white mb-1">
            {isDragActive ? 'Drop your screenshots here' : 'Upload your Canvas grades'}
          </p>
          <p className="text-sm text-slate-400">
            Drag & drop, click to select, or paste from clipboard
          </p>
          <p className="text-sm text-slate-500 mt-1">
            You can upload multiple screenshots if your grades don't fit in one
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-500">
            <Clipboard className="w-3 h-3" />
            <span>Ctrl+V / Cmd+V to paste</span>
          </div>
        </div>
      </div>
    </div>
  );
}
