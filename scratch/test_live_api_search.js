const { getSearchableText, isFuzzyMatch } = require('../src/lib/catalogSearch.ts');

async function testLiveSearch() {
  const res = await fetch('http://localhost:3000/api/products');
  const data = await res.json();
  const products = data.products || [];

  console.log(`Fetched ${products.length} live products from database.`);

  const testQueries = [
    "frames",
    "frame",
    "photo frame",
    "picture frame",
    "photo",
    "polaroid",
    "polaroids",
    "poloroids", // common typo
    "mug",
    "coffee",
    "lamp",
    "panda",
    "panda lamp",
    "keychain",
    "key chain",
    "paper weight",
    "paperweight",
    "spotify",
    "music",
    "hamper",
    "gift",
    "custom"
  ];

  for (const q of testQueries) {
    const matched = products.filter(p => isFuzzyMatch(getSearchableText(p), q)).map(p => p.name);
    console.log(`Query: "${q.padEnd(14)}" -> (${matched.length}) : ${matched.join(" | ")}`);
  }
}

testLiveSearch().catch(console.error);
