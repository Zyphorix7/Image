export type AspectRatioOption = '1:1' | '16:9' | '4:3' | '3:4' | '9:16';

export interface UploadedReferenceImage {
  dataUrl: string;
  base64Data: string;
  mimeType: string;
  name: string;
  width?: number;
  height?: number;
}

export interface ArtworkItem {
  id: string;
  title: string;
  prompt: string;
  answer: string;
  imageUrl: string;
  aspectRatio: AspectRatioOption;
  dimensionsLabel: string;
  category: string;
  createdAt: string;
  timestampMs: number;
  usedReference: boolean;
  referenceName?: string;
  referencePreviewUrl?: string;
  palette: [string, string, string, string];
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedPrompt: string;
  aspectRatio: AspectRatioOption;
}

export interface ArtDirectionAnalysis {
  title: string;
  category: string;
  answer: string;
  palette: [string, string, string, string];
  motif: 'architecture' | 'botanical' | 'portrait' | 'chronograph' | 'landscape' | 'cosmos' | 'culinary' | 'abstract';
}

export const SUPPORTED_ASPECT_RATIOS: ReadonlyArray<{
  value: AspectRatioOption;
  label: string;
  dimensions: string;
  width: number;
  height: number;
}> = [
  { value: '1:1', label: '1:1 Square', dimensions: '1024×1024', width: 1024, height: 1024 },
  { value: '16:9', label: '16:9 Cinema', dimensions: '1600×900', width: 1600, height: 900 },
  { value: '4:3', label: '4:3 Editorial', dimensions: '1200×900', width: 1200, height: 900 },
  { value: '3:4', label: '3:4 Portrait', dimensions: '900×1200', width: 900, height: 1200 },
  { value: '9:16', label: '9:16 Vertical', dimensions: '900×1600', width: 900, height: 1600 },
];

export function getDimensionsForAspectRatio(aspectRatio: AspectRatioOption): {
  width: number;
  height: number;
  dimensions: string;
} {
  const found = SUPPORTED_ASPECT_RATIOS.find((item) => item.value === aspectRatio);
  if (!found) {
    return { width: 1024, height: 1024, dimensions: '1024×1024' };
  }
  return { width: found.width, height: found.height, dimensions: found.dimensions };
}

