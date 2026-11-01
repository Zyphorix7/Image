import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  SAMPLE_GALLERY_REFERENCES,
  type UploadedReferenceImage,
} from '../utils/studioLogic';

interface GalleryUploadSectionProps {
  uploadedImage: UploadedReferenceImage | null;
  onSelectImage: (image: UploadedReferenceImage | null) => void;
}

export const GalleryUploadSection: React.FC<GalleryUploadSectionProps> = ({
  uploadedImage,
  onSelectImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileProcess = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, or SVG) from your gallery.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image exceeds 15 MB limit. Please select a smaller gallery image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      const base64Data = commaIndex >= 0 ? result.slice(commaIndex + 1) : '';
      if (!base64Data) {
        setUploadError('Could not read the selected gallery image.');
        return;
      }
      onSelectImage({
        name: file.name,
        mimeType: file.type || 'image/png',
        dataUrl: result,
        base64Data,
      });
    };
    reader.onerror = () => {
      setUploadError('Error reading file from gallery.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <section
      id="gallery-upload-section"
      aria-labelledby="gallery-upload-heading"
      className="bg-white border border-[#E6E2DA] rounded-2xl p-6"
    >
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h2
          id="gallery-upload-heading"
          className="text-lg font-semibold text-[#141413]"
        >
          01. Upload Image from Gallery
        </h2>
        <span className="text-xs text-[#6E6A63] whitespace-nowrap shrink-0">
          Optional reference · PNG · JPG · WebP
        </span>
      </div>

      <p className="text-sm text-[#57544E] mb-4 leading-relaxed">
        Upload a photo or sketch from your gallery to guide structure, lighting, or subject matter, or leave empty to synthesize purely from your text prompt.
      </p>

      <input
        ref={fileInputRef}
        id="gallery-file-input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="Upload image from gallery"
      />

      {!uploadedImage ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl p-5 transition-colors ${
            dragActive
              ? 'border-[#D9381E] bg-[#D9381E]/5'
              : 'border-[#CFC9BE] bg-[#FBF9F5] hover:border-[#141413]/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#E6E2DA] flex items-center justify-center text-[#141413] shrink-0">
                <Upload className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#141413]">
                  Select an image from your device gallery
                </p>
                <p className="text-xs text-[#6E6A63] mt-0.5">
                  Drag and drop here, or browse local photo files up to 15 MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold text-[#141413] bg-white border border-[#CFC9BE] rounded-lg hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#D9381E]"
            >
              Browse Gallery
            </button>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[#6E6A63]">
              Or load a studio reference image:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {SAMPLE_GALLERY_REFERENCES.map((sample, idx) => {
                const shortLabel =
                  idx === 0
                    ? 'Travertine Arch'
                    : idx === 1
                    ? 'Porcelain Flora'
                    : 'Portrait Lighting';
                return (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => {
                      setUploadError(null);
                      onSelectImage(sample);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-[#43403C] bg-white border border-[#E6E2DA] rounded-md hover:border-[#141413] hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
                  >
                    Use {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#E6E2DA] bg-[#FBF9F5] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#E6E2DA] bg-[#141413] shrink-0 relative">
              <img
                src={uploadedImage.dataUrl}
                alt={`Uploaded gallery reference ${uploadedImage.name}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#141413] truncate">
                {uploadedImage.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#6E6A63] mt-1">
                <span>Gallery Reference Active</span>
                <span aria-hidden="true">·</span>
                <span>{uploadedImage.mimeType.replace('image/', '').toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium text-[#141413] bg-white border border-[#CFC9BE] rounded-lg hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
            >
              Change Image
            </button>
            <button
              type="button"
              onClick={() => onSelectImage(null)}
              aria-label={`Remove uploaded gallery image ${uploadedImage.name}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B42318] bg-white border border-[#FECDCA] rounded-lg hover:bg-[#FEF3F2] transition-colors whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p role="alert" className="mt-3 text-xs font-medium text-[#B42318]">
          {uploadError}
        </p>
      )}
    </section>
  );
};
