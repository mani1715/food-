import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { uploadImageToSupabase } from '../../lib/supabase/storage';

interface DragDropImagePickerProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
  multiple?: boolean;
  onMultipleChange?: (urls: string[]) => void;
}

export const DragDropImagePicker: React.FC<DragDropImagePickerProps> = ({
  label = 'Upload Photo',
  value,
  onChange,
  helperText = 'Drag & drop image from computer, select from files/folder, or enter an image URL.',
  multiple = false,
  onMultipleChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
      setIsProcessing(false);
      return;
    }

    const readPromises = imageFiles.map(
      (file) =>
        new Promise<string>(async (resolve) => {
          if (isSupabaseConfigured()) {
            try {
              const url = await uploadImageToSupabase(file);
              if (url) {
                resolve(url);
                return;
              }
            } catch (err) {
              console.warn('Supabase image upload failed, falling back to local base64:', err);
            }
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve((event.target?.result as string) || '');
          };
          reader.onerror = () => {
            resolve('');
          };
          reader.readAsDataURL(file);
        })
    );

    try {
      const urls = await Promise.all(readPromises);
      const validUrls = urls.filter((u) => Boolean(u) && u.trim().length > 0);
      setIsProcessing(false);

      if (validUrls.length > 0) {
        if (multiple && onMultipleChange) {
          onMultipleChange(validUrls);
        }
        onChange(validUrls[0]);
        setUrlInput(validUrls[0]);
      }
    } catch (err) {
      console.error('Error processing files:', err);
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      const cleanUrl = urlInput.trim();
      onChange(cleanUrl);
      if (multiple && onMultipleChange) {
        onMultipleChange([cleanUrl]);
      }
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-2 text-left">
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">{label}</label>}

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-black text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Drag & Drop / Files</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-black text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Image URL</span>
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 select-none ${
            isDragging
              ? 'border-black bg-neutral-100 scale-[1.01]'
              : 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100/70 hover:border-neutral-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onClick={(e) => e.stopPropagation()}
            onChange={handleFileSelect}
            className="hidden"
          />

          {value && !multiple ? (
            <div className="relative group w-full flex items-center justify-center">
              <img
                src={value}
                alt="Selected preview"
                className="max-h-36 rounded-2xl object-contain border border-neutral-200 shadow-sm bg-white p-1"
              />
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                <span>Click or Drop to replace</span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white border border-neutral-200 flex items-center justify-center shadow-sm">
                <UploadCloud className="w-6 h-6 text-black" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-black">
                  {isDragging ? 'Drop images here to upload!' : 'Drag & drop image here or click to browse files'}
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">Supports JPG, PNG, WEBP, SVG from your device</p>
              </div>
            </>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex items-center justify-center gap-2.5 text-xs font-extrabold text-black shadow-modal">
              <Loader2 className="w-5 h-5 text-black animate-spin" />
              <span>Uploading & Processing Photos...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyUrl();
              }
            }}
            placeholder="Paste image URL (https://...)"
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black bg-white"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle shrink-0"
          >
            Apply
          </button>
        </div>
      )}

      {helperText && <p className="text-[11px] text-neutral-500">{helperText}</p>}
    </div>
  );
};
