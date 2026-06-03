import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useChartAnalysis } from '../hooks/useChartAnalysis';
import { LoadingSpinner } from './LoadingSpinner';
import { SignalCard } from './SignalCard';

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export function ScreenshotUpload() {
  const { state, dispatch } = useAppContext();
  const { analyzing, error, result, analyze, reset } = useChartAnalysis();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert('Unsupported file type. Please use JPEG, PNG, GIF, or WebP.');
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        reset();

        const base64 = dataUrl.split(',')[1];
        const mediaType = file.type;
        const apiKey = state.settings.apiKeys.anthropic;

        const signal = await analyze(base64, mediaType, apiKey, dataUrl);
        if (signal) {
          dispatch({ type: 'ADD_SIGNAL', payload: signal });
        }
      };
      reader.readAsDataURL(file);
    },
    [analyze, dispatch, reset, state.settings.apiKeys.anthropic]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'));
      if (item) {
        const file = item.getAsFile();
        if (file) processFile(file);
      }
    },
    [processFile]
  );

  const handleClear = () => {
    setPreview(null);
    reset();
  };

  const needsApiKey = !state.settings.apiKeys.anthropic;

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      <div>
        <h2 className="text-xl font-bold text-white mb-1">📷 Chart Pattern Analysis</h2>
        <p className="text-slate-400 text-sm">
          Upload a chart screenshot — Claude Vision analyzes patterns, trend, and generates trading signals.
        </p>
      </div>

      {/* API key warning */}
      {needsApiKey && (
        <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-semibold">Anthropic API Key Required</p>
            <p className="text-yellow-400/70 text-sm">
              Add your API key in{' '}
              <button
                onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
                className="underline hover:text-yellow-300"
              >
                Settings
              </button>{' '}
              to use chart analysis.
            </p>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!preview && !analyzing && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragOver
              ? 'border-cyan-500 bg-cyan-900/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-white font-semibold mb-1">Drop chart screenshot here</p>
          <p className="text-slate-500 text-sm mb-6">or paste (Ctrl+V) · PNG, JPG, GIF up to 5MB</p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={needsApiKey}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-700/30 hover:bg-cyan-700/50 text-cyan-400 border border-cyan-700/40 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={needsApiKey}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Loading state */}
      {analyzing && (
        <div className="flex flex-col items-center justify-center h-48 bg-slate-900/50 rounded-xl border border-slate-800 gap-4">
          <LoadingSpinner size="lg" text="Claude Vision is analyzing your chart..." />
          {preview && (
            <img src={preview} alt="Analyzing" className="max-h-24 rounded-lg opacity-40 object-contain" />
          )}
        </div>
      )}

      {/* Error */}
      {error && !analyzing && (
        <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-800/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-400 font-semibold">Analysis Failed</p>
            <p className="text-red-400/70 text-sm">{error}</p>
          </div>
          <button onClick={handleClear} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview + result */}
      {preview && !analyzing && result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Analysis Result</h3>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <img
              src={preview}
              alt="Chart"
              className="w-full max-h-64 object-contain rounded-xl border border-slate-700 bg-slate-900"
            />
            <SignalCard signal={result} />
          </div>
        </div>
      )}
    </div>
  );
}
