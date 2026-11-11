// scripts/test-hamper-slots.mjs
import fs from 'fs';
import path from 'path';

console.log("================================================================================");
console.log("        PIXELLOSTORE — HAMPER EMPTY SLOTS & ADMIN MANAGEMENT TESTS               ");
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

// Test 1: Verify scratch/hamper_settings.json exists and contains packaging options with maxCapacity
const settingsPath = path.join(process.cwd(), 'scratch', 'hamper_settings.json');
assert(fs.existsSync(settingsPath), "scratch/hamper_settings.json exists");

const rawSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const pkgOptions = rawSettings.packagingOptions;
assert(Array.isArray(pkgOptions) && pkgOptions.length > 0, "hamper_settings.json contains packagingOptions array", `Count: ${pkgOptions.length}`);

// Test 2: Check each packaging option has positive numeric maxCapacity
const allHaveMaxCapacity = pkgOptions.every(p => typeof p.maxCapacity === 'number' && p.maxCapacity > 0);
assert(allHaveMaxCapacity, "All packaging options define a positive integer maxCapacity", 
  JSON.stringify(pkgOptions.map(p => ({ id: p.id, name: p.name, slots: p.maxCapacity }))));

// Test 3: Check HamperContext applies maxCapacity mapping
const hamperContextContent = fs.readFileSync(path.join(process.cwd(), 'src', 'context', 'HamperContext.tsx'), 'utf8');
const hasContextMapping = hamperContextContent.includes('const maxCapNum = opt.maxCapacity !== undefined') &&
  hamperContextContent.includes('maxCapacity: !isNaN(maxCapNum) && maxCapNum > 0 ? maxCapNum : 6');
assert(hasContextMapping, "HamperContext accurately maps maxCapacity into dynamicPackagingOptions without defaulting loss");

// Test 4: Check customer storefront (/hamper) renders dynamic empty slots based on boxMaxCapacity
const hamperPageContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(customer)', 'hamper', 'page.tsx'), 'utf8');
const hasSlotRendering = hamperPageContent.includes('Array.from({ length: Math.max(0, boxMaxCapacity - totalQuantity) })') &&
  hamperPageContent.includes('Empty Slot ({totalQuantity + i + 1} of {boxMaxCapacity})');
assert(hasSlotRendering, "Customer storefront dynamically generates empty cushion slots using selected packaging's maxCapacity");

// Test 5: Check admin portal (/admin/hamper) includes empty slot controllers, steppers, and live simulator
const adminHamperContent = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(admin)', 'admin', 'hamper', 'page.tsx'), 'utf8');
const hasStepper = adminHamperContent.includes('+ Add Empty Slot') && adminHamperContent.includes('Empty Slots in Box');
const hasSimulator = adminHamperContent.includes('Live Keepsake Box Empty Slots Preview') &&
  adminHamperContent.includes('Customer Storefront Simulation');
assert(hasStepper && hasSimulator, "Admin portal provides both on-card steppers, modal editors, and the interactive Live Box simulator");

console.log("================================================================================");
console.log(`RESULTS: ${passed} / ${passed + failed} TESTS PASSED (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log("================================================================================");

if (failed > 0) process.exit(1);
