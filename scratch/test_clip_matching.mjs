import path from "path";
import fs from "fs";
import { pipeline, RawImage, env } from "@xenova/transformers";

env.useBrowserCache = false;

async function run() {
  console.log("Loading CLIP models...");
  const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  const classifier = await pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32");

  const images = [
    { name: "wooden_frame_main.png", label: "Frame Main" },
    { name: "wooden_frame_angle.png", label: "Frame Angle" },
    { name: "wooden_frame_wall.png", label: "Frame Wall" },
    { name: "polaroid_set.png", label: "Polaroids" },
    { name: "custom_mug.png", label: "Mug" },
    { name: "led_acrylic_lamp.png", label: "LED Lamp" },
    { name: "spotify_plaque.png", label: "Spotify Plaque" },
    { name: "lighting_panda.png", label: "Lighting Panda" },
    { name: "paper_weight.png", label: "Paper Weight" },
    { name: "keychain.png", label: "Keychain" },
    { name: "keychain_characters.png", label: "Keychain Characters" },
    { name: "hamper_box.png", label: "Hamper Box" },
  ];

  const candidateClasses = [
    "photo frame or picture frame",
    "polaroid photo prints set",
    "ceramic coffee mug",
    "led night light lamp",
    "spotify acrylic music plaque",
    "crystal glass resin dome paperweight",
    "keychain or keyring accessory",
    "gift hamper box with packaging",
    "random non-catalog item or outdoor scene",
  ];

  console.log("\nTesting Zero-Shot Classification on all images:");
  const embeddings = [];

  for (const img of images) {
    const fullPath = path.join(process.cwd(), "public", "images", img.name);
    const buf = fs.readFileSync(fullPath);
    const raw = await RawImage.fromBlob(new Blob([buf]));
    
    // Feature extraction
    const feats = await extractor(raw);
    const arr = Array.from(feats.data);
    const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0));
    const normVec = arr.map(v => v / norm);
    embeddings.push({ name: img.name, vec: normVec });

    // Classification
    const cls = await classifier(raw, candidateClasses);
    console.log(`${img.name}: top='${cls[0].label}' (${(cls[0].score * 100).toFixed(1)}%), 2nd='${cls[1].label}' (${(cls[1].score * 100).toFixed(1)}%)`);
  }

  console.log("\nCosine Similarity Matrix (Dot products of normalized vectors):");
  const header = "".padEnd(20) + images.map(i => i.name.substring(0, 8).padEnd(9)).join("");
  console.log(header);

  for (let i = 0; i < embeddings.length; i++) {
    let row = images[i].name.padEnd(20);
    for (let j = 0; j < embeddings.length; j++) {
      let dot = 0;
      for (let k = 0; k < embeddings[i].vec.length; k++) {
        dot += embeddings[i].vec[k] * embeddings[j].vec[k];
      }
      row += (dot.toFixed(2)).padEnd(9);
    }
    console.log(row);
  }
}

run().catch(console.error);
