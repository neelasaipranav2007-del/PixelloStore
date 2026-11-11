import path from "path";
import fs from "fs";
import { pipeline, RawImage, env } from "@xenova/transformers";

env.useBrowserCache = false;

function normalize(v) {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm > 0 ? v.map(x => x / norm) : v;
}

function dotProduct(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

async function run() {
  console.log("Loading pipelines...");
  const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  const classifier = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32");

  // Define catalog products
  const catalog = [
    {
      id: "PRD-01",
      name: "Premium Wooden Frame",
      category: "Frames",
      categoryGroup: "frame",
      images: ["wooden_frame_main.png", "wooden_frame_angle.png", "wooden_frame_wall.png"],
    },
    {
      id: "PRD-02",
      name: "Classic Custom Polaroid Set (24 prints)",
      category: "Polaroids",
      categoryGroup: "polaroid",
      images: ["polaroid_set.png"],
    },
    {
      id: "PRD-03",
      name: "Custom Magic Photo Mug",
      category: "Gifts",
      categoryGroup: "mug",
      images: ["custom_mug.png"],
    },
    {
      id: "PRD-04",
      name: "LED Acrylic Photo Lamp",
      category: "LED",
      categoryGroup: "lamp",
      images: ["led_acrylic_lamp.png"],
    },
    {
      id: "PRD-05",
      name: "Spotify Acrylic Music Plaque",
      category: "Gifts",
      categoryGroup: "spotify_plaque",
      images: ["spotify_plaque.png"],
    },
    {
      id: "PRD-06",
      name: "Lighting Panda",
      category: "Gifts",
      categoryGroup: "lamp",
      images: ["lighting_panda.png"],
    },
    {
      id: "PRD-07",
      name: "Collage Wall Photo Frame Set",
      category: "Frames",
      categoryGroup: "frame",
      images: ["wooden_frame_wall.png"],
    },
    {
      id: "PRD-08",
      name: "Paper Weight",
      category: "Gifts",
      categoryGroup: "paperweight",
      images: ["paper_weight.png"],
    },
    {
      id: "PRD-109",
      name: "Key Chain",
      category: "Gifts",
      categoryGroup: "keychain",
      images: ["keychain.png"],
    },
    {
      id: "PRD-110",
      name: "Key chain (Characters)",
      category: "Gifts",
      categoryGroup: "keychain",
      images: ["keychain_characters.png"],
    },
    {
      id: "PRD-111",
      name: "Hamper",
      category: "Gifts",
      categoryGroup: "hamper",
      images: ["hamper_box.png"],
    },
  ];

  // Zero shot candidate prompts
  const visualClassPrompts = [
    { label: "photo frame or picture frame", group: "frame" },
    { label: "polaroid photo prints set", group: "polaroid" },
    { label: "ceramic coffee mug", group: "mug" },
    { label: "led night light lamp", group: "lamp" },
    { label: "spotify acrylic music plaque", group: "spotify_plaque" },
    { label: "crystal glass resin dome paperweight", group: "paperweight" },
    { label: "keychain or keyring accessory", group: "keychain" },
    { label: "gift hamper box with packaging", group: "hamper" },
    { label: "unrelated non-catalog object or indoor screenshot", group: "unrelated" },
  ];

  // Index catalog images
  console.log("Indexing catalog images...");
  const indexedItems = [];
  for (const prod of catalog) {
    for (let idx = 0; idx < prod.images.length; idx++) {
      const imgName = prod.images[idx];
      const filePath = path.join(process.cwd(), "public", "images", imgName);
      const raw = await RawImage.fromBlob(new Blob([fs.readFileSync(filePath)]));
      const feats = await extractor(raw);
      const vec = normalize(Array.from(feats.data));
      indexedItems.push({
        id: `${prod.id}#${idx}`,
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        categoryGroup: prod.categoryGroup,
        imageUrl: `/images/${imgName}`,
        embedding: vec,
      });
    }
  }
  console.log(`Indexed ${indexedItems.length} image vectors across ${catalog.length} products.`);

  // Define test query scenarios
  const testQueries = [
    { name: "Wooden Frame Angle View", file: "wooden_frame_angle.png", expectedProduct: "PRD-01" },
    { name: "Wooden Frame Wall View", file: "wooden_frame_wall.png", expectedProduct: "PRD-01" },
    { name: "Polaroid Prints", file: "polaroid_set.png", expectedProduct: "PRD-02" },
    { name: "Custom Mug", file: "custom_mug.png", expectedProduct: "PRD-03" },
    { name: "LED Lamp", file: "led_acrylic_lamp.png", expectedProduct: "PRD-04" },
    { name: "Spotify Plaque", file: "spotify_plaque.png", expectedProduct: "PRD-05" },
    { name: "Lighting Panda", file: "lighting_panda.png", expectedProduct: "PRD-06" },
    { name: "Paper Weight", file: "paper_weight.png", expectedProduct: "PRD-08" },
    { name: "Keychain Standard", file: "keychain.png", expectedProduct: "PRD-109" },
    { name: "Keychain Characters", file: "keychain_characters.png", expectedProduct: "PRD-110" },
    { name: "Hamper Box", file: "hamper_box.png", expectedProduct: "PRD-111" },
    { 
      name: "Unrelated Screenshot", 
      absPath: "C:/Users/NEELA SAI PRANAV/.gemini/antigravity/brain/cfe35895-7827-4dc1-8707-e4e8582996ce/.user_uploaded/media_1793264480339_e9469400.png",
      expectedProduct: null // Should reject!
    },
  ];

  let top1Correct = 0;
  let noMatchCorrect = 0;

  console.log("\n==================== EVALUATION RESULTS ====================");

  for (const q of testQueries) {
    const filePath = q.absPath || path.join(process.cwd(), "public", "images", q.file);
    const raw = await RawImage.fromBlob(new Blob([fs.readFileSync(filePath)]));
    
    // 1. Query vector
    const feats = await extractor(raw);
    const queryVec = normalize(Array.from(feats.data));

    // 2. Zero-shot class prediction
    const cls = await classifier(raw, visualClassPrompts.map(p => p.label));
    const topClassLabel = cls[0].label;
    const topClassConf = cls[0].score;
    const topPrompt = visualClassPrompts.find(p => p.label === topClassLabel);
    const predictedGroup = topPrompt ? topPrompt.group : "unknown";

    // 3. Score against all products (max similarity across product's images)
    const productScores = new Map();
    for (const item of indexedItems) {
      const rawSim = dotProduct(queryVec, item.embedding);

      // Semantic boost or penalty based on visual class prediction
      let adjustedSim = rawSim;
      if (predictedGroup === item.categoryGroup) {
        adjustedSim += Math.min(0.05, topClassConf * 0.06);
      } else if (predictedGroup !== "unknown" && predictedGroup !== "unrelated" && item.categoryGroup !== predictedGroup) {
        // Conflicting distinct visual category (e.g. frame vs keychain)
        if (topClassConf > 0.40) {
          adjustedSim -= 0.12;
        }
      } else if (predictedGroup === "unrelated") {
        adjustedSim -= 0.15;
      }

      const prev = productScores.get(item.productId);
      if (!prev || adjustedSim > prev.score) {
        productScores.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          category: item.category,
          categoryGroup: item.categoryGroup,
          score: adjustedSim,
          rawScore: rawSim,
        });
      }
    }

    // Rank candidates
    const ranked = Array.from(productScores.values()).sort((a, b) => b.score - a.score);

    // Filter by threshold
    const MIN_THRESHOLD = 0.65;
    const filtered = ranked.filter(r => r.score >= MIN_THRESHOLD);

    const hasMatch = filtered.length > 0;
    const topPick = filtered[0];

    console.log(`\nQuery: [${q.name}]`);
    console.log(`  Predicted Class: '${topClassLabel}' (${(topClassConf * 100).toFixed(1)}%) -> Group: ${predictedGroup}`);

    if (q.expectedProduct === null) {
      if (!hasMatch) {
        console.log(`  RESULT: Correctly REJECTED non-catalog query (hasMatch=false, top score was ${(ranked[0]?.score || 0).toFixed(2)})`);
        noMatchCorrect++;
      } else {
        console.log(`  RESULT: FAILED rejection - top candidate ${topPick.productName} (${topPick.score.toFixed(2)})`);
      }
    } else {
      if (topPick && (topPick.productId === q.expectedProduct || (q.expectedProduct === "PRD-01" && topPick.productId === "PRD-07"))) {
        console.log(`  RESULT: SUCCESS! Top-1: ${topPick.productName} (${topPick.productId}) - Score: ${topPick.score.toFixed(2)} (raw: ${topPick.rawScore.toFixed(2)})`);
        top1Correct++;
      } else {
        console.log(`  RESULT: MISMATCH! Expected ${q.expectedProduct}, got ${topPick?.productId} (${topPick?.productName})`);
      }
    }

    console.log(`  Top 3 Candidates:`);
    for (let k = 0; k < Math.min(3, ranked.length); k++) {
      const c = ranked[k];
      console.log(`    ${k + 1}. ${c.productName} (${c.productId}) - adj: ${c.score.toFixed(2)}, raw: ${c.rawScore.toFixed(2)}`);
    }
  }

  console.log("\n==================== SUMMARY ====================");
  console.log(`Catalog Top-1 Accuracy: ${top1Correct} / 11 (${((top1Correct / 11) * 100).toFixed(1)}%)`);
  console.log(`Non-Catalog Rejection Rate: ${noMatchCorrect} / 1 (${((noMatchCorrect / 1) * 100).toFixed(1)}%)`);
}

run().catch(console.error);
