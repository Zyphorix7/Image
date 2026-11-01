/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TopBar, type ActiveTab } from './components/TopBar';
import { GalleryUploadSection } from './components/GalleryUploadSection';
import { PromptCreationSection } from './components/PromptCreationSection';
import { ActiveArtworkStage } from './components/ActiveArtworkStage';
import { HistoryTabView } from './components/HistoryTabView';
import { ArtworkLightboxModal } from './components/ArtworkLightboxModal';
import {
  INITIAL_SHOWCASE_ARTWORKS,
  validateCreationInput,
  filterAndSortHistory,
  detectArtDirection,
  generateProceduralArtworkSvg,
  getDimensionsForAspectRatio,
  type AspectRatioOption,
  type UploadedReferenceImage,
  type ArtworkItem,
} from './utils/studioLogic';

const STORAGE_KEY = 'atelier_lumina_history_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [historyItems, setHistoryItems] = useState<ArtworkItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return [...INITIAL_SHOWCASE_ARTWORKS];
  });

  const [activeArtworkId, setActiveArtworkId] = useState<string>(
    () => historyItems[0]?.id ?? INITIAL_SHOWCASE_ARTWORKS[0].id
  );
  const [uploadedImage, setUploadedImage] = useState<UploadedReferenceImage | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('1:1');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // History filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aspectFilter, setAspectFilter] = useState<string>('all');

  // Lightbox state
  const [lightboxArtwork, setLightboxArtwork] = useState<ArtworkItem | null>(null);

  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyItems));
    } catch {
      // ignore storage quota errors
    }
  }, [historyItems]);

  const activeArtwork: ArtworkItem = useMemo(() => {
    return (
      historyItems.find((item) => item.id === activeArtworkId) ??
      historyItems[0] ??
      INITIAL_SHOWCASE_ARTWORKS[0]
    );
  }, [historyItems, activeArtworkId]);

  const filteredHistory = useMemo(() => {
    return filterAndSortHistory(historyItems, searchQuery, aspectFilter);
  }, [historyItems, searchQuery, aspectFilter]);

  const handleFocusPrompt = () => {
    promptInputRef.current?.focus();
    promptInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmitCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validateCreationInput(prompt, aspectRatio, uploadedImage);
    if (!validation.valid) {
      setValidationError(validation.error ?? 'Please enter a valid prompt.');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/create-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: validation.sanitizedPrompt,
          aspectRatio: validation.aspectRatio,
          referenceImage: uploadedImage
            ? {
                name: uploadedImage.name,
                mimeType: uploadedImage.mimeType,
                base64Data: uploadedImage.base64Data,
                dataUrl: uploadedImage.dataUrl,
              }
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.artwork) {
        throw new Error(data?.error || 'Could not synthesize image.');
      }

      const created: ArtworkItem = data.artwork;
      setHistoryItems((prev) => [created, ...prev]);
      setActiveArtworkId(created.id);
    } catch {
      // Client-side resilient fallback if network fails
      const cleanPrompt = validation.sanitizedPrompt;
      const ratio = validation.aspectRatio;
      const hasRef = Boolean(uploadedImage);
      const analysis = detectArtDirection(cleanPrompt, hasRef, uploadedImage?.name);
      const { dimensions } = getDimensionsForAspectRatio(ratio);
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const fallbackArtwork: ArtworkItem = {
        id: `art-${Date.now()}`,
        title: analysis.title,
        prompt: cleanPrompt,
        answer: analysis.answer,
        imageUrl: generateProceduralArtworkSvg({
          prompt: cleanPrompt,
          aspectRatio: ratio,
          title: analysis.title,
          palette: analysis.palette,
          motif: analysis.motif,
          usedReference: hasRef,
        }),
        aspectRatio: ratio,
        dimensionsLabel: dimensions,
        category: analysis.category,
        createdAt: `Today, ${timeLabel}`,
        timestampMs: Date.now(),
        usedReference: hasRef,
        referenceName: uploadedImage?.name,
        referencePreviewUrl: uploadedImage?.dataUrl,
        palette: analysis.palette,
      };

      setHistoryItems((prev) => [fallbackArtwork, ...prev]);
      setActiveArtworkId(fallbackArtwork.id);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadIntoStudio = (artwork: ArtworkItem) => {
    setPrompt(artwork.prompt);
    setAspectRatio(artwork.aspectRatio);
    setActiveArtworkId(artwork.id);
    setValidationError(null);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArtwork = async (id: string) => {
    setHistoryItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (activeArtworkId === id && next.length > 0) {
        setActiveArtworkId(next[0].id);
      }
      return next;
    });
    try {
      await fetch(`/api/history/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // ignore network error
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#141413]">
      <TopBar
        activeTab={activeTab}
        historyCount={historyItems.length}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }}
        onFocusPrompt={handleFocusPrompt}
        onScrollToSection={handleScrollToSection}
      />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {activeTab === 'studio' ? (
          <>
            {/* Editorial Studio Header */}
            <div className="mb-8 pb-6 border-b border-[#E6E2DA] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs text-[#6E6A63] mb-1.5">
                  AI Visual Synthesis Studio · Gallery Reference + Prompt Engine
                </p>
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#141413] leading-[1.12]">
                  Create any image from a gallery upload and a single prompt.
                </h1>
              </div>

              <div className="flex items-center gap-6 text-xs text-[#57544E] tabular-nums shrink-0">
                <div>
                  <span className="block font-semibold text-[#141413] text-sm">
                    {historyItems.length} Artworks
                  </span>
                  <span>Saved in History</span>
                </div>
                <span aria-hidden="true" className="text-[#CFC9BE]">
                  /
                </span>
                <div>
                  <span className="block font-semibold text-[#141413] text-sm">
                    5 Aspect Formats
                  </span>
                  <span>1:1 · 16:9 · 4:3 · 3:4 · 9:16</span>
                </div>
              </div>
            </div>

            {/* Primary 2-Column Studio Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left Column: Section 01 (Gallery Upload) + Section 02 (Prompt & Single Create Image Action) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <GalleryUploadSection
                  uploadedImage={uploadedImage}
                  onSelectImage={(img) => setUploadedImage(img)}
                />

                <PromptCreationSection
                  prompt={prompt}
                  aspectRatio={aspectRatio}
                  isCreating={isCreating}
                  validationError={validationError}
                  hasUploadedReference={Boolean(uploadedImage)}
                  promptInputRef={promptInputRef}
                  onChangePrompt={(val) => {
                    setPrompt(val);
                    if (validationError) setValidationError(null);
                  }}
                  onChangeAspectRatio={setAspectRatio}
                  onSubmitCreateImage={handleSubmitCreateImage}
                />
              </div>

              {/* Right Column: Live Artwork Stage & AI Studio Answer */}
              <div className="lg:col-span-7">
                <ActiveArtworkStage
                  artwork={activeArtwork}
                  isCreating={isCreating}
                  onInspectFullscreen={(art) => setLightboxArtwork(art)}
                  onUseAsReference={(refImg) => {
                    setUploadedImage(refImg);
                    handleScrollToSection('gallery-upload-section');
                  }}
                  onOpenHistoryTab={() => {
                    setActiveTab('history');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            </div>

            {/* Recent Creations Strip (Quick Preview of History) */}
            <section
              aria-labelledby="recent-creations-heading"
              className="mt-14 pt-10 border-t border-[#E6E2DA]"
            >
              <div className="flex items-baseline justify-between gap-4 mb-6">
                <div>
                  <h2
                    id="recent-creations-heading"
                    className="text-xl font-semibold text-[#141413]"
                  >
                    Recent Studio History
                  </h2>
                  <p className="text-xs text-[#6E6A63] mt-0.5">
                    Select any previously generated artwork to view on the studio stage or open the full History archive.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('history');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-[#141413] underline underline-offset-4 hover:text-[#D9381E] transition-colors whitespace-nowrap shrink-0"
                >
                  Open Full History Tab ({historyItems.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {historyItems.slice(0, 4).map((item) => {
                  const isSelected = item.id === activeArtwork.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveArtworkId(item.id)}
                      className={`text-left bg-white rounded-xl overflow-hidden border transition-colors flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#D9381E] ring-1 ring-[#D9381E]'
                          : 'border-[#E6E2DA] hover:border-[#141413]/40'
                      }`}
                    >
                      <div className="h-40 w-full bg-[#141413] overflow-hidden border-b border-[#E6E2DA]">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#6E6A63] tabular-nums">
                          <span>{item.aspectRatio}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{item.category}</span>
                        </div>
                        <p
                          className="text-sm font-semibold text-[#141413] truncate mt-1"
                          style={{ fontFamily: 'var(--font-serif)' }}
                        >
                          {item.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Prompt & Reference Guide Section */}
            <section
              id="prompt-guide-section"
              aria-labelledby="prompt-guide-heading"
              className="mt-14 pt-10 border-t border-[#E6E2DA]"
            >
              <div className="max-w-2xl mb-6">
                <p className="text-xs text-[#6E6A63] mb-1">
                  Synthesis Methodology
                </p>
                <h2
                  id="prompt-guide-heading"
                  className="text-2xl font-semibold text-[#141413]"
                >
                  How to Craft Prompts for Any Visual Discipline
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#6E6A63] mb-1">
                    01 · Subject &amp; Materiality
                  </p>
                  <h3 className="text-base font-semibold text-[#141413]">
                    Specify Tactile Surfaces
                  </h3>
                  <p className="text-xs text-[#57544E] mt-2 leading-relaxed">
                    Include concrete material cues—such as raw travertine, unglazed bisque porcelain, brushed titanium, or linen—to ground any subject in physical reality.
                  </p>
                </div>

                <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#6E6A63] mb-1">
                    02 · Gallery Image Reference
                  </p>
                  <h3 className="text-base font-semibold text-[#141413]">
                    Pair Upload with Direction
                  </h3>
                  <p className="text-xs text-[#57544E] mt-2 leading-relaxed">
                    Upload an image from your gallery in Section 01, then use Section 02 to describe how the AI should reinterpret its lighting, palette, or architectural setting.
                  </p>
                </div>

                <div className="bg-white border border-[#E6E2DA] rounded-xl p-5">
                  <p className="text-xs text-[#6E6A63] mb-1">
                    03 · Answer &amp; Archive
                  </p>
                  <h3 className="text-base font-semibold text-[#141413]">
                    Review Synthesis Notes in History
                  </h3>
                  <p className="text-xs text-[#57544E] mt-2 leading-relaxed">
                    Every generated artwork includes an AI studio response explaining the composition and is preserved automatically in the History tab for comparison or download.
                  </p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <HistoryTabView
            items={filteredHistory}
            totalCount={historyItems.length}
            searchQuery={searchQuery}
            aspectFilter={aspectFilter}
            onChangeSearchQuery={setSearchQuery}
            onChangeAspectFilter={setAspectFilter}
            onInspectArtwork={(art) => setLightboxArtwork(art)}
            onLoadIntoStudio={handleLoadIntoStudio}
            onDeleteArtwork={handleDeleteArtwork}
            onSwitchToStudio={() => setActiveTab('studio')}
          />
        )}
      </main>

      <footer className="border-t border-[#E6E2DA] bg-[#FBF9F5] mt-16">
        <div className="max-w-[1360px] mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6A63]">
          <p>Atelier Lumina — AI Visual Synthesis &amp; Artwork Archive</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
            >
              Create Studio
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="hover:text-[#141413] transition-colors whitespace-nowrap shrink-0 tabular-nums"
            >
              History ({historyItems.length})
            </button>
          </div>
        </div>
      </footer>

      <ArtworkLightboxModal
        artwork={lightboxArtwork}
        onClose={() => setLightboxArtwork(null)}
        onLoadIntoStudio={handleLoadIntoStudio}
      />
    </div>
  );
}
