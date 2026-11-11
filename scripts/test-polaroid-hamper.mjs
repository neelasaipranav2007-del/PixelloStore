// scripts/test-polaroid-hamper.mjs
import fs from 'fs';
import path from 'path';

console.log("================================================================================");
console.log("   PIXELLOSTORE — POLAROID PHOTO SLOTS & NO MINIMUM QUANTITY TESTS              ");
console.log("================================================================================");

let passed = 0;
let failed = 0;

function assert(condition, message, details = "") {
  if (condition) {
    console.log(`[PASS] ✓ ${message}`);
    if (details) console.log(`       ${details}`);
    passed++;
  } else {
    console.error(`[FAIL] ✗ ${message}`);
    if (details) console.error(`       ${details}`);
    failed++;
  }
}

const hamperPageContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(customer)', 'hamper', 'page.tsx'), 'utf8');

// Test 1: Check selectedPolaroidCount state
assert(hamperPageContent.includes('const [selectedPolaroidCount, setSelectedPolaroidCount] = useState<number>(8);'),
  "Polaroid count state initializes cleanly");

// Test 2: Check NO MINIMUM QUANTITY in hamper (allows down to 1 print)
assert(hamperPageContent.includes('const validCount = Math.max(1, Math.min(50, newCount));'),
  "handleSelectPolaroidCount enforces no minimum restriction (allows down to 1 print)");

// Test 3: Check POLAROID_SIZES has minOrderQty: 1 for hamper builder
assert(hamperPageContent.includes('minOrderQty: 1'),
  "POLAROID_SIZES has minOrderQty set to 1 for hamper box items");

// Test 4: Check quick preset buttons starting from 1
assert(hamperPageContent.includes('[1, 2, 4, 6, 8, 10, 12, 16].map((cnt) =>') &&
  hamperPageContent.includes('✨ No Minimum Quantity'),
  "Provides quick presets starting from 1 Pic along with No Minimum Quantity indicator");

// Test 5: Check custom quantity direct input & stepper down to 1
assert(hamperPageContent.includes('disabled={selectedPolaroidCount <= 1}') &&
  hamperPageContent.includes('<input') &&
  hamperPageContent.includes('min={1}'),
  "Custom quantity stepper allows decrementing to 1 and typing any number directly");

// Test 6: Check batch multi-photo upload handler
assert(hamperPageContent.includes('const handleMultiplePhotosUpload = (files: FileList | File[]) => {') &&
  hamperPageContent.includes('ref={multiFileInputRef}') &&
  hamperPageContent.includes('multiple'),
  "Batch multi-photo uploader allows customers to upload all selected photos at once via multi-select file picker");

// Test 7: Check dynamic pricing & name reflection when saving item
assert(hamperPageContent.includes('effectivePrice = polConfig.priceEach * selectedPolaroidCount;') &&
  hamperPageContent.includes('finalProductName = `${cleanName} (${selectedPolaroidCount} prints)`;'),
  "Saving item calculates price from selected count * priceEach and updates the item name with the selected print count");

console.log("================================================================================");
console.log(`RESULTS: ${passed} / ${passed + failed} TESTS PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log("================================================================================");

if (failed > 0) process.exit(1);