export function validateCreationInput(
  prompt: unknown,
  aspectRatio: unknown,
  referenceImage?: Partial<UploadedReferenceImage> | null
): ValidationResult {
  const rawPrompt = typeof prompt === 'string' ? prompt.trim() : '';
  const validRatios = new Set<string>(SUPPORTED_ASPECT_RATIOS.map((r) => r.value));
  const resolvedRatio: AspectRatioOption =
    typeof aspectRatio === 'string' && validRatios.has(aspectRatio)
      ? (aspectRatio as AspectRatioOption)
      : '1:1';

  if (!rawPrompt) {
    return {
      valid: false,
      error: 'Please enter a descriptive prompt before creating an image.',
      sanitizedPrompt: '',
      aspectRatio: resolvedRatio,
    };
  }

  if (rawPrompt.length < 3) {
    return {
      valid: false,
      error: 'Prompt must be at least 3 characters long so the studio can interpret your subject.',
      sanitizedPrompt: rawPrompt,
      aspectRatio: resolvedRatio,
    };
  }

  if (rawPrompt.length > 2000) {
    return {
      valid: false,
      error: 'Prompt exceeds the 2,000-character studio limit. Please condense your description.',
      sanitizedPrompt: rawPrompt,
      aspectRatio: resolvedRatio,
    };
  }

  if (referenceImage) {
    const allowedMimePrefix = 'image/';
    if (
      typeof referenceImage.mimeType !== 'string' ||
      !referenceImage.mimeType.startsWith(allowedMimePrefix)
    ) {
      return {
        valid: false,
        error: 'The uploaded gallery file must be a valid image format (PNG, JPEG, WebP, or SVG).',
        sanitizedPrompt: rawPrompt,
        aspectRatio: resolvedRatio,
      };
    }
    if (typeof referenceImage.base64Data !== 'string' || referenceImage.base64Data.trim().length === 0) {
      return {
        valid: false,
        error: 'The uploaded gallery image data is empty or corrupted. Please re-select the image.',
        sanitizedPrompt: rawPrompt,
        aspectRatio: resolvedRatio,
      };
    }
  }

  return {
    valid: true,
    sanitizedPrompt: rawPrompt,
    aspectRatio: resolvedRatio,
  };
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function detectArtDirection(
  prompt: string,
  hasReferenceImage: boolean = false,
  referenceName?: string
): ArtDirectionAnalysis {
  const lower = prompt.toLowerCase();

  let motif: ArtDirectionAnalysis['motif'] = 'abstract';
  let category = 'Conceptual Synthesis';
  let palette: [string, string, string, string] = ['#191817', '#D9381E', '#E8D8C8', '#F6F3EC'];

  if (/(architect|pavilion|building|interior|brutalist|house|concrete|travertine|courtyard|bridge|city|tower)/.test(lower)) {
    motif = 'architecture';
    category = 'Architectural Study';
    palette = ['#1E2229', '#C89D7C', '#E5DCCB', '#F4EFE6'];
  } else if (/(flower|botan|plant|leaf|garden|porcelain|rose|orchid|forest|tree|nature|petal|ceramic|teapot|vessel)/.test(lower)) {
    motif = 'botanical';
    category = 'Botanical & Material';
    palette = ['#182620', '#7D9B84', '#DFC5A8', '#F6F2EA'];
  } else if (/(portrait|person|woman|man|face|character|artisan|director|model|fashion|profile|human|eyes)/.test(lower)) {
    motif = 'portrait';
    category = 'Editorial Portrait';
    palette = ['#1A1615', '#B85D3B', '#D9B99F', '#F5EFE8'];
  } else if (/(watch|clock|gear|chrono|machine|robot|car|engine|camera|mechanical|metal|titanium|hardware|device)/.test(lower)) {
    motif = 'chronograph';
    category = 'Precision Industrial';
    palette = ['#14181D', '#B88646', '#8B95A1', '#ECEFF2'];
  } else if (/(space|planet|galaxy|nebula|star|astronaut|moon|sci-fi|cyber|cosmos|orbit|eclipse|solar)/.test(lower)) {
    motif = 'cosmos';
    category = 'Astronomical & Sci-Fi';
    palette = ['#0D1322', '#D95338', '#496A9B', '#E8EEF5'];
  } else if (/(food|coffee|tea|cake|fruit|bread|wine|dine|kitchen|espresso|table|culinary|drink)/.test(lower)) {
    motif = 'culinary';
    category = 'Culinary Still Life';
    palette = ['#231915', '#C25934', '#DFB88F', '#FAF5EE'];
  } else if (/(mountain|ocean|sea|sunset|sunrise|desert|lake|river|sky|cloud|landscape|valley|beach|wave)/.test(lower)) {
    motif = 'landscape';
    category = 'Atmospheric Landscape';
    palette = ['#1B2632', '#D66846', '#E4B07A', '#F7F1E5'];
  } else {
    const seed = hashString(prompt);
    const palettes: Array<[string, string, string, string]> = [
      ['#191817', '#D9381E', '#D8C7B4', '#F6F3EC'],
      ['#142029', '#2E6F95', '#C9D6DF', '#F4F7F9'],
      ['#221924', '#B5485D', '#E2C6CC', '#F9F4F5'],
      ['#1C241E', '#4F7756', '#CFD8CE', '#F4F6F3'],
    ];
    palette = palettes[seed % palettes.length];
  }

  // Build concise editorial title from prompt
  const cleanedWords = prompt
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'with', 'from', 'into', 'that', 'this', 'for', 'create', 'image', 'make', 'picture', 'photo'].includes(w.toLowerCase()));

  const titleWords = cleanedWords.slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  const title = titleWords.length > 0 ? titleWords.join(' ') : 'Untitled Studio Synthesis';

  const referenceClause = hasReferenceImage
    ? ` Guided by your uploaded gallery reference${referenceName ? ` (${referenceName})` : ''}, the composition preserves key structural proportions and tonal anchors while re-interpreting the scene.`
    : '';

  const answer = `Created "${title}" as a ${category.toLowerCase()} composition.${referenceClause} The visual synthesis balances primary focal geometry against directional studio illumination (${palette[1]} and ${palette[2]} tonal accents over a ${palette[0]} structural ground), rendering your prompt "${prompt.slice(0, 140)}${prompt.length > 140 ? '...' : ''}" with crisp depth and tactile surface detail.`;

  return {
    title,
    category,
    answer,
    palette,
    motif,
  };
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateProceduralArtworkSvg(params: {
  prompt: string;
  aspectRatio: AspectRatioOption;
  title?: string;
  palette?: [string, string, string, string];
  motif?: ArtDirectionAnalysis['motif'];
  usedReference?: boolean;
}): string {
  const { width, height } = getDimensionsForAspectRatio(params.aspectRatio);
  const analysis = detectArtDirection(params.prompt, params.usedReference);
  const [darkTone, accentTone, midTone, lightTone] = params.palette ?? analysis.palette;
  const motif = params.motif ?? analysis.motif;
  const title = params.title ?? analysis.title;
  const seed = hashString(params.prompt + params.aspectRatio);

  const cx = Math.round(width * (0.42 + ((seed % 18) / 100)));
  const cy = Math.round(height * (0.44 + (((seed >> 4) % 16) / 100)));
  const minDim = Math.min(width, height);

  let motifLayer = '';

  if (motif === 'architecture') {
    const horizonY = Math.round(height * 0.65);
    const pavW = Math.round(width * 0.56);
    const pavH = Math.round(height * 0.34);
    const pavX = Math.round((width - pavW) / 2);
    const pavY = horizonY - pavH;
    motifLayer = `
      <rect x="0" y="${horizonY}" width="${width}" height="${height - horizonY}" fill="${darkTone}" opacity="0.92" />
      <circle cx="${Math.round(width * 0.72)}" cy="${Math.round(height * 0.28)}" r="${Math.round(minDim * 0.14)}" fill="${accentTone}" opacity="0.88" />
      <rect x="${pavX - 30}" y="${pavY - 18}" width="${pavW + 60}" height="20" fill="${lightTone}" />
      <rect x="${pavX}" y="${pavY}" width="${pavW}" height="${pavH}" fill="${midTone}" opacity="0.35" stroke="${lightTone}" stroke-width="3" />
      <line x1="${pavX + Math.round(pavW * 0.25)}" y1="${pavY}" x2="${pavX + Math.round(pavW * 0.25)}" y2="${horizonY}" stroke="${lightTone}" stroke-width="6" />
      <line x1="${pavX + Math.round(pavW * 0.55)}" y1="${pavY}" x2="${pavX + Math.round(pavW * 0.55)}" y2="${horizonY}" stroke="${lightTone}" stroke-width="6" />
      <line x1="${pavX + Math.round(pavW * 0.82)}" y1="${pavY}" x2="${pavX + Math.round(pavW * 0.82)}" y2="${horizonY}" stroke="${lightTone}" stroke-width="6" />
      <rect x="${pavX + 24}" y="${horizonY + 12}" width="${pavW - 48}" height="${Math.round(pavH * 0.45)}" fill="${accentTone}" opacity="0.22" />
      <line x1="0" y1="${horizonY}" x2="${width}" y2="${horizonY}" stroke="${lightTone}" stroke-width="2" opacity="0.7" />
    `;
  } else if (motif === 'botanical') {
    const r = Math.round(minDim * 0.22);
    motifLayer = `
      <rect x="${Math.round(width * 0.28)}" y="${Math.round(height * 0.68)}" width="${Math.round(width * 0.44)}" height="${Math.round(height * 0.18)}" rx="12" fill="${darkTone}" opacity="0.9" />
      <path d="M ${cx} ${Math.round(height * 0.72)} Q ${cx - 30} ${cy + 40} ${cx} ${cy - r}" stroke="${accentTone}" stroke-width="6" fill="none" />
      <ellipse cx="${cx - Math.round(r * 0.55)}" cy="${cy}" rx="${Math.round(r * 0.75)}" ry="${Math.round(r * 0.42)}" transform="rotate(-28 ${cx - Math.round(r * 0.55)} ${cy})" fill="${lightTone}" opacity="0.88" stroke="${midTone}" stroke-width="2" />
      <ellipse cx="${cx + Math.round(r * 0.55)}" cy="${cy - 10}" rx="${Math.round(r * 0.75)}" ry="${Math.round(r * 0.42)}" transform="rotate(28 ${cx + Math.round(r * 0.55)} ${cy - 10})" fill="${lightTone}" opacity="0.88" stroke="${midTone}" stroke-width="2" />
      <ellipse cx="${cx}" cy="${cy - Math.round(r * 0.45)}" rx="${Math.round(r * 0.48)}" ry="${Math.round(r * 0.82)}" fill="${midTone}" opacity="0.78" stroke="${lightTone}" stroke-width="2" />
      <circle cx="${cx}" cy="${cy - Math.round(r * 0.2)}" r="${Math.round(r * 0.22)}" fill="${accentTone}" opacity="0.9" />
    `;
  } else if (motif === 'portrait') {
    const headR = Math.round(minDim * 0.15);
    const centerX = Math.round(width * 0.5);
    const headY = Math.round(height * 0.38);
    motifLayer = `
      <polygon points="${Math.round(width * 0.15)},0 ${Math.round(width * 0.68)},0 ${Math.round(width * 0.88)},${height} ${Math.round(width * 0.32)},${height}" fill="${lightTone}" opacity="0.16" />
      <circle cx="${centerX + 40}" cy="${headY - 20}" r="${Math.round(headR * 1.45)}" fill="${accentTone}" opacity="0.75" />
      <path d="M ${centerX - Math.round(headR * 1.65)} ${Math.round(height * 0.88)} C ${centerX - Math.round(headR * 1.5)} ${headY + headR * 1.3}, ${centerX + Math.round(headR * 1.5)} ${headY + headR * 1.3}, ${centerX + Math.round(headR * 1.65)} ${Math.round(height * 0.88)} Z" fill="${darkTone}" />
      <circle cx="${centerX}" cy="${headY}" r="${headR}" fill="${midTone}" stroke="${lightTone}" stroke-width="3" />
      <path d="M ${centerX - headR} ${headY - 10} A ${headR} ${headR} 0 0 1 ${centerX + headR} ${headY - 10}" fill="${darkTone}" />
    `;
  } else if (motif === 'chronograph') {
    const outerR = Math.round(minDim * 0.29);
    const centerX = Math.round(width * 0.5);
    const centerY = Math.round(height * 0.48);
    motifLayer = `
      <circle cx="${centerX}" cy="${centerY}" r="${outerR}" fill="${darkTone}" stroke="${midTone}" stroke-width="10" />
      <circle cx="${centerX}" cy="${centerY}" r="${Math.round(outerR * 0.82)}" fill="none" stroke="${accentTone}" stroke-width="3" stroke-dasharray="12 8" />
      <circle cx="${centerX - Math.round(outerR * 0.34)}" cy="${centerY + 10}" r="${Math.round(outerR * 0.28)}" fill="none" stroke="${lightTone}" stroke-width="4" opacity="0.85" />
      <circle cx="${centerX + Math.round(outerR * 0.34)}" cy="${centerY - 12}" r="${Math.round(outerR * 0.24)}" fill="none" stroke="${accentTone}" stroke-width="4" opacity="0.9" />
      <line x1="${centerX}" y1="${centerY}" x2="${centerX + Math.round(outerR * 0.52)}" y2="${centerY - Math.round(outerR * 0.44)}" stroke="${lightTone}" stroke-width="6" stroke-linecap="round" />
      <line x1="${centerX}" y1="${centerY}" x2="${centerX - Math.round(outerR * 0.35)}" y2="${centerY - Math.round(outerR * 0.58)}" stroke="${accentTone}" stroke-width="4" stroke-linecap="round" />
      <circle cx="${centerX}" cy="${centerY}" r="12" fill="${accentTone}" stroke="${lightTone}" stroke-width="3" />
    `;
  } else if (motif === 'cosmos') {
    const planetR = Math.round(minDim * 0.23);
    motifLayer = `
      <circle cx="${Math.round(width * 0.22)}" cy="${Math.round(height * 0.24)}" r="3" fill="${lightTone}" opacity="0.9" />
      <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.19)}" r="4" fill="${lightTone}" opacity="0.75" />
      <circle cx="${Math.round(width * 0.65)}" cy="${Math.round(height * 0.74)}" r="2.5" fill="${lightTone}" opacity="0.8" />
      <ellipse cx="${cx}" cy="${cy}" rx="${Math.round(planetR * 1.9)}" ry="${Math.round(planetR * 0.42)}" transform="rotate(-18 ${cx} ${cy})" fill="none" stroke="${midTone}" stroke-width="8" opacity="0.65" />
      <circle cx="${cx}" cy="${cy}" r="${planetR}" fill="${accentTone}" />
      <circle cx="${cx - Math.round(planetR * 0.28)}" cy="${cy - Math.round(planetR * 0.2)}" r="${Math.round(planetR * 0.88)}" fill="${darkTone}" opacity="0.45" />
      <circle cx="${cx + Math.round(planetR * 1.25)}" cy="${cy - Math.round(planetR * 0.55)}" r="${Math.round(planetR * 0.24)}" fill="${lightTone}" />
    `;
  } else if (motif === 'landscape') {
    const h1 = Math.round(height * 0.52);
    const h2 = Math.round(height * 0.68);
    motifLayer = `
      <circle cx="${Math.round(width * 0.64)}" cy="${Math.round(height * 0.34)}" r="${Math.round(minDim * 0.16)}" fill="${accentTone}" opacity="0.92" />
      <polygon points="0,${height} 0,${h1} ${Math.round(width * 0.34)},${Math.round(height * 0.35)} ${Math.round(width * 0.68)},${h1} ${width},${Math.round(height * 0.38)} ${width},${height}" fill="${midTone}" opacity="0.85" />
      <polygon points="0,${height} 0,${h2} ${Math.round(width * 0.28)},${Math.round(height * 0.48)} ${Math.round(width * 0.62)},${h2} ${Math.round(width * 0.88)},${Math.round(height * 0.52)} ${width},${h2} ${width},${height}" fill="${darkTone}" opacity="0.95" />
      <line x1="0" y1="${Math.round(height * 0.78)}" x2="${width}" y2="${Math.round(height * 0.78)}" stroke="${lightTone}" stroke-width="2" opacity="0.45" />
    `;
  } else {
    const r1 = Math.round(minDim * 0.24);
    motifLayer = `
      <rect x="${Math.round(width * 0.18)}" y="${Math.round(height * 0.2)}" width="${Math.round(width * 0.64)}" height="${Math.round(height * 0.6)}" rx="24" fill="${darkTone}" opacity="0.18" stroke="${lightTone}" stroke-width="2" />
      <circle cx="${cx}" cy="${cy}" r="${r1}" fill="${accentTone}" opacity="0.88" />
      <circle cx="${cx + Math.round(r1 * 0.55)}" cy="${cy + Math.round(r1 * 0.25)}" r="${Math.round(r1 * 0.68)}" fill="${midTone}" opacity="0.78" />
      <rect x="${cx - Math.round(r1 * 0.85)}" y="${cy + Math.round(r1 * 0.35)}" width="${Math.round(r1 * 1.7)}" height="${Math.round(r1 * 0.38)}" rx="8" fill="${lightTone}" opacity="0.9" />
    `;
  }

  const safeTitle = escapeXml(title.slice(0, 38));
  const safeCategory = escapeXml(analysis.category.toUpperCase());

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${darkTone}" />
        <stop offset="55%" stop-color="${midTone}" />
        <stop offset="100%" stop-color="${lightTone}" />
      </linearGradient>
      <radialGradient id="glowGrad" cx="65%" cy="30%" r="60%">
        <stop offset="0%" stop-color="${accentTone}" stop-opacity="0.48" />
        <stop offset="100%" stop-color="${darkTone}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#glowGrad)" />
    <g opacity="0.14" stroke="${lightTone}" stroke-width="1">
      <line x1="${Math.round(width * 0.08)}" y1="0" x2="${Math.round(width * 0.08)}" y2="${height}" />
      <line x1="${Math.round(width * 0.92)}" y1="0" x2="${Math.round(width * 0.92)}" y2="${height}" />
      <line x1="0" y1="${Math.round(height * 0.1)}" x2="${width}" y2="${Math.round(height * 0.1)}" />
      <line x1="0" y1="${Math.round(height * 0.9)}" x2="${width}" y2="${Math.round(height * 0.9)}" />
    </g>
    ${motifLayer}
    <g transform="translate(${Math.round(width * 0.08)}, ${Math.round(height * 0.86)})">
      <text x="0" y="-22" fill="${lightTone}" opacity="0.78" font-family="monospace" font-size="${Math.max(12, Math.round(minDim * 0.015))}" letter-spacing="2">${safeCategory} · ${params.aspectRatio}</text>
      <text x="0" y="6" fill="${lightTone}" font-family=" Georgia, serif" font-size="${Math.max(20, Math.round(minDim * 0.032))}" font-weight="600">${safeTitle}</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_GALLERY_REFERENCES: ReadonlyArray<UploadedReferenceImage> = [
  {
    name: 'travertine-arch-study.svg',
    mimeType: 'image/svg+xml',
    dataUrl: generateProceduralArtworkSvg({
      prompt: 'Minimalist travertine stone arch in warm afternoon sunlight',
      aspectRatio: '4:3',
      title: 'Travertine Arch Study',
      motif: 'architecture',
    }),
    base64Data: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMzAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0U1RENDQiIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjE1MCIgcj0iOTAiIGZpbGw9IiNDO DlEN0MiLz48L3N2Zz4=',
  },
  {
    name: 'porcelain-botanical-vessel.svg',
    mimeType: 'image/svg+xml',
    dataUrl: generateProceduralArtworkSvg({
      prompt: 'Sculptural porcelain botanical flower with brushed brass stem',
      aspectRatio: '1:1',
      title: 'Porcelain Botanical Reference',
      motif: 'botanical',
    }),
    base64Data: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI0Y2RjJFQSIsLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIyMDAiIHI9IjExMCIgZmlsbD0iIzdEOUI4NCIvPjwvc3ZnPg==',
  },
  {
    name: 'atelier-portrait-lighting.svg',
    mimeType: 'image/svg+xml',
    dataUrl: generateProceduralArtworkSvg({
      prompt: 'High contrast studio portrait silhouette in warm window light',
      aspectRatio: '3:4',
      title: 'Atelier Window Light Reference',
      motif: 'portrait',
    }),
    base64Data: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMDAgNDAwIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzFBMTE2MTUiLz48Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNjAiIHI9IjcwIiBmaWxsPSIjQjg1RDNCIi8+PC9zdmc+',
  },
];

export const INITIAL_SHOWCASE_ARTWORKS: ReadonlyArray<ArtworkItem> = [
  {
    id: 'art-101',
    title: 'Kyoto Travertine Water Pavilion',
    prompt: 'Cinematic architectural photography of a minimalist travertine and glass pavilion floating over a still reflective courtyard pond at golden hour, warm natural sunlight casting crisp geometric shadows.',
    answer: 'Created "Kyoto Travertine Water Pavilion" with a low-angle architectural perspective. Warm golden-hour illumination grazes the cantilevered travertine slab while the courtyard pond mirrors the vertical mullions in high-contrast symmetry.',
    imageUrl: generateProceduralArtworkSvg({
      prompt: 'Cinematic architectural photography of a minimalist travertine and glass pavilion floating over a still reflective courtyard pond at golden hour',
      aspectRatio: '16:9',
      title: 'Kyoto Travertine Water Pavilion',
      motif: 'architecture',
    }),
    aspectRatio: '16:9',
    dimensionsLabel: '1600×900',
    category: 'Architectural Study',
    createdAt: 'Today, 09:40 AM',
    timestampMs: 1762006800000,
    usedReference: false,
    palette: ['#1E2229', '#C89D7C', '#E5DCCB', '#F4EFE6'],
  },
  {
    id: 'art-102',
    title: 'Bisque Porcelain Flora No. 4',
    prompt: 'Studio macro product photography of a sculptural translucent bisque porcelain botanical flower with delicate brushed brass stems resting on a dark basalt stone block.',
    answer: 'Synthesized "Bisque Porcelain Flora No. 4" using diffused side-key studio lighting. The subsurface scattering of unglazed porcelain contrasts against the matte basalt plinth and warm brushed brass stem.',
    imageUrl: generateProceduralArtworkSvg({
      prompt: 'Studio macro product photography of a sculptural translucent bisque porcelain botanical flower with delicate brushed brass stems',
      aspectRatio: '1:1',
      title: 'Bisque Porcelain Flora No. 4',
      motif: 'botanical',
    }),
    aspectRatio: '1:1',
    dimensionsLabel: '1024×1024',
    category: 'Botanical & Material',
    createdAt: 'Today, 09:15 AM',
    timestampMs: 1762005300000,
    usedReference: true,
    referenceName: 'porcelain-botanical-vessel.svg',
    palette: ['#182620', '#7D9B84', '#DFC5A8', '#F6F2EA'],
  },
  {
    id: 'art-103',
    title: 'Ceramicist in Morning Shadow',
    prompt: 'High-contrast documentary editorial portrait of an artisan ceramicist in a sunlit studio surrounded by raw clay vessels, dramatic natural window shadows, Leica 35mm aesthetic.',
    answer: 'Rendered "Ceramicist in Morning Shadow" with a 35mm documentary focal geometry. Directional north-window light carves deep tonal relief across the linen apron and raw terracotta forms.',
    imageUrl: generateProceduralArtworkSvg({
      prompt: 'High-contrast documentary editorial portrait of an artisan ceramicist in a sunlit studio surrounded by raw clay vessels',
      aspectRatio: '3:4',
      title: 'Ceramicist in Morning Shadow',
      motif: 'portrait',
    }),
    aspectRatio: '3:4',
    dimensionsLabel: '900×1200',
    category: 'Editorial Portrait',
    createdAt: 'Yesterday, 06:22 PM',
    timestampMs: 1761951720000,
    usedReference: false,
    palette: ['#1A1615', '#B85D3B', '#D9B99F', '#F5EFE8'],
  },
  {
    id: 'art-104',
    title: 'Calibre 09 Openworked Tourbillon',
    prompt: 'Clean macro studio photography of an open-worked mechanical watch movement with brushed titanium bridges and ruby jewels resting on a warm travertine slab.',
    answer: 'Composed "Calibre 09 Openworked Tourbillon" with axial macro focus, emphasizing the concentric gear train, chamfered titanium bridges, and crimson synthetic ruby bearings.',
    imageUrl: generateProceduralArtworkSvg({
      prompt: 'Clean macro studio photography of an open-worked mechanical watch movement with brushed titanium bridges and ruby jewels',
      aspectRatio: '4:3',
      title: 'Calibre 09 Openworked Tourbillon',
      motif: 'chronograph',
    }),
    aspectRatio: '4:3',
    dimensionsLabel: '1200×900',
    category: 'Precision Industrial',
    createdAt: 'Yesterday, 03:10 PM',
    timestampMs: 1761940200000,
    usedReference: false,
    palette: ['#14181D', '#B88646', '#8B95A1', '#ECEFF2'],
  },
];

export function filterAndSortHistory(
  items: ReadonlyArray<ArtworkItem>,
  searchQuery: string,
  aspectFilter: string
): ArtworkItem[] {
  const q = searchQuery.trim().toLowerCase();
  const ratio = aspectFilter.trim();

  return [...items]
    .filter((item) => {
      if (ratio && ratio !== 'all' && item.aspectRatio !== ratio) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.timestampMs - a.timestampMs);
}
