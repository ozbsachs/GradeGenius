import { useMemo } from 'react';
import { X, Plus, Send } from 'lucide-react';

interface ImagePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  onAddMore: () => void;
  onSubmit: () => void;
  maxImages?: number;
}

export function ImagePreview({
  files,
  onRemove,
  onAddMore,
  onSubmit,
  maxImages = 4,
}: ImagePreviewProps) {
  // Create object URLs for previews
  const previews = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  // Clean up object URLs when component unmounts
  // Note: In production, you'd want useEffect cleanup

  const canAddMore = files.length < maxImages;

  return (
    <div className="space-y-6">
      {/* Thumbnails Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {previews.map((preview, index) => (
          <div
            key={index}
            className="relative group aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700"
          >
            <img
              src={preview}
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Remove button */}
            <button
              onClick={() => onRemove(index)}
              className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {/* Image number badge */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white">
              {index + 1} of {files.length}
            </div>
          </div>
        ))}

        {/* Add More Button */}
        {canAddMore && (
          <button
            onClick={onAddMore}
            className="aspect-video flex flex-col items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-800 border-2 border-dashed border-slate-600 hover:border-primary-500 rounded-xl transition-all"
          >
            <Plus className="w-8 h-8 text-slate-400" />
            <span className="text-sm text-slate-400">Add more</span>
          </button>
        )}
      </div>

      {/* Info text */}
      <p className="text-center text-sm text-slate-500">
        {files.length} screenshot{files.length !== 1 ? 's' : ''} ready
        {canAddMore && ` • You can add up to ${maxImages - files.length} more`}
      </p>

      {/* Submit Button */}
      <button
        onClick={onSubmit}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
      >
        <Send className="w-5 h-5" />
        Analyze {files.length > 1 ? `${files.length} Screenshots` : 'Screenshot'}
      </button>
    </div>
  );
}
