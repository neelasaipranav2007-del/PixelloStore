import path from "path";
import fs from "fs";
import { prisma } from "@/lib/db";

// File path for caching catalog image embeddings
const INDEX_CACHE_PATH = path.join(process.cwd(), "scratch", "visual_catalog_index.json");

export interface CatalogItemEmbedding {
  id: string; // `${productId}#${imageIndex}`
  productId: string;
  productName: string;
  category: string;
  categoryGroup: string;
  imageUrl: string;
  embedding: number[]; // 512-dim L2-normalized unit vector
  updatedAt: string;
}

export interface DetectedVisualFeatures {
  primaryCategory: string;
  categoryConfidence: number;
  detectedMaterial: string;
  detectedColor: string;
  summary: string;
  predictedGroup?: string;
}

export interface VisualSearchResultItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  images: string[];
  badgeTag?: string;
  badge?: string;
  stock: number;
  status: string;
  similarityScore: number; // 0 to 100 percentage
  matchType: "exact" | "similar" | "alternative";
  matchReason: string;
  variants?: any[];
  frameSizes?: any[];
}

export interface VisualSearchResponse {
  success: boolean;
  queryAnalyzed: boolean;
  detectedFeatures: DetectedVisualFeatures;
  hasCloseMatch: boolean;
  totalCatalogIndexed: number;
  results: VisualSearchResultItem[];
  modelInfo: {
    model: string;
    dimension: number;
    embeddingType: string;
  };
  error?: string;
}

// Authentic visual profiles mapped to catalog products
export const CATALOG_PRODUCT_VISUAL_PROFILES: Record<
  string,
  {
    categoryName: string;
    material: string;
    colorTone: string;
    summary: string;
    group: string;
  }
> = {
  "PRD-01": {
    categoryName: "Photo Frames",
    material: "Natural Wood & Clear Glass",
    colorTone: "Rich Natural Wood Grain",
    summary: "Handcrafted wooden photo frame with clear protective glass",
    group: "frame",
  },
  "PRD-02": {
    categoryName: "Polaroid Photo Prints",
    material: "Glossy Premium Photo Paper",
    colorTone: "Classic White Border",
    summary: "Vintage polaroid photo collection with white border styling",
    group: "polaroid",
  },
  "PRD-03": {
    categoryName: "Custom Photo Mugs",
    material: "Smooth Ceramic & Glossy Finish",
    colorTone: "Dual-Tone Contrast",
    summary: "Custom ceramic photo mug with glossy finish",
    group: "mug",
  },
  "PRD-04": {
    categoryName: "LED Acrylic Photo Lamps",
    material: "Laser-Engraved Acrylic & Solid Wood Base",
    colorTone: "Warm Glowing LED Illumination",
    summary: "Illuminated custom acrylic photo lamp with natural wood stand",
    group: "lamp",
  },
  "PRD-05": {
    categoryName: "Spotify Acrylic Music Plaques",
    material: "Transparent Acrylic & Pine Wood Stand",
    colorTone: "Crystal Clear with Scannable Soundwave",
    summary: "Custom acrylic Spotify song plaque with album art & wood base",
    group: "spotify_plaque",
  },
  "PRD-06": {
    categoryName: "Night Lamps & Ambient Lights",
    material: "Soft BPA-Free Silicone & Warm LED",
    colorTone: "Warm Ambient White & Monochrome",
    summary: "Cute panda silicone desk night lamp with soft LED glow",
    group: "lamp",
  },
  "PRD-07": {
    categoryName: "Wall Collage Photo Frames",
    material: "Solid Timber & Multi-Aperture Mount",
    colorTone: "Deep Wood Grain & Clean Glass",
    summary: "Curated collage wall photo frame set for gallery displays",
    group: "frame",
  },
  "PRD-08": {
    categoryName: "Crystal Dome Paperweights",
    material: "Crystal Glass Resin & Dried Floral Inlay",
    colorTone: "Transparent Resin with Botanical Accents",
    summary: "Handcrafted crystal dome paperweight with luminous finish",
    group: "paperweight",
  },
  "PRD-109": {
    categoryName: "Personalized Photo Keychains",
    material: "Double-Sided Acrylic & Stainless Keyring",
    colorTone: "Glossy Transparent & Silver Steel",
    summary: "Personalized double-sided photo keychain with swivel ring",
    group: "keychain",
  },
  "PRD-110": {
    categoryName: "Character Acrylic Keychains",
    material: "Laser-Cut Acrylic & Chibi Art Print",
    colorTone: "Vibrant Color Palette & Swivel Clasp",
    summary: "Custom illustrated anime character acrylic keychain",
    group: "keychain",
  },
  "PRD-111": {
    categoryName: "Luxury Curated Gift Hampers",
    material: "Premium Rigid Box & Satin Ribbon",
    colorTone: "Blush Pink & Rose Gold Accents",
    summary: "Luxury personalized gift hamper box with curated keepsakes",
    group: "hamper",
  },
};

