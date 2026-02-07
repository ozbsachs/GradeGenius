import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image } from 'lucide-react';

interface ScreenshotUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export function ScreenshotUpload({ onUpload, isLoading }: ScreenshotUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isLoading,
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
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
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
            {isDragActive ? 'Drop your screenshot here' : 'Upload your Canvas grades'}
          </p>
          <p className="text-sm text-slate-400">
            Drag & drop or click to select - PNG, JPG, WebP
          </p>
        </div>
      </div>
    </div>
  );
}
