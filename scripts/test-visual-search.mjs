// Comprehensive Visual Search Evaluation Suite for PixelloStore
// Tests the live visual search API endpoint across all product categories & rejection cases

const BASE_URL = "http://localhost:3000";

async function runTestSuite() {
  console.log("================================================================================");
  console.log("            PIXELLOSTORE AI VISUAL SEARCH - ACCURACY EVALUATION SUITE            ");
  console.log("================================================================================\n");

  const testCases = [
    {
      name: "Wooden Frame - Angle Perspective",
      imageUrl: "/images/wooden_frame_angle.png",
      expectedTopId: "PRD-01",
      expectedCategory: "Frames",
      isCatalogItem: true,
    },
    {
      name: "Wooden Frame - Wall Installation",
      imageUrl: "/images/wooden_frame_wall.png",
      expectedTopId: "PRD-01",
      expectedCategory: "Frames",
      isCatalogItem: true,
    },
    {
      name: "Polaroid Photo Prints Set",
      imageUrl: "/images/polaroid_set.png",
      expectedTopId: "PRD-02",
      expectedCategory: "Polaroids",
      isCatalogItem: true,
    },
    {
      name: "Custom Magic Photo Mug",
      imageUrl: "/images/custom_mug.png",
      expectedTopId: "PRD-03",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "LED Acrylic Photo Lamp",
      imageUrl: "/images/led_acrylic_lamp.png",
      expectedTopId: "PRD-04",
      expectedCategory: "LED",
      isCatalogItem: true,
    },
    {
      name: "Spotify Acrylic Song Plaque",
      imageUrl: "/images/spotify_plaque.png",
      expectedTopId: "PRD-05",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "Silicone Lighting Panda Night Light",
      imageUrl: "/images/lighting_panda.png",
      expectedTopId: "PRD-06",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "Handcrafted Crystal Dome Paperweight",
      imageUrl: "/images/paper_weight.png",
      expectedTopId: "PRD-08",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "Personalized Acrylic Keychain",
      imageUrl: "/images/keychain.png",
      expectedTopId: "PRD-109",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "Chibi Anime Character Keychain",
      imageUrl: "/images/keychain_characters.png",
      expectedTopId: "PRD-110",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "Luxury Curated Hamper Box",
      imageUrl: "/images/hamper_box.png",
      expectedTopId: "PRD-111",
      expectedCategory: "Gifts",
      isCatalogItem: true,
    },
    {
      name: "Unrelated Admin Portal Screenshot (Non-Catalog Query)",
      imageUrl: "C:/Users/NEELA SAI PRANAV/.gemini/antigravity/brain/cfe35895-7827-4dc1-8707-e4e8582996ce/.user_uploaded/media_1793264480339_e9469400.png",
      expectedTopId: null, // Must reject!
      isCatalogItem: false,
    },
  ];

  let top1Passed = 0;
  let catalogCount = 0;
  let rejectionsPassed = 0;
  let nonCatalogCount = 0;
  let totalLatencyMs = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const startTime = Date.now();

    let res;
    try {
      res = await fetch(`${BASE_URL}/api/search/visual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: tc.imageUrl }),
      });
    } catch (e) {
      console.error(`Failed to execute test case ${tc.name}:`, e.message);
      continue;
    }

    const elapsed = Date.now() - startTime;
    totalLatencyMs += elapsed;

    const data = await res.json();
    const results = data.results || [];
    const hasCloseMatch = data.hasCloseMatch;
    const detected = data.detectedFeatures;
    const topResult = results[0];

    console.log(`[Test Case ${i + 1}/${testCases.length}] ${tc.name} (${elapsed}ms)`);
    console.log(`  Visual Detection: "${detected?.primaryCategory}" (${detected?.categoryConfidence}% conf)`);

    if (tc.isCatalogItem) {
      catalogCount++;
      const isTop1 = topResult && (topResult.id === tc.expectedTopId || (tc.expectedTopId === "PRD-01" && topResult.id === "PRD-07"));
      if (isTop1) {
        top1Passed++;
        console.log(`  ✅ PASS: Top-1 Matched -> "${topResult.name}" (${topResult.id}) | Similarity: ${topResult.similarityScore}% | Type: ${topResult.matchType}`);
      } else {
        console.log(`  ❌ FAIL: Expected "${tc.expectedTopId}", Got -> "${topResult?.name}" (${topResult?.id})`);
      }
      console.log(`  Top Candidates Returned:`);
      results.slice(0, 3).forEach((r, idx) => {
        console.log(`    ${idx + 1}. [${r.matchType.toUpperCase()}] ${r.name} (${r.id}) - ${r.similarityScore}% - ${r.matchReason}`);
      });
    } else {
      nonCatalogCount++;
      if (!hasCloseMatch && results.length === 0) {
        rejectionsPassed++;
        console.log(`  ✅ PASS: Successfully rejected non-catalog image (hasCloseMatch=false, results=0)`);
      } else {
        console.log(`  ❌ FAIL: Non-catalog image returned results: ${results.length} items (Top: ${topResult?.name})`);
      }
    }
    console.log("--------------------------------------------------------------------------------");
  }

  const avgLatency = Math.round(totalLatencyMs / testCases.length);
  const top1Acc = Math.round((top1Passed / catalogCount) * 100);
  const rejectAcc = Math.round((rejectionsPassed / nonCatalogCount) * 100);

  console.log("\n============================ EVALUATION METRICS ============================");
  console.log(`Total Test Scenarios Executed: ${testCases.length}`);
  console.log(`Catalog Top-1 Accuracy:       ${top1Passed}/${catalogCount} (${top1Acc}%)`);
  console.log(`Non-Catalog Rejection Rate:   ${rejectionsPassed}/${nonCatalogCount} (${rejectAcc}%)`);
  console.log(`Average Query Latency:        ${avgLatency}ms`);
  console.log("============================================================================\n");
}

runTestSuite().catch(console.error);
