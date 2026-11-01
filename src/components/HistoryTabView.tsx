import React from 'react';
import { Search, Trash2, Maximize2, ArrowUpRight } from 'lucide-react';
import {
  SUPPORTED_ASPECT_RATIOS,
  type ArtworkItem,
} from '../utils/studioLogic';

interface HistoryTabViewProps {
  items: ArtworkItem[];
  totalCount: number;
  searchQuery: string;
  aspectFilter: string;
  onChangeSearchQuery: (q: string) => void;
  onChangeAspectFilter: (ratio: string) => void;
  onInspectArtwork: (artwork: ArtworkItem) => void;
  onLoadIntoStudio: (artwork: ArtworkItem) => void;
  onDeleteArtwork: (id: string) => void;
  onSwitchToStudio: () => void;
}

export const HistoryTabView: React.FC<HistoryTabViewProps> = ({
  items,
  totalCount,
  searchQuery,
  aspectFilter,
  onChangeSearchQuery,
  onChangeAspectFilter,
  onInspectArtwork,
  onLoadIntoStudio,
  onDeleteArtwork,
  onSwitchToStudio,
}) => {
  return (
    <section aria-labelledby="history-archive-heading" className="py-8">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E2DA]">
        <div>
          <p className="text-xs text-[#6E6A63] mb-1 tabular-nums">
            Artwork Archive · {totalCount} Saved Creations
          </p>
          <h1
            id="history-archive-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141413]"
          >
            Generated Artwork History
          </h1>
          <p className="text-sm text-[#57544E] mt-2 max-w-2xl">
            Browse every image synthesized in your studio session along with its prompt, aspect ratio, and AI response. Click any work to inspect in high resolution or reload into the studio.
          </p>
        </div>

        {/* Search & Interactive Aspect Ratio Filter Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <label htmlFor="history-search-input" className="sr-only">
              Search artwork history
            </label>
            <Search
              className="w-4 h-4 text-[#6E6A63] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="history-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Search prompts, titles, styles..."
              className="w-full sm:w-64 pl-9 pr-3.5 py-2 text-xs text-[#141413] bg-white border border-[#CFC9BE] rounded-lg placeholder:text-[#8A857D] focus:outline-none focus:border-[#141413]"
            />
          </div>

          <div
            role="group"
            aria-label="Filter History by Aspect Ratio"
            className="flex items-center gap-1 p-1 bg-[#EFECE5] rounded-lg overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => onChangeAspectFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                aspectFilter === 'all'
                  ? 'bg-white text-[#141413] shadow-xs'
                  : 'text-[#57544E] hover:text-[#141413]'
              }`}
            >
              All Ratios
            </button>
            {SUPPORTED_ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                type="button"
                onClick={() => onChangeAspectFilter(ratio.value)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  aspectFilter === ratio.value
                    ? 'bg-white text-[#141413] shadow-xs'
                    : 'text-[#57544E] hover:text-[#141413]'
                }`}
              >
                {ratio.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Artwork Grid */}
      {items.length === 0 ? (
        <div className="my-12 bg-white border border-[#E6E2DA] rounded-2xl p-12 text-center max-w-xl mx-auto">
          <h2 className="text-xl font-semibold text-[#141413]">
            No matching artworks in history
          </h2>
          <p className="text-sm text-[#57544E] mt-2">
            {totalCount === 0
              ? 'You have not generated any images yet. Return to the Create Studio to synthesize your first artwork.'
              : 'No saved artworks match your current search or aspect ratio filter.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {totalCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onChangeSearchQuery('');
                  onChangeAspectFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-[#141413] bg-[#FBF9F5] border border-[#CFC9BE] rounded-lg hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={onSwitchToStudio}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#D9381E] rounded-lg hover:bg-[#BE2E16] transition-colors whitespace-nowrap shrink-0"
            >
              Go to Create Studio
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="history-artwork-grid"
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col justify-between transition-colors hover:border-[#141413]/40"
            >
              <div>
                {/* Artwork Thumbnail */}
                <div className="relative h-60 bg-[#141413] overflow-hidden border-b border-[#E6E2DA]">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    onClick={() => onInspectArtwork(item)}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                  />
                </div>

                {/* Card Copy */}
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6E6A63] tabular-nums">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.aspectRatio}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.createdAt}</span>
                    {item.usedReference && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Gallery Ref</span>
                      </>
                    )}
                  </div>

                  <h2
                    className="text-lg font-semibold text-[#141413] mt-1.5"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {item.title}
                  </h2>

                  <p className="text-xs text-[#57544E] mt-2 line-clamp-2">
                    <span className="font-semibold text-[#141413]">Prompt:</span> &ldquo;{item.prompt}&rdquo;
                  </p>

                  <p className="text-xs text-[#3F3D39] mt-2 line-clamp-3 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-[#FBF9F5] border-t border-[#E6E2DA] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onInspectArtwork(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#141413] bg-white border border-[#CFC9BE] rounded-md hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Maximize2 className="w-3 h-3" aria-hidden="true" />
                    Inspect
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadIntoStudio(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#141413] bg-white border border-[#CFC9BE] rounded-md hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
                  >
                    <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                    Load in Studio
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteArtwork(item.id)}
                  aria-label={`Delete '${item.title}' from history`}
                  className="p-1.5 text-xs text-[#6E6A63] hover:text-[#B42318] rounded-md transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