// Global cached singletons for pipeline
let extractorInstance: any = null;

// L2 vector normalization helper: ||v|| = 1.0
export function normalizeVector(v: number[]): number[] {
  if (!v || v.length === 0) return [];
  const normSq = v.reduce((sum, val) => sum + val * val, 0);
  const norm = Math.sqrt(normSq);
  if (norm === 0) return v;
  return v.map((val) => val / norm);
}

// Dot product between two normalized float vectors (Cosine Similarity)
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
}

// Infer category group from product metadata
export function inferCategoryGroup(categoryName: string = "", productName: string = "", productId?: string): string {
  if (productId && CATALOG_PRODUCT_VISUAL_PROFILES[productId]) {
    return CATALOG_PRODUCT_VISUAL_PROFILES[productId].group;
  }
  const text = `${categoryName} ${productName}`.toLowerCase();
  if (text.includes("frame")) return "frame";
  if (text.includes("polaroid") || text.includes("print")) return "polaroid";
  if (text.includes("mug") || text.includes("cup")) return "mug";
  if (text.includes("plaque") || text.includes("spotify")) return "spotify_plaque";
  if (text.includes("lamp") || text.includes("panda") || text.includes("night light") || text.includes("led")) return "lamp";
  if (text.includes("paper weight") || text.includes("paperweight") || text.includes("resin dome")) return "paperweight";
  if (text.includes("keychain") || text.includes("key chain") || text.includes("key ring")) return "keychain";
  if (text.includes("hamper") || text.includes("gift box") || text.includes("basket")) return "hamper";
  return "general";
}

// Lazy load Transformers.js vision feature extraction pipeline (CLIP ViT-B/32)
export async function getVisionPipeline() {
  if (extractorInstance) {
    return extractorInstance;
  }

  const { pipeline, env } = await import("@xenova/transformers");
  env.useBrowserCache = false;

  if (!extractorInstance) {
    extractorInstance = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  }

  return extractorInstance;
}

// Convert any image source (buffer, data URI, local file, or remote URL) into a RawImage
export async function loadRawImageFromSource(source: Buffer | Uint8Array | string): Promise<any> {
  const { RawImage } = await import("@xenova/transformers");

  if (typeof source === "string") {
    const trimmed = source.trim();

    // Data URI (base64)
    if (trimmed.startsWith("data:")) {
      const parts = trimmed.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const buffer = Buffer.from(parts[1], "base64");
      const blob = new Blob([buffer], { type: mime });
      return await RawImage.fromBlob(blob);
    }

    // Local public path (e.g. /images/wooden_frame_main.png)
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      const fullLocalPath = path.join(process.cwd(), "public", trimmed.replace(/^\//, ""));
      if (fs.existsSync(fullLocalPath)) {
        const fileBuf = fs.readFileSync(fullLocalPath);
        const blob = new Blob([fileBuf]);
        return await RawImage.fromBlob(blob);
      }
    }

    // Full filesystem path
    if (fs.existsSync(trimmed)) {
      const fileBuf = fs.readFileSync(trimmed);
      const blob = new Blob([fileBuf]);
      return await RawImage.fromBlob(blob);
    }

    // Remote HTTP/HTTPS URL
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        const res = await fetch(trimmed, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const blob = new Blob([arrayBuf]);
        return await RawImage.fromBlob(blob);
      } catch (e: any) {
        clearTimeout(timeoutId);
        throw new Error(`Failed to load remote image from "${trimmed}": ${e.message}`);
      }
    }

    throw new Error(`Unrecognized image source format: ${trimmed.substring(0, 50)}...`);
  }

  // Raw Buffer / Uint8Array
  const blob = new Blob([source as any]);
  return await RawImage.fromBlob(blob);
}

