const TYPO_MAP = {
  poloroid: "polaroid",
  poloroids: "polaroid",
  polroid: "polaroid",
  polroids: "polaroid",
  plaroid: "polaroid",
  fraem: "frame",
  fraems: "frame",
  freme: "frame",
  fram: "frame",
  frames: "frame",
  mugg: "mug",
  muggs: "mug",
  mugs: "mug",
  spotifi: "spotify",
  spotfy: "spotify",
  colage: "collage",
  keychan: "keychain",
  lampp: "lamp",
  lamps: "lamp",
  gifts: "gift",
  pic: "photo",
  picture: "photo",
  pics: "photo",
  pictures: "photo",
};

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function getSearchableText(product) {
  const parts = [
    product.name || "",
    product.category || "",
    product.description || "",
    product.badge || "",
    product.badgeTag || "",
    product.aboutTitle || "",
    ...(product.aboutPoints || []),
    ...(product.variants?.map((v) => `${v.name} ${v.description || ""}`) || []),
  ];

  const nameLow = (product.name || "").toLowerCase();
  const catLow = (product.category || "").toLowerCase();

  if (catLow.includes("frame") || nameLow.includes("frame")) {
    parts.push("photo", "photo frame", "picture", "picture frame", "wood", "wooden", "wall", "table", "custom", "personalized", "pine wood", "memories", "gift", "gifting");
  }
  if (catLow.includes("polaroid") || nameLow.includes("polaroid")) {
    parts.push("photo", "prints", "retro", "fuji", "aesthetic", "custom", "mini", "album", "polaroids", "film", "gift");
  }
  if (catLow.includes("mug") || nameLow.includes("mug")) {
    parts.push("cup", "coffee", "tea", "magic mug", "heat reveal", "ceramic", "drinkware", "photo mug", "custom", "gift");
  }
  if (catLow.includes("led") || nameLow.includes("lamp") || nameLow.includes("light") || nameLow.includes("lighting")) {
    parts.push("lamp", "lamps", "night light", "acrylic lamp", "lighting", "light", "glow", "led", "warm light", "ambient", "desk lamp", "room decor", "gift");
  }
  if (nameLow.includes("panda")) {
    parts.push("panda", "panda lamp", "moss panda", "cute lamp", "animal lamp");
  }
  if (nameLow.includes("spotify") || nameLow.includes("plaque") || nameLow.includes("music")) {
    parts.push("music", "song", "scannable", "qr", "code", "acrylic plaque", "album cover", "sound wave", "playlist", "gift");
  }
  if (nameLow.includes("paper weight") || nameLow.includes("paperweight") || nameLow.includes("crystal")) {
    parts.push("paperweight", "paper weight", "crystal", "resin", "couple", "love", "keepsake", "forever us", "gift");
  }
  if (nameLow.includes("key") || nameLow.includes("chain") || catLow.includes("key")) {
    parts.push("keychain", "key chain", "keychains", "key chains", "keyring", "key ring", "pocket", "acrylic", "gift");
  }
  if (nameLow.includes("hamper") || catLow.includes("hamper")) {
    parts.push("gift box", "hamper", "hampers", "gift hamper", "surprise", "basket", "combo", "custom gift box", "present");
  }

  return parts.join(" ").toLowerCase();
}

function isFuzzyMatch(searchableText, queryInput) {
  if (!queryInput || !queryInput.trim()) return true;

  const cleanTarget = searchableText.toLowerCase();
  const rawQuery = queryInput.toLowerCase().trim();

  // 1. Exact full phrase match
  if (cleanTarget.includes(rawQuery)) return true;

  // 2. Space-stripped match (e.g. "keychain" vs "key chain", "paperweight" vs "paper weight")
  const compactTarget = cleanTarget.replace(/[^a-z0-9]/g, "");
  const compactQuery = rawQuery.replace(/[^a-z0-9]/g, "");
  if (compactQuery && compactTarget.includes(compactQuery)) return true;

  // 3. Normalized query check
  const normalizedQuery = TYPO_MAP[rawQuery] || rawQuery;
  if (cleanTarget.includes(normalizedQuery)) return true;

  // 4. Multi-word search: Each word in the query must match something in the target (AND logic)
  const queryTokens = rawQuery.split(/[\s,-]+/).filter((t) => t.length > 0);
  const targetTokens = cleanTarget.split(/[\s,-]+/).filter((t) => t.length > 0);

  const allTokensMatch = queryTokens.every((qToken) => {
    const normQ = TYPO_MAP[qToken] || qToken;

    // Direct token or compact token match
    if (cleanTarget.includes(normQ) || compactTarget.includes(normQ.replace(/[^a-z0-9]/g, ""))) {
      return true;
    }

    // Stemming
    const stemmed = normQ.endsWith("s") && normQ.length > 3 ? normQ.slice(0, -1) : normQ;
    if (cleanTarget.includes(stemmed)) return true;

    // Fuzzy typo match per token
    if (normQ.length >= 3) {
      for (const tToken of targetTokens) {
        if (tToken.includes(normQ)) return true;
        if (tToken.length >= 4 && normQ.length >= 4 && (normQ.startsWith(tToken) || tToken.startsWith(normQ))) return true;
        const maxDist = normQ.length >= 7 ? 2 : normQ.length >= 4 ? 1 : 0;
        if (maxDist > 0 && levenshteinDistance(normQ, tToken) <= maxDist) return true;
      }
    }

    return false;
  });

  return allTokensMatch;
}

const products = [
  { id: "PRD-01", name: "Premium Wooden Frame", category: "Frames", description: "Personalized Wooden Frame crafted with premium quality materials. Perfect for gifting.", badge: "Bestseller" },
  { id: "PRD-02", name: "Classic Custom Polaroid Set (24 prints)", category: "Polaroids", description: "Retro-style aesthetic polaroid prints.", badge: "Trending" },
  { id: "PRD-03", name: "Custom Magic Photo Mug", category: "Gifts", description: "Heat reveal magic mug with your photos." },
  { id: "PRD-04", name: "LED Acrylic Photo Lamp", category: "LED", description: "Illuminate your memories with laser-engraved lamp." },
  { id: "PRD-05", name: "Spotify Acrylic Music Plaque", category: "Gifts", description: "Scan and play spotify music plaque." },
  { id: "PRD-06", name: "Lighting Panda", category: "Gifts", description: "Cute moss panda lamp with soft warm glow." },
  { id: "PRD-109", name: "Key Chain", category: "Gifts", description: "Double sided acrylic keychain." },
  { id: "PRD-08", name: "Paper Weight", category: "Gifts", description: "Forever Us crystal paper weight." },
  { id: "PRD-111", name: "Hamper", category: "Gifts", description: "Luxury gift box hamper combo." }
];

const testQueries = [
  "frame",
  "frames",
  "photo frame",
  "picture frame",
  "photo",
  "polaroid",
  "polaroids",
  "poloroids",
  "mug",
  "coffee mug",
  "lamp",
  "panda lamp",
  "panda",
  "keychain",
  "key chain",
  "paperweight",
  "paper weight",
  "hamper",
  "gift box",
  "spotify",
  "music plaque",
  "custom",
  "gift"
];

for (const q of testQueries) {
  const matches = products.filter(p => isFuzzyMatch(getSearchableText(p), q)).map(p => p.name);
  console.log(`Query: "${q.padEnd(14)}" -> [${matches.length}] => ${matches.join(", ")}`);
}
