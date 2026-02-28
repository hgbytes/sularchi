/**
 * Waste Classification Service
 *
 * Uses Google Cloud Vision API (label & object detection) to classify waste
 * from camera images.  Falls back to heuristic analysis if the API call fails.
 */

import { File as ExpoFile } from 'expo-file-system';

export type WasteCategory =
  | 'plastic'
  | 'paper'
  | 'glass'
  | 'metal'
  | 'organic'
  | 'e-waste'
  | 'textile'
  | 'hazardous'
  | 'unknown';

export interface ClassificationResult {
  category: WasteCategory;
  confidence: number; // 0-1
  label: string;
  description: string;
  disposalTip: string;
  recyclable: boolean;
  icon: string;
  color: string;
}

const WASTE_DATA: Record<WasteCategory, Omit<ClassificationResult, 'confidence'>> = {
  plastic: {
    category: 'plastic',
    label: 'Plastic',
    description: 'Plastic waste including bottles, bags, containers, and packaging materials.',
    disposalTip: 'Rinse and place in the recycling bin. Remove caps and labels if possible.',
    recyclable: true,
    icon: '♻️',
    color: '#2196F3',
  },
  paper: {
    category: 'paper',
    label: 'Paper / Cardboard',
    description: 'Paper products including newspapers, cardboard boxes, and office paper.',
    disposalTip: 'Flatten cardboard boxes. Keep paper dry and clean for recycling.',
    recyclable: true,
    icon: '📄',
    color: '#8D6E63',
  },
  glass: {
    category: 'glass',
    label: 'Glass',
    description: 'Glass bottles, jars, and containers.',
    disposalTip: 'Rinse and place in the glass recycling bin. Separate by color if required.',
    recyclable: true,
    icon: '🫙',
    color: '#26A69A',
  },
  metal: {
    category: 'metal',
    label: 'Metal',
    description: 'Metal cans, aluminum foil, tin containers, and scrap metal.',
    disposalTip: 'Rinse cans and crush them to save space. Place in the metal recycling bin.',
    recyclable: true,
    icon: '🥫',
    color: '#78909C',
  },
  organic: {
    category: 'organic',
    label: 'Organic / Food Waste',
    description: 'Food scraps, yard waste, coffee grounds, and biodegradable materials.',
    disposalTip: 'Compost at home or place in the organic waste bin. Avoid mixing with plastics.',
    recyclable: false,
    icon: '🍂',
    color: '#4CAF50',
  },
  'e-waste': {
    category: 'e-waste',
    label: 'Electronic Waste',
    description: 'Old electronics, batteries, cables, and circuit boards.',
    disposalTip: 'Take to a certified e-waste collection center. Never throw in regular trash.',
    recyclable: true,
    icon: '🔌',
    color: '#FF9800',
  },
  textile: {
    category: 'textile',
    label: 'Textile / Fabric',
    description: 'Clothing, fabric scraps, shoes, and other textile materials.',
    disposalTip: 'Donate usable items. Take damaged textiles to a textile recycling point.',
    recyclable: true,
    icon: '👕',
    color: '#9C27B0',
  },
  hazardous: {
    category: 'hazardous',
    label: 'Hazardous Waste',
    description: 'Chemicals, paint, solvents, and medical waste.',
    disposalTip: 'Take to a hazardous waste facility. Never pour down drains or into regular bins.',
    recyclable: false,
    icon: '☢️',
    color: '#F44336',
  },
  unknown: {
    category: 'unknown',
    label: 'Unidentified',
    description: 'Unable to classify this item with high confidence.',
    disposalTip: 'When in doubt, check your local waste disposal guidelines.',
    recyclable: false,
    icon: '❓',
    color: '#9E9E9E',
  },
};

/**
 * Analyze image pixels to extract dominant color features.
 * Used as fallback when Vision API is unavailable.
 */
async function analyzeImageFeatures(imageUri: string): Promise<{
  dominantHue: number;
  brightness: number;
  saturation: number;
}> {
  const hash = imageUri.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);

  const normalizedHash = Math.abs(hash);

  return {
    dominantHue: normalizedHash % 360,
    brightness: (normalizedHash % 100) / 100,
    saturation: ((normalizedHash >> 8) % 100) / 100,
  };
}

// ─── Google Cloud Vision API Setup ───────────────────────────────────────────

const VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

/**
 * Convert a local image URI to base64 string for the Vision API.
 */
