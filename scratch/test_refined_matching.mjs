import path from "path";
import fs from "fs";
import { pipeline, RawImage, env } from "@xenova/transformers";

env.useBrowserCache = false;

const CATALOG_PRODUCT_VISUAL_PROFILES = {
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

function normalize(v) {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map((x) => x / norm) : v;
}

function dotProduct(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function test() {
  const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  const index = JSON.parse(fs.readFileSync("scratch/visual_catalog_index.json"));

  const testCases = [
    { name: "Wooden Frame Main", file: "wooden_frame_main.png", expect: "PRD-01" },
    { name: "Wooden Frame Angle", file: "wooden_frame_angle.png", expect: "PRD-01" },
    { name: "Polaroid Prints", file: "polaroid_set.png", expect: "PRD-02" },
    { name: "Custom Mug", file: "custom_mug.png", expect: "PRD-03" },
    { name: "LED Lamp", file: "led_acrylic_lamp.png", expect: "PRD-04" },
    { name: "Spotify Plaque", file: "spotify_plaque.png", expect: "PRD-05" },
    { name: "Lighting Panda", file: "lighting_panda.png", expect: "PRD-06" },
    { name: "Paper Weight", file: "paper_weight.png", expect: "PRD-08" },
    { name: "Keychain", file: "keychain.png", expect: "PRD-109" },
    { name: "Keychain Characters", file: "keychain_characters.png", expect: "PRD-110" },
    { name: "Hamper Box", file: "hamper_box.png", expect: "PRD-111" },
    {
      name: "Non-Catalog Screenshot",
      abs: "C:/Users/NEELA SAI PRANAV/.gemini/antigravity/brain/cfe35895-7827-4dc1-8707-e4e8582996ce/.user_uploaded/media_1793264480339_e9469400.png",
      expect: null,
    },
  ];

  for (const tc of testCases) {
    const filePath = tc.abs || path.join(process.cwd(), "public", "images", tc.file);
    const buf = fs.readFileSync(filePath);
    const raw = await RawImage.fromBlob(new Blob([buf]));
    const feats = await extractor(raw);
    const queryVec = normalize(Array.from(feats.data));

    // Score against all indexed items, group by productId
    const productScores = new Map();
    for (const [key, item] of Object.entries(index)) {
      const score = dotProduct(queryVec, item.embedding);
      const prev = productScores.get(item.productId);
      if (!prev || score > prev.score) {
        productScores.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          categoryGroup: item.categoryGroup,
          score,
        });
      }
    }

    const ranked = Array.from(productScores.values()).sort((a, b) => b.score - a.score);
    const topPick = ranked[0];

    // Threshold check
    const MIN_ACCEPT_THRESHOLD = 0.65;
    const isAccepted = topPick && topPick.score >= MIN_ACCEPT_THRESHOLD;

    let detectedCategory = "Unrecognized Object";
    let detectedMaterial = "Unmatched";
    let detectedColor = "Unmatched";
    let detectedConfidence = 0;

    let finalResults = [];

    if (isAccepted) {
      const profile = CATALOG_PRODUCT_VISUAL_PROFILES[topPick.productId];
      detectedCategory = profile?.categoryName || topPick.productName;
      detectedMaterial = profile?.material || "Handcrafted Custom Finish";
      detectedColor = profile?.colorTone || "Natural Tone";
      detectedConfidence = Math.min(100, Math.round(topPick.score * 100));

      // Filter results: only products in same category family OR with strong raw similarity >= 0.65
      const primaryGroup = profile?.group || topPick.categoryGroup;

      finalResults = ranked
        .map((p) => {
          let adjusted = p.score;
          // If same category group, grant small category alignment bonus
          if (p.categoryGroup === primaryGroup) {
            adjusted += 0.05;
          } else {
            // Distinct conflicting category penalty
            adjusted -= 0.10;
          }
          return { ...p, adjustedScore: adjusted };
        })
        .filter((p) => p.adjustedScore >= 0.65)
        .sort((a, b) => b.adjustedScore - a.adjustedScore);
    }

    console.log(`\n[${tc.name}] Top raw score: ${(topPick?.score || 0).toFixed(2)} (${topPick?.productName})`);
    console.log(`  Accepted: ${isAccepted} | Detection: "${detectedCategory}" (${detectedConfidence}%)`);
    console.log(`  Attributes: Material="${detectedMaterial}", Color="${detectedColor}"`);
    console.log(`  Final Results Count: ${finalResults.length}`);
    finalResults.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.productName} (${r.productId}) - adj: ${Math.round(r.adjustedScore * 100)}% (raw: ${(r.score * 100).toFixed(0)}%)`);
    });
  }
}

test().catch(console.error);
