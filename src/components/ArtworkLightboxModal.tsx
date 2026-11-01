import React, { useEffect } from 'react';
import { X, Download, ArrowUpRight } from 'lucide-react';
import type { ArtworkItem } from '../utils/studioLogic';

interface ArtworkLightboxModalProps {
  artwork: ArtworkItem | null;
  onClose: () => void;
  onLoadIntoStudio: (artwork: ArtworkItem) => void;
}

export const ArtworkLightboxModal: React.FC<ArtworkLightboxModalProps> = ({
  artwork,
  onClose,
  onLoadIntoStudio,
}) => {
  useEffect(() => {
    if (!artwork) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [artwork, onClose]);

  if (!artwork) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = artwork.imageUrl;
    const ext = artwork.imageUrl.startsWith('data:image/svg') ? 'svg' : 'png';
    const slug = artwork.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    link.download = `${slug || 'atelier-lumina-artwork'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-artwork-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF9F5] border border-[#E6E2DA] rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#E6E2DA] bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#6E6A63] tabular-nums">
              <span>{artwork.category}</span>
              <span aria-hidden="true">·</span>
              <span>{artwork.aspectRatio}</span>
              <span aria-hidden="true">·</span>
              <span>{artwork.dimensionsLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{artwork.createdAt}</span>
            </div>
            <h2
              id="lightbox-artwork-title"
              className="text-xl font-semibold text-[#141413] truncate mt-0.5"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {artwork.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close artwork viewer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#141413] bg-[#FBF9F5] border border-[#CFC9BE] rounded-lg hover:bg-[#EFECE5] transition-colors whitespace-nowrap shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 bg-[#141413] flex items-center justify-center p-6 min-h-[360px] max-h-[600px]">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[540px] object-contain rounded-lg"
            />
          </div>

          <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-[#E6E2DA]">
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-[#6E6A63]">
                  User Prompt
                </h3>
                <p className="text-sm text-[#141413] mt-1 leading-relaxed">
                  &ldquo;{artwork.prompt}&rdquo;
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#6E6A63]">
                  AI Studio Answer &amp; Curatorial Notes
                </h3>
                <p className="text-sm text-[#3F3D39] mt-1 leading-relaxed">
                  {artwork.answer}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#6E6A63] mb-2">
                  Chrominance &amp; Surface Palette
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {artwork.palette.map((hex, idx) => (
                    <div key={`${hex}-${idx}`} className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-md border border-black/15"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-mono text-[#57544E] tabular-nums">
                        {hex}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#E6E2DA] flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#141413] rounded-lg hover:bg-[#2B2A28] transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Download Artwork
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadIntoStudio(artwork);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#141413] bg-[#FBF9F5] border border-[#CFC9BE] rounded-lg hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                Edit in Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
