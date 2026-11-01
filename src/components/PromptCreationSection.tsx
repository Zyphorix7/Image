import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  SUPPORTED_ASPECT_RATIOS,
  type AspectRatioOption,
} from '../utils/studioLogic';

interface PromptCreationSectionProps {
  prompt: string;
  aspectRatio: AspectRatioOption;
  isCreating: boolean;
  validationError: string | null;
  hasUploadedReference: boolean;
  promptInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onChangePrompt: (value: string) => void;
  onChangeAspectRatio: (ratio: AspectRatioOption) => void;
  onSubmitCreateImage: (e: React.FormEvent) => void;
}

const QUICK_PROMPT_IDEAS: ReadonlyArray<{ label: string; prompt: string; ratio: AspectRatioOption }> = [
  {
    label: 'Minimalist Pavilion',
    prompt: 'A brutalist travertine stone and glass courtyard pavilion over reflective water at sunset, architectural digest photography.',
    ratio: '16:9',
  },
  {
    label: 'Botanical Sculpture',
    prompt: 'Macro studio photograph of a translucent porcelain orchid with brushed gold stems on dark volcanic basalt.',
    ratio: '1:1',
  },
  {
    label: 'Deep Cosmos Nebula',
    prompt: 'An astronomical observatory dome beneath a glowing crimson and cobalt nebula with a ringed exoplanet on the horizon.',
    ratio: '16:9',
  },
  {
    label: 'Artisan Espresso Study',
    prompt: 'Editorial culinary still life of a handcrafted stoneware espresso cup on warm linen with morning window shadows.',
    ratio: '4:3',
  },
];

export const PromptCreationSection: React.FC<PromptCreationSectionProps> = ({
  prompt,
  aspectRatio,
  isCreating,
  validationError,
  hasUploadedReference,
  promptInputRef,
  onChangePrompt,
  onChangeAspectRatio,
  onSubmitCreateImage,
}) => {
  return (
    <section
      aria-labelledby="prompt-creation-heading"
      className="bg-white border border-[#E6E2DA] rounded-2xl p-6"
    >
      <form onSubmit={onSubmitCreateImage} noValidate>
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <label
            id="prompt-creation-heading"
            htmlFor="studio-prompt-input"
            className="text-lg font-semibold text-[#141413] cursor-pointer"
             style={{ fontFamily: 'var(--font-display)' }}
          >
            02. Add a Prompt &amp; Create Image
          </label>
          <span className="text-xs text-[#6E6A63] tabular-nums whitespace-nowrap shrink-0">
            {prompt.trim().length} / 2000 chars
          </span>
        </div>

        <p className="text-sm text-[#57544E] mb-4 leading-relaxed">
          Describe any subject, artistic style, lighting mood, or question. The studio will answer your request and synthesize the corresponding artwork.
        </p>

        <div className="relative">
          <textarea
            ref={promptInputRef}
            id="studio-prompt-input"
            name="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            placeholder={
              hasUploadedReference
                ? 'Describe how to transform, restyle, or build upon your uploaded gallery image...'
                : 'Describe any image you want to create (e.g., A sunlit ceramic teapot on warm travertine stone at sunset)...'
            }
            disabled={isCreating}
            aria-invalid={Boolean(validationError)}
            aria-describedby={validationError ? 'prompt-validation-error' : undefined}
            className="w-full rounded-xl border border-[#CFC9BE] bg-[#FBF9F5] px-4 py-3.5 text-sm text-[#141413] placeholder:text-[#8A857D] focus:bg-white focus:border-[#141413] focus:outline-none transition-colors resize-y leading-relaxed"
          />
        </div>

        {validationError && (
          <p
            id="prompt-validation-error"
            role="alert"
            className="mt-2.5 text-xs font-medium text-[#B42318]"
          >
            {validationError}
          </p>
        )}

        {/* Quick prompt starters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#6E6A63] mr-1">Try a prompt:</span>
          {QUICK_PROMPT_IDEAS.map((idea) => (
            <button
              key={idea.label}
              type="button"
              disabled={isCreating}
              onClick={() => {
                onChangePrompt(idea.prompt);
                onChangeAspectRatio(idea.ratio);
              }}
              className="px-2.5 py-1 text-xs font-medium text-[#43403C] bg-[#FBF9F5] border border-[#E6E2DA] rounded-md hover:border-[#141413] hover:text-[#141413] transition-colors whitespace-nowrap shrink-0"
            >
              {idea.label}
            </button>
          ))}
        </div>

        {/* Aspect Ratio Selector */}
        <div className="mt-5 pt-5 border-t border-[#E6E2DA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-medium text-[#57544E]">
              Canvas Aspect Ratio
            </span>
            <div
              role="group"
              aria-label="Canvas Aspect Ratio"
              className="flex flex-wrap items-center gap-1.5 bg-[#FBF9F5] p-1 rounded-lg border border-[#E6E2DA]"
            >
              {SUPPORTED_ASPECT_RATIOS.map((item) => {
                const active = aspectRatio === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onChangeAspectRatio(item.value)}
                    aria-pressed={active}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#141413] text-white shadow-xs'
                        : 'text-[#57544E] hover:text-[#141413]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Single Unified Create Image Option */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-3.5 px-6 rounded-xl bg-[#D9381E] hover:bg-[#BE2E16] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141413]"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Synthesizing Artwork &amp; Answer...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Create Image</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