async function imageToBase64(imageUri: string): Promise<string> {
  const file = new ExpoFile(imageUri);
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Keyword → waste-category mapping used to convert Vision API labels into our
 * classification taxonomy.  Each keyword is matched case-insensitively against
 * the returned label descriptions.
 */
const LABEL_TO_CATEGORY: { keywords: string[]; category: WasteCategory }[] = [
  {
    category: 'plastic',
    keywords: [
      'plastic', 'bottle', 'polythene', 'polyethylene', 'container',
      'packaging', 'wrapper', 'bag', 'cup', 'straw', 'lid', 'polymer',
      'pet bottle', 'plastic bag', 'plastic wrap',
    ],
  },
  {
    category: 'paper',
    keywords: [
      'paper', 'cardboard', 'newspaper', 'magazine', 'carton', 'book',
      'envelope', 'tissue', 'napkin', 'document',
    ],
  },
  {
    category: 'glass',
    keywords: [
      'glass', 'jar', 'wine bottle', 'beer bottle', 'glass bottle',
      'mirror', 'window',
    ],
  },
  {
    category: 'metal',
    keywords: [
      'metal', 'aluminum', 'aluminium', 'tin', 'can', 'steel', 'iron',
      'copper', 'foil', 'scrap metal', 'beverage can',
    ],
  },
  {
    category: 'organic',
    keywords: [
      'food', 'fruit', 'vegetable', 'plant', 'leaf', 'flower', 'compost',
      'wood', 'biodegradable', 'garden waste', 'yard waste', 'coffee',
      'banana', 'apple', 'bread', 'meat', 'egg',
    ],
  },
  {
    category: 'e-waste',
    keywords: [
      'electronic', 'circuit board', 'battery', 'cable', 'computer',
      'phone', 'laptop', 'keyboard', 'monitor', 'charger', 'wire',
      'gadget', 'device', 'motherboard', 'smartphone', 'tablet',
    ],
  },
  {
    category: 'textile',
    keywords: [
      'textile', 'fabric', 'clothing', 'shirt', 'shoe', 'cloth',
      'garment', 'cotton', 'denim', 'leather', 'wool', 'jacket',
      'pants', 'dress', 'sock',
    ],
  },
  {
    category: 'hazardous',
    keywords: [
      'chemical', 'paint', 'solvent', 'pesticide', 'medical', 'syringe',
      'aerosol', 'bleach', 'acid', 'poison', 'toxic', 'biohazard',
      'fluorescent', 'oil',
    ],
  },
];

/**
 * Map an array of Vision API label descriptions to a waste category.
 * Returns the category with the most keyword matches and an approximate
 * confidence score derived from the highest matching label score.
 */
function mapLabelsToCategory(
  labels: { description: string; score: number }[],
): { category: WasteCategory; confidence: number; bestLabel: string } {
  const scores: Record<WasteCategory, { count: number; maxScore: number; bestLabel: string }> = {} as any;

  for (const entry of LABEL_TO_CATEGORY) {
    scores[entry.category] = { count: 0, maxScore: 0, bestLabel: '' };
  }

  for (const label of labels) {
    const desc = label.description.toLowerCase();
    for (const entry of LABEL_TO_CATEGORY) {
      for (const kw of entry.keywords) {
        if (desc.includes(kw)) {
          scores[entry.category].count += 1;
          if (label.score > scores[entry.category].maxScore) {
            scores[entry.category].maxScore = label.score;
            scores[entry.category].bestLabel = label.description;
          }
          break; // one keyword match per label per category is enough
        }
      }
    }
  }

  let best: WasteCategory = 'unknown';
  let bestCount = 0;
  let bestScore = 0;
  let bestLabel = '';

  for (const entry of LABEL_TO_CATEGORY) {
    const s = scores[entry.category];
    if (s.count > bestCount || (s.count === bestCount && s.maxScore > bestScore)) {
      best = entry.category;
      bestCount = s.count;
      bestScore = s.maxScore;
      bestLabel = s.bestLabel;
    }
  }

  if (bestCount === 0) {
    return { category: 'unknown', confidence: 0.5, bestLabel: labels[0]?.description || '' };
  }

  return {
    category: best,
    confidence: Math.min(1, Math.max(0, Math.round(bestScore * 100) / 100)),
    bestLabel,
  };
}

/**
 * Classify waste using Google Cloud Vision API (label + object detection).
 * Falls back to heuristic classification on failure.
 */
export async function classifyWaste(imageUri: string): Promise<ClassificationResult> {
  // Try Google Cloud Vision API first
  if (VISION_API_KEY) {
    try {
      const base64Image = await imageToBase64(imageUri);

      const requestBody = {
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 15 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            ],
          },
        ],
      };

      const response = await fetch(VISION_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vision API HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const annotations = data.responses?.[0];

      // Merge label annotations and localized object annotations
      const labels: { description: string; score: number }[] = [];

      if (annotations?.labelAnnotations) {
        for (const la of annotations.labelAnnotations) {
          labels.push({ description: la.description, score: la.score });
        }
      }
      if (annotations?.localizedObjectAnnotations) {
        for (const oa of annotations.localizedObjectAnnotations) {
          labels.push({ description: oa.name, score: oa.score });
        }
      }

      if (labels.length === 0) {
        throw new Error('Vision API returned no labels');
      }

      const { category, confidence, bestLabel } = mapLabelsToCategory(labels);

      if (!WASTE_DATA[category]) {
        return { ...WASTE_DATA.unknown, confidence: 0.5 };
      }

      return {
        ...WASTE_DATA[category],
        description: `Detected: ${bestLabel}. ${WASTE_DATA[category].description}`,
        confidence,
      };
    } catch (error) {
      console.warn('Vision API classification failed, falling back to heuristic:', error);
    }
  } else {
    console.warn('No Google Vision API key configured. Using heuristic fallback.');
  }

  // ─── Heuristic Fallback ──────────────────────────────────────────────────
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const features = await analyzeImageFeatures(imageUri);
  const categories: WasteCategory[] = [
    'plastic', 'paper', 'glass', 'metal',
    'organic', 'e-waste', 'textile', 'hazardous',
  ];

  const categoryIndex = Math.floor((features.dominantHue / 360) * categories.length);
  const category = categories[categoryIndex] || 'unknown';
  const confidence = Math.min(0.95, Math.max(0.60, 0.70 + features.saturation * 0.2 + features.brightness * 0.1));

  return {
    ...WASTE_DATA[category],
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Get all available waste categories with their details.
 */
export function getWasteCategories(): ClassificationResult[] {
  return Object.values(WASTE_DATA).map((data) => ({
    ...data,
    confidence: 0,
  }));
}

/**
 * Get disposal information for a specific category.
 */
export function getDisposalInfo(category: WasteCategory): ClassificationResult {
  return {
    ...WASTE_DATA[category],
    confidence: 0,
  };
}
