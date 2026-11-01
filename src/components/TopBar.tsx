import React from 'react';

export type ActiveTab = 'studio' | 'history';

interface TopBarProps {
  activeTab: ActiveTab;
  historyCount: number;
  onSelectTab: (tab: ActiveTab) => void;
  onFocusPrompt: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  historyCount,
  onSelectTab,
  onFocusPrompt,
  onScrollToSection,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E6E2DA]">
      <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('studio');
          }}
          className="text-xl font-bold tracking-tight text-[#141413] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9381E]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Atelier Lumina
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav aria-label="Primary Navigation" className="flex items-center gap-6 text-sm font-medium text-[#57544E]">
          <button
            type="button"
            onClick={() => onSelectTab('studio')}
            aria-current={activeTab === 'studio' ? 'page' : undefined}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'studio'
                ? 'text-[#141413] border-[#D9381E] font-semibold'
                : 'border-transparent hover:text-[#141413]'
            }`}
          >
            Create Studio
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('history')}
            aria-current={activeTab === 'history' ? 'page' : undefined}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 tabular-nums ${
              activeTab === 'history'
                ? 'text-[#141413] border-[#D9381E] font-semibold'
                : 'border-transparent hover:text-[#141413]'
            }`}
          >
            History ({historyCount})
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('studio');
              setTimeout(() => onScrollToSection('gallery-upload-section'), 50);
            }}
            className="hidden sm:inline-block py-1 border-b-2 border-transparent hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            Gallery Upload
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('studio');
              setTimeout(() => onScrollToSection('prompt-guide-section'), 50);
            }}
            className="hidden md:inline-block py-1 border-b-2 border-transparent hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
          >
            Prompt Guide
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelectTab('studio');
              setTimeout(() => onFocusPrompt(), 50);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#141413] rounded-lg hover:bg-[#2B2A28] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9381E]"
          >
            New Image Prompt
          </button>
        </div>
      </div>
    </header>
  );
};