// Read index from scratch file
export function readCachedIndex(): Record<string, CatalogItemEmbedding> {
  try {
    if (fs.existsSync(INDEX_CACHE_PATH)) {
      const raw = fs.readFileSync(INDEX_CACHE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read index cache file:", e);
  }
  return {};
}

// Save index to scratch file
export function saveCachedIndex(index: Record<string, CatalogItemEmbedding>) {
  try {
    const dir = path.dirname(INDEX_CACHE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INDEX_CACHE_PATH, JSON.stringify(index, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write index cache file:", e);
  }
}

// Build or update the visual embeddings index for all active products
export async function indexCatalogProducts(forceReindex = false): Promise<{
  totalIndexed: number;
  newlyIndexed: number;
  skipped: number;
  errors: string[];
}> {
  const extractor = await getVisionPipeline();
  const cachedIndex = forceReindex ? {} : readCachedIndex();
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  let newlyIndexed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const prod of products) {
    try {
      let images: string[] = [];
      try {
        images = typeof prod.images === "string" ? JSON.parse(prod.images) : prod.images;
      } catch {
        images = [prod.images];
      }

      if (!Array.isArray(images) || images.length === 0) {
        skipped++;
        continue;
      }

      const categoryGroup = inferCategoryGroup(prod.categoryName, prod.name, prod.id);
      let primaryEmbedding: number[] | null = null;

      for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
        const imgUrl = images[imgIdx];
        if (!imgUrl || typeof imgUrl !== "string") continue;

        const itemKey = `${prod.id}#${imgIdx}`;
        const cached = cachedIndex[itemKey];

        if (!forceReindex && cached && cached.imageUrl === imgUrl && cached.embedding?.length === 512) {
          if (imgIdx === 0) primaryEmbedding = cached.embedding;
          skipped++;
          continue;
        }

        // Compute normalized embedding for the product image
        console.log(`[Visual Search Indexer] Computing embedding for: ${prod.name} (img ${imgIdx + 1}/${images.length})...`);
        const rawImg = await loadRawImageFromSource(imgUrl);
        const featureOutput = await extractor(rawImg);
        const rawVec = Array.from(featureOutput.data) as number[];
        const normalizedVec = normalizeVector(rawVec);

        cachedIndex[itemKey] = {
          id: itemKey,
          productId: prod.id,
          productName: prod.name,
          category: prod.categoryName,
          categoryGroup,
          imageUrl: imgUrl,
          embedding: normalizedVec,
          updatedAt: new Date().toISOString(),
        };

        if (imgIdx === 0) {
          primaryEmbedding = normalizedVec;
        }

        newlyIndexed++;
      }

      // Persist primary normalized embedding to SQLite database
      if (primaryEmbedding) {
        await prisma.product
          .update({
            where: { id: prod.id },
            data: { imageEmbedding: JSON.stringify(primaryEmbedding) },
          })
          .catch(() => {});
      }
    } catch (err: any) {
      console.error(`Error indexing product ${prod.id} (${prod.name}):`, err.message);
      errors.push(`${prod.name} (${prod.id}): ${err.message}`);
    }
  }

  saveCachedIndex(cachedIndex);

  return {
    totalIndexed: Object.keys(cachedIndex).length,
    newlyIndexed,
    skipped,
    errors,
  };
}

// Perform visual search with query image
export async function searchByImage(
  queryImageSource: Buffer | Uint8Array | string,
  options: {
    topK?: number;
    exactThreshold?: number;
    similarThreshold?: number;
    minThreshold?: number;
  } = {}
): Promise<VisualSearchResponse> {
  const topK = options.topK || 8;
  const exactThreshold = options.exactThreshold ?? 0.82;
  const similarThreshold = options.similarThreshold ?? 0.72;
  const minThreshold = options.minThreshold ?? 0.65; // Strict cutoff floor to reject non-matches

  const extractor = await getVisionPipeline();

  // 1. Process customer query image
  const rawQueryImg = await loadRawImageFromSource(queryImageSource);

  // 2. Compute normalized query embedding
  const queryFeatureOutput = await extractor(rawQueryImg);
  const rawQueryVec = Array.from(queryFeatureOutput.data) as number[];
  const queryEmbedding = normalizeVector(rawQueryVec);

  // 3. Ensure catalog embeddings are loaded
  let catalogIndex = readCachedIndex();
  if (Object.keys(catalogIndex).length === 0) {
    console.log("[Visual Search] Index empty, indexing catalog on the fly...");
    await indexCatalogProducts();
    catalogIndex = readCachedIndex();
  }

  // 4. Fetch live active products from Prisma
  const liveProducts = await prisma.product.findMany({
    where: { isActive: true },
  });

  const liveMap = new Map<string, any>();
  for (const p of liveProducts) {
    if (p.status !== "Inactive") {
      liveMap.set(p.id, p);
    }
  }

  // 5. Compare query embedding with each indexed catalog product image
  // Group by productId and take the MAX similarity across all images of that product
  interface ProductMatchRecord {
    productId: string;
    productName: string;
    category: string;
    categoryGroup: string;
    bestImageUrl: string;
    rawScore: number;
    adjustedScore: number;
  }

  const productMatchMap = new Map<string, ProductMatchRecord>();

  for (const item of Object.values(catalogIndex)) {
    if (!liveMap.has(item.productId)) continue; // Only active products

    const rawSim = cosineSimilarity(queryEmbedding, item.embedding);

    const existing = productMatchMap.get(item.productId);
    if (!existing || rawSim > existing.rawScore) {
      productMatchMap.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        categoryGroup: item.categoryGroup,
        bestImageUrl: item.imageUrl,
        rawScore: rawSim,
        adjustedScore: rawSim,
      });
    }
  }

  // Find the single highest raw matching product in the catalog
  const rawCandidates = Array.from(productMatchMap.values()).sort((a, b) => b.rawScore - a.rawScore);
  const topRawMatch = rawCandidates.length > 0 ? rawCandidates[0] : null;

  // STRICT NON-CATALOG REJECTION GATE:
  // If the highest raw visual similarity is under 0.60, the uploaded photo is NOT in Pixello's catalog
  const isCatalogMatch = topRawMatch !== null && topRawMatch.rawScore >= 0.60;

  let detectedFeatures: DetectedVisualFeatures;

  if (!isCatalogMatch || !topRawMatch) {
    detectedFeatures = {
      primaryCategory: "Unrecognized Non-Catalog Image",
      categoryConfidence: 0,
      detectedMaterial: "Unmatched",
      detectedColor: "Unmatched",
      summary: "No direct match found in Pixello's product catalog",
    };

    return {
      success: true,
      queryAnalyzed: true,
      detectedFeatures,
      hasCloseMatch: false,
      totalCatalogIndexed: Object.keys(catalogIndex).length,
      results: [],
      modelInfo: {
        model: "CLIP (ViT-B/32 ONNX)",
        dimension: 512,
        embeddingType: "Cosine Similarity Vision Embedding",
      },
    };
  }

  // The query is an authentic catalog match!
  // Derive detected features from the best matching product's ground-truth profile
  const topProfile = CATALOG_PRODUCT_VISUAL_PROFILES[topRawMatch.productId];
  const primaryGroup = topProfile?.group || topRawMatch.categoryGroup;

  const topConfidence = Math.min(100, Math.round(topRawMatch.rawScore * 100));

  detectedFeatures = {
    primaryCategory: topProfile?.categoryName || topRawMatch.productName,
    categoryConfidence: topConfidence,
    detectedMaterial: topProfile?.material || "Handcrafted Custom Finish",
    detectedColor: topProfile?.colorTone || "Natural Finish",
    summary: topProfile?.summary || `${topRawMatch.productName} in Pixello catalog`,
    predictedGroup: primaryGroup,
  };

  // Score candidate ranking:
  // Boost related items within the same category group; penalize conflicting categories
  for (const c of rawCandidates) {
    let adj = c.rawScore;
    if (c.productId === topRawMatch.productId) {
      // Top match keeps full score (up to 1.00)
      adj = Math.min(1.0, c.rawScore);
    } else if (c.categoryGroup === primaryGroup) {
      // Related products in the exact same category family (e.g. other frames or keychains)
      // receive affinity boost so they appear as helpful alternatives
      adj = Math.max(adj, Math.min(0.78, c.rawScore + 0.15));
    } else {
      // Conflicting category penalty prevents unrelated products from invading results
      adj -= 0.15;
    }
    c.adjustedScore = Math.max(0, Math.min(1.0, adj));
  }

  // Sort by adjusted score descending
  const rankedCandidates = rawCandidates.sort((a, b) => b.adjustedScore - a.adjustedScore);

  // Filter candidates strictly above minimum threshold
  const validCandidates = rankedCandidates.filter((c) => c.adjustedScore >= minThreshold);
  const topCandidates = validCandidates.slice(0, topK);

  const results: VisualSearchResultItem[] = topCandidates.map((c) => {
    const live = liveMap.get(c.productId);
    let parsedImages: string[] = [];
    try {
      parsedImages = typeof live.images === "string" ? JSON.parse(live.images) : live.images;
    } catch {
      parsedImages = [live.images || "/images/wooden_frame_main.png"];
    }

    let parsedVariants = undefined;
    if (live.variants) {
      try {
        parsedVariants = JSON.parse(live.variants);
      } catch {}
    }

    let parsedFrameSizes = undefined;
    if (live.frameSizes) {
      try {
        parsedFrameSizes = JSON.parse(live.frameSizes);
      } catch {}
    }

    const displayPercentage = Math.round(c.adjustedScore * 100);

    let matchType: "exact" | "similar" | "alternative";
    let matchReason: string;

    if (c.adjustedScore >= exactThreshold) {
      matchType = "exact";
      matchReason = `Highest visual similarity match (${displayPercentage}%) matching style and appearance`;
    } else if (c.adjustedScore >= similarThreshold) {
      matchType = "similar";
      matchReason = `Visually similar ${live.categoryName.toLowerCase()} with matching features (${displayPercentage}%)`;
    } else {
      matchType = "alternative";
      matchReason = `Related catalog alternative (${displayPercentage}% category alignment)`;
    }

    return {
      id: live.id,
      name: live.name,
      slug: live.slug,
      category: live.categoryName || "Gifts",
      price: live.basePrice,
      originalPrice: live.originalPrice || undefined,
      rating: live.rating || 4.8,
      reviews: live.reviews || 1,
      image: parsedImages[0] || "/images/wooden_frame_main.png",
      images: parsedImages,
      badgeTag: live.badgeTag || undefined,
      badge: live.badge || undefined,
      stock: live.stock !== undefined ? live.stock : 50,
      status: live.status || "Active",
      similarityScore: displayPercentage,
      matchType,
      matchReason,
      variants: parsedVariants,
      frameSizes: parsedFrameSizes,
    };
  });

  return {
    success: true,
    queryAnalyzed: true,
    detectedFeatures,
    hasCloseMatch: results.length > 0,
    totalCatalogIndexed: Object.keys(catalogIndex).length,
    results,
    modelInfo: {
      model: "CLIP (ViT-B/32 ONNX)",
      dimension: 512,
      embeddingType: "Cosine Similarity Vision Embedding",
    },
  };
}
