import React, { useState } from 'react';
import { Maximize2, Download, Layers } from 'lucide-react';
import type { ArtworkItem, UploadedReferenceImage } from '../utils/studioLogic';

interface ActiveArtworkStageProps {
  artwork: ArtworkItem;
  isCreating: boolean;
  onInspectFullscreen: (artwork: ArtworkItem) => void;
  onUseAsReference: (reference: UploadedReferenceImage) => void;
  onOpenHistoryTab: () => void;
}

export const ActiveArtworkStage: React.FC<ActiveArtworkStageProps> = ({
  artwork,
  isCreating,
  onInspectFullscreen,
  onUseAsReference,
  onOpenHistoryTab,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

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

  const handleUseCurrentAsReference = () => {
    const commaIdx = artwork.imageUrl.indexOf(',');
    const header = commaIdx >= 0 ? artwork.imageUrl.slice(0, commaIdx) : '';
    const payload = commaIdx >= 0 ? artwork.imageUrl.slice(commaIdx + 1) : '';
    const isBase64 = header.includes(';base64');
    const mimeMatch = header.match(/data:([^;,]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/svg+xml';
    const base64Data = isBase64
      ? payload
      : btoa(unescape(encodeURIComponent(decodeURIComponent(payload))));

    onUseAsReference({
      name: `${artwork.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`,
      mimeType,
      dataUrl: artwork.imageUrl,
      base64Data,
    });
  };

  return (
    <div className="bg-white border border-[#E6E2DA] rounded-2xl p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header Metadata (Zero-Pill Unboxed Discipline) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6E2DA]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6A63] tabular-nums">
              <span>{artwork.category}</span>
              <span aria-hidden="true">·</span>
              <span>{artwork.aspectRatio}</span>
              <span aria-hidden="true">·</span>
              <span>{artwork.dimensionsLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{artwork.createdAt}</span>
              {artwork.usedReference && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Guided by {artwork.referenceName || 'Gallery Image'}</span>
                </>
              )}
            </div>
            <h2
              className="text-2xl font-semibold text-[#141413] mt-1"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {artwork.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onInspectFullscreen(artwork)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141413] bg-[#FBF9F5] border border-[#CFC9BE] rounded-lg hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              Inspect
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141413] bg-[#FBF9F5] border border-[#CFC9BE] rounded-lg hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Download
            </button>
          </div>
        </div>

        {/* Visual Canvas Frame */}
        <div className="mt-5 relative rounded-xl overflow-hidden bg-[#141413] border border-[#E6E2DA] flex items-center justify-center min-h-[340px] max-h-[520px]">
          {isCreating ? (
            <div className="w-full h-[380px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#191817] via-[#282420] to-[#141413] text-[#FBF9F5]">
              <div className="w-10 h-10 rounded-full border-2 border-[#D9381E] border-t-transparent animate-spin mb-4" />
              <p className="text-base font-medium" style={{ fontFamily: 'var(--font-serif)' }}>
                Composing visual geometry &amp; studio answer...
              </p>
              <p className="text-xs text-[#A8A29A] mt-1 max-w-md">
                Analyzing prompt structure, tonal palette, and aspect proportions
              </p>
            </div>
          ) : !imgFailed ? (
            <img
              key={artwork.id}
              src={artwork.imageUrl}
              alt={artwork.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              onClick={() => onInspectFullscreen(artwork)}
              className="w-full h-full max-h-[500px] object-contain cursor-zoom-in transition-opacity duration-200"
            />
          ) : (
            <div
              className="w-full h-[380px] flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: `linear-gradient(135deg, ${artwork.palette[0]}, ${artwork.palette[2]})`,
              }}
            >
              <p className="text-lg font-semibold text-white">{artwork.title}</p>
              <p className="text-xs text-white/80 mt-1">{artwork.prompt}</p>
            </div>
          )}
        </div>

        {/* AI Studio Answer & Prompt Breakdown */}
        <div className="mt-5 pt-5 border-t border-[#E6E2DA] space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-[#141413] tracking-wide">
              AI Studio Response &amp; Synthesis Notes
            </h3>
            <p className="text-sm text-[#3F3D39] mt-1.5 leading-relaxed">
              {artwork.answer}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6E6A63]">
            <p className="truncate max-w-xl" title={artwork.prompt}>
              <span className="font-medium text-[#141413]">Prompt:</span> &ldquo;{artwork.prompt}&rdquo;
            </p>

            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1" aria-label="Extracted Tonal Palette">
                {artwork.palette.map((hex, index) => (
                  <span
                    key={`${hex}-${index}`}
                    title={hex}
                    className="w-4 h-4 rounded-sm border border-black/15 inline-block"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleUseCurrentAsReference}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#141413] hover:text-[#D9381E] transition-colors whitespace-nowrap shrink-0"
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                Use as Gallery Reference
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onOpenHistoryTab}
                className="text-xs font-medium text-[#141413] underline underline-offset-4 hover:text-[#D9381E] transition-colors whitespace-nowrap shrink-0"
              >
                View All in History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
