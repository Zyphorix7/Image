import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreationInput,
  detectArtDirection,
  generateProceduralArtworkSvg,
  filterAndSortHistory,
  INITIAL_SHOWCASE_ARTWORKS,
} from './studioLogic';

test('validateCreationInput rejects empty or whitespace-only prompts', () => {
  const emptyResult = validateCreationInput('   ', '1:1');
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.error?.includes('Please enter a descriptive prompt'));

  const shortResult = validateCreationInput('hi', '16:9');
  assert.equal(shortResult.valid, false);
  assert.ok(shortResult.error?.includes('at least 3 characters'));
});

test('validateCreationInput accepts valid prompt and optional gallery reference image', () => {
  const validResult = validateCreationInput(
    'A sunlit travertine courtyard with an olive tree',
    '16:9',
    {
      name: 'reference.png',
      mimeType: 'image/png',
      base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    }
  );
  assert.equal(validResult.valid, true);
  assert.equal(validResult.aspectRatio, '16:9');
  assert.equal(validResult.sanitizedPrompt, 'A sunlit travertine courtyard with an olive tree');
});

test('validateCreationInput rejects non-image gallery uploads', () => {
  const invalidUpload = validateCreationInput('A futuristic train station', '4:3', {
    name: 'document.pdf',
    mimeType: 'application/pdf',
    base64Data: 'JVBERi0xLjQ=',
  });
  assert.equal(invalidUpload.valid, false);
  assert.ok(invalidUpload.error?.includes('valid image format'));
});

test('detectArtDirection classifies diverse prompts and incorporates reference context', () => {
  const arch = detectArtDirection('Minimalist brutalist concrete pavilion over water', true, 'courtyard.jpg');
  assert.equal(arch.motif, 'architecture');
  assert.equal(arch.category, 'Architectural Study');
  assert.ok(arch.answer.includes('courtyard.jpg'));

  const cosmos = detectArtDirection('Deep space nebula with a ringed exoplanet in orbit', false);
  assert.equal(cosmos.motif, 'cosmos');
  assert.equal(cosmos.category, 'Astronomical & Sci-Fi');
});

test('generateProceduralArtworkSvg returns a valid SVG data URL matching aspect ratio', () => {
  const dataUrl = generateProceduralArtworkSvg({
    prompt: 'Porcelain teapot with brass handle',
    aspectRatio: '16:9',
  });
  assert.ok(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,'));
  const decoded = decodeURIComponent(dataUrl.replace('data:image/svg+xml;charset=utf-8,', ''));
  assert.ok(decoded.includes('viewBox="0 0 1600 900"'));
});

test('filterAndSortHistory filters by query and aspect ratio and sorts newest first', () => {
  const all = filterAndSortHistory(INITIAL_SHOWCASE_ARTWORKS, '', 'all');
  assert.equal(all.length, 4);
  assert.equal(all[0].id, 'art-101');

  const macroOnly = filterAndSortHistory(INITIAL_SHOWCASE_ARTWORKS, 'porcelain', 'all');
  assert.equal(macroOnly.length, 1);
  assert.equal(macroOnly[0].id, 'art-102');

  const ratioFiltered = filterAndSortHistory(INITIAL_SHOWCASE_ARTWORKS, '', '3:4');
  assert.equal(ratioFiltered.length, 1);
  assert.equal(ratioFiltered[0].id, 'art-103');
});
