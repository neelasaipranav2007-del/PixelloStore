// Centralized Catalog Search Engine for Pixello Store
// Provides fuzzy matching, typo tolerance, synonyms, and tokenized keyword search.

export const SEARCH_TYPO_MAP: Record<string, string> = {
  poloroid: "polaroid",
  poloroids: "polaroid",
  polroid: "polaroid",
  polroids: "polaroid",
  plaroid: "polaroid",
  fraem: "frame",
  fraems: "frame",
  freme: "frame",
  fram: "frame",
  frams: "frame",
  frames: "frame",
  mugg: "mug",
  muggs: "mug",
  mugs: "mug",
  spotifi: "spotify",
  spotfy: "spotify",
  colage: "collage",
  coladge: "collage",
  keychan: "keychain",
  keychain: "keychain",
  keychains: "keychain",
  lampp: "lamp",
  lampps: "lamp",
  lamps: "lamp",
  gifts: "gift",
  gifting: "gift",
  pic: "photo",
  pics: "photo",
  picture: "photo",
  pictures: "photo",
  photu: "photo",
  photos: "photo",
};

export function levenshteinDistance(a: string, b: string): number {
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

export function getSearchableText(product: {
  name: string;
  category?: string;
  description?: string;
  badge?: string;
  badgeTag?: string;
  aboutTitle?: string;
  aboutPoints?: string[];
  variants?: Array<{ name: string; description?: string }>;
  frameSizes?: Array<{ label?: string; name?: string; dimensions?: string }>;
}): string {
  const parts: string[] = [
    product.name || "",
    product.category || "",
    product.description || "",
    product.badge || "",
    product.badgeTag || "",
    product.aboutTitle || "",
    ...(product.aboutPoints || []),
    ...(product.variants?.map((v) => `${v.name} ${v.description || ""}`) || []),
    ...(product.frameSizes?.map((s) => `${s.label || ""} ${s.name || ""} ${s.dimensions || ""}`) || []),
  ];

  const nameLow = (product.name || "").toLowerCase();
  const catLow = (product.category || "").toLowerCase();

  // Frames synonyms & tags
  if (catLow.includes("frame") || nameLow.includes("frame")) {
    parts.push(
      "photo",
      "photos",
      "photo frame",
      "picture",
      "picture frame",
      "wood",
      "wooden",
      "solid wood",
      "wall frame",
      "table frame",
      "custom frame",
      "personalized frame",
      "pine wood",
      "framing",
      "memories",
      "keepsake",
      "gift",
      "gifting",
      "anniversary",
      "birthday"
    );
  }

  // Polaroids synonyms & tags
  if (catLow.includes("polaroid") || nameLow.includes("polaroid")) {
    parts.push(
      "photo",
      "photos",
      "prints",
      "photo print",
      "retro",
      "fuji",
      "aesthetic",
      "custom",
      "mini",
      "album",
      "polaroids",
      "film",
      "polaroid prints",
      "memories",
      "gift"
    );
  }

  // Mug synonyms & tags
  if (catLow.includes("mug") || nameLow.includes("mug")) {
    parts.push(
      "cup",
      "coffee",
      "tea",
      "magic mug",
      "heat reveal",
      "ceramic",
      "drinkware",
      "photo mug",
      "custom mug",
      "gift"
    );
  }

  // Lamp / LED / Light synonyms & tags
  if (catLow.includes("led") || nameLow.includes("lamp") || nameLow.includes("light") || nameLow.includes("lighting")) {
    parts.push(
      "lamp",
      "lamps",
      "night light",
      "acrylic lamp",
      "lighting",
      "light",
      "glow",
      "led",
      "warm light",
      "ambient",
      "desk lamp",
      "room decor",
      "gift"
    );
  }

  // Cute Panda lamp specific
  if (nameLow.includes("panda")) {
    parts.push("panda", "panda lamp", "moss panda", "cute lamp", "bedside lamp", "toy lamp", "night light", "room decor");
  }

  // Spotify / Music plaque synonyms
  if (nameLow.includes("spotify") || nameLow.includes("plaque") || nameLow.includes("music")) {
    parts.push(
      "music",
      "song",
      "scannable",
      "qr",
      "code",
      "acrylic plaque",
      "album cover",
      "sound wave",
      "playlist",
      "spotify code",
      "gift"
    );
  }

  // Paper weight / Crystal synonyms
  if (nameLow.includes("paper weight") || nameLow.includes("paperweight") || nameLow.includes("crystal")) {
    parts.push(
      "paperweight",
      "paper weight",
      "crystal",
      "resin",
      "couple",
      "love",
      "keepsake",
      "forever us",
      "desk decor",
      "gift"
    );
  }

  // Keychain synonyms
  if (nameLow.includes("key") || nameLow.includes("chain") || catLow.includes("key")) {
    parts.push(
      "keychain",
      "key chain",
      "keychains",
      "key chains",
      "keyring",
      "key ring",
      "pocket",
      "acrylic keychain",
      "gift"
    );
  }

  // Hamper / Combo box synonyms
  if (nameLow.includes("hamper") || catLow.includes("hamper")) {
    parts.push(
      "gift box",
      "hamper",
      "hampers",
      "gift hamper",
      "surprise box",
      "basket",
      "combo",
      "custom gift box",
      "present",
      "gift"
    );
  }

  return parts.join(" ").toLowerCase();
}

export function isFuzzyMatch(searchableText: string, queryInput: string): boolean {
  if (!queryInput || !queryInput.trim()) return true;

  const cleanTarget = (searchableText || "").toLowerCase();
  const rawQuery = queryInput.toLowerCase().trim();

  // 1. Direct exact substring match
  if (cleanTarget.includes(rawQuery)) return true;

  // 2. Space-stripped & punctuation-stripped match (e.g. "keychain" <-> "key chain", "paperweight" <-> "paper weight")
  const compactTarget = cleanTarget.replace(/[^a-z0-9]/g, "");
  const compactQuery = rawQuery.replace(/[^a-z0-9]/g, "");
  if (compactQuery && compactTarget.includes(compactQuery)) return true;

  // 3. Whole-phrase typo map check
  const normalizedQuery = SEARCH_TYPO_MAP[rawQuery] || rawQuery;
  if (cleanTarget.includes(normalizedQuery)) return true;

  // 4. Tokenized AND-matching: Every word in the query must find a match in the target document
  const queryTokens = rawQuery.split(/[\s,-]+/).filter((t) => t.length > 0);
  const targetTokens = cleanTarget.split(/[\s,-]+/).filter((t) => t.length > 0);

  const allTokensMatch = queryTokens.every((qToken) => {
    const normQ = SEARCH_TYPO_MAP[qToken] || qToken;

    // Direct token or compact token match
    if (cleanTarget.includes(normQ) || compactTarget.includes(normQ.replace(/[^a-z0-9]/g, ""))) {
      return true;
    }

    // Stemming (e.g. "frames" -> "frame", "polaroids" -> "polaroid", "prints" -> "print", "lights" -> "light")
    const stemmed = normQ.endsWith("s") && normQ.length > 3 ? normQ.slice(0, -1) : normQ;
    if (cleanTarget.includes(stemmed)) return true;

    // Fuzzy typo match per token
    if (normQ.length >= 3) {
      for (const tToken of targetTokens) {
        if (tToken.includes(normQ)) return true;
        if (
          tToken.length >= 4 &&
          normQ.length >= 4 &&
          Math.abs(normQ.length - tToken.length) <= 2 &&
          (normQ.startsWith(tToken) || tToken.startsWith(normQ))
        ) {
          return true;
        }
        const maxDist = normQ.length >= 7 ? 2 : normQ.length >= 4 ? 1 : 0;
        if (maxDist > 0 && levenshteinDistance(normQ, tToken) <= maxDist) {
          return true;
        }
      }
    }

    return false;
  });

  return allTokensMatch;
}
