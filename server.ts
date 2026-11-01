import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  validateCreationInput,
  detectArtDirection,
  generateProceduralArtworkSvg,
  getDimensionsForAspectRatio,
  INITIAL_SHOWCASE_ARTWORKS,
  type ArtworkItem,
  type AspectRatioOption,
} from './src/utils/studioLogic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory artwork history store seeded with initial showcase works
let studioHistory: ArtworkItem[] = [...INITIAL_SHOWCASE_ARTWORKS];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/history', (_req, res) => {
    res.json({ items: studioHistory });
  });

  app.delete('/api/history/:id', (req, res) => {
    const { id } = req.params;
    studioHistory = studioHistory.filter((item) => item.id !== id);
    res.json({ ok: true, items: studioHistory });
  });

  app.post('/api/create-image', async (req, res) => {
    try {
      const { prompt, aspectRatio, referenceImage } = req.body ?? {};
      const validation = validateCreationInput(prompt, aspectRatio, referenceImage);

      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const cleanPrompt = validation.sanitizedPrompt;
      const ratio: AspectRatioOption = validation.aspectRatio;
      const hasReference = Boolean(referenceImage?.base64Data && referenceImage?.mimeType);
      const referenceName: string | undefined = referenceImage?.name;

      const fallbackAnalysis = detectArtDirection(cleanPrompt, hasReference, referenceName);
      let finalTitle = fallbackAnalysis.title;
      let finalCategory = fallbackAnalysis.category;
      let finalAnswer = fallbackAnalysis.answer;
      let finalPalette: [string, string, string, string] = fallbackAnalysis.palette;
      let finalImageUrl = '';

      const ai = getAiClient();

      if (ai) {
        const timeoutMs = 2200;
        const withTimeout = <T,>(promise: Promise<T>): Promise<T | null> =>
          Promise.race([
            promise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
          ]);

        const imagePromise = (async () => {
          try {
            const parts: Array<
              | { inlineData: { data: string; mimeType: string } }
              | { text: string }
            > = [];

            if (hasReference && referenceImage.mimeType !== 'image/svg+xml') {
              parts.push({
                inlineData: {
                  data: referenceImage.base64Data,
                  mimeType: referenceImage.mimeType,
                },
              });
            }

            parts.push({
              text: hasReference
                ? `Using the uploaded image as a visual reference, create an image for: ${cleanPrompt}. Also provide a brief explanation of the created image.`
                : `${cleanPrompt}`,
            });

            return await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite-image',
              contents: { parts },
              config: {
                imageConfig: {
                  aspectRatio: ratio,
                },
              },
            });
          } catch {
            return null;
          }
        })();

        const metaPromise = (async () => {
          try {
            const textParts: Array<
              | { inlineData: { data: string; mimeType: string } }
              | { text: string }
            > = [];

            if (hasReference && referenceImage.mimeType !== 'image/svg+xml') {
              textParts.push({
                inlineData: {
                  data: referenceImage.base64Data,
                  mimeType: referenceImage.mimeType,
                },
              });
            }

            textParts.push({
              text: `The user requested an image with prompt: "${cleanPrompt}" (aspect ratio ${ratio}${hasReference ? `, with uploaded reference image "${referenceName || 'gallery image'}"` : ''}). Respond with an evocative artwork title, a concise category label, a helpful 2-3 sentence answer addressing their prompt and describing the visual composition, and 4 hex color codes [darkHex, accentHex, midHex, lightHex].`,
            });

            return await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: { parts: textParts },
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Short editorial title for the created image.' },
                    category: { type: Type.STRING, description: '2-3 word artistic discipline or genre.' },
                    answer: { type: Type.STRING, description: 'Direct, helpful response answering the user prompt and explaining the created image.' },
                    palette: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '4 hex colors: dark ground, focal accent, midtone, highlight.',
                    },
                  },
                },
              },
            });
          } catch {
            return null;
          }
        })();

        const [imgResponse, metaResponse] = await Promise.all([
          withTimeout(imagePromise),
          withTimeout(metaPromise),
        ]);

        if (imgResponse) {
          const textSegments: string[] = [];
          for (const part of imgResponse.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType ?? 'image/png';
              finalImageUrl = `data:${mime};base64,${part.inlineData.data}`;
            } else if (part.text) {
              textSegments.push(part.text.trim());
            }
          }
          if (textSegments.length > 0 && textSegments.join(' ').trim().length > 15) {
            finalAnswer = textSegments.join(' ').trim();
          }
        }

        if (metaResponse) {
          try {
            const rawJson = (metaResponse.text ?? '').trim();
            if (rawJson) {
              const parsed = JSON.parse(rawJson);
              if (typeof parsed.title === 'string' && parsed.title.trim()) {
                finalTitle = parsed.title.trim();
              }
              if (typeof parsed.category === 'string' && parsed.category.trim()) {
                finalCategory = parsed.category.trim();
              }
              if (typeof parsed.answer === 'string' && parsed.answer.trim()) {
                finalAnswer = parsed.answer.trim();
              }
              if (
                Array.isArray(parsed.palette) &&
                parsed.palette.length >= 4 &&
                parsed.palette.every((c: unknown) => typeof c === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c))
              ) {
                finalPalette = [
                  parsed.palette[0],
                  parsed.palette[1],
                  parsed.palette[2],
                  parsed.palette[3],
                ];
              }
            }
          } catch {
            // keep deterministic fallback analysis
          }
        }
      }

      if (!finalImageUrl) {
        finalImageUrl = generateProceduralArtworkSvg({
          prompt: cleanPrompt,
          aspectRatio: ratio,
          title: finalTitle,
          palette: finalPalette,
          motif: fallbackAnalysis.motif,
          usedReference: hasReference,
        });
      }

      const { dimensions } = getDimensionsForAspectRatio(ratio);
      const now = new Date();
      const timeLabel = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const createdArtwork: ArtworkItem = {
        id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: finalTitle,
        prompt: cleanPrompt,
        answer: finalAnswer,
        imageUrl: finalImageUrl,
        aspectRatio: ratio,
        dimensionsLabel: dimensions,
        category: finalCategory,
        createdAt: `Today, ${timeLabel}`,
        timestampMs: Date.now(),
        usedReference: hasReference,
        referenceName: hasReference ? referenceName || 'Uploaded Gallery Image' : undefined,
        referencePreviewUrl: hasReference ? referenceImage?.dataUrl : undefined,
        palette: finalPalette,
      };

      studioHistory = [createdArtwork, ...studioHistory];
      res.json({ artwork: createdArtwork });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected studio synthesis error.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Atelier Lumina server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
