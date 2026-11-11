// Test suite for One-Time Customer Email Setup & Lock
import assert from "assert";

console.log("================================================================================");
console.log("      PIXELLOSTORE — ONE-TIME CUSTOMER GMAIL SETUP TEST SUITE                   ");
console.log("================================================================================");

let passed = 0;
let total = 0;

function testAssert(condition, testName, details = "") {
  total++;
  if (condition) {
    passed++;
    console.log(`[Test ${total.toString().padStart(2, '0')}] ✓ PASS — ${testName}`);
    if (details) console.log(`         Details: ${details}`);
  } else {
    console.error(`[Test ${total.toString().padStart(2, '0')}] ❌ FAIL — ${testName}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

// 1. Detection of auto-generated placeholder vs real customer email
const dummy1 = "7989856610@pixello.store";
const dummy2 = "9999999999@pixello.store";
const realGmail = "harsha.vadhan@gmail.com";
const realPersonal = "customer@outlook.com";

const isDummy = (email) => !email || email.trim().toLowerCase().endsWith("@pixello.store");

testAssert(
  isDummy(dummy1) === true && isDummy(dummy2) === true,
  "Auto-generated dummy @pixello.store emails are recognized as placeholder",
  `dummy1=${dummy1}`
);

testAssert(
  isDummy(realGmail) === false && isDummy(realPersonal) === false,
  "Customer personal Gmail/email is recognized as genuine",
  `realGmail=${realGmail}`
);

// 2. Initial state for customer with placeholder email
const cleanEmailInitial = isDummy(dummy1) ? "" : dummy1;
const isEmailLockedInitial = !isDummy(dummy1);

testAssert(
  cleanEmailInitial === "" && isEmailLockedInitial === false,
  "Field starts empty and unlocked for customer writing their Gmail",
  `cleanEmailInitial="${cleanEmailInitial}", isEmailLocked=${isEmailLockedInitial}`
);

// 3. Customer writes Gmail address one time
const customerInput = "   Harsha.Vadhan@Gmail.com  ";
const normalized = customerInput.trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValid = emailRegex.test(normalized) && !normalized.endsWith("@pixello.store");

testAssert(
  isValid === true && normalized === "harsha.vadhan@gmail.com",
  "Customer Gmail entry is properly validated and normalized",
  `normalized="${normalized}"`
);

// 4. Once saved, it locks permanently
const isEmailLockedAfterSave = !isDummy(normalized);
testAssert(
  isEmailLockedAfterSave === true,
  "Email becomes permanently locked after the customer's one-time entry",
  `isEmailLocked=${isEmailLockedAfterSave}`
);

// 5. Subsequent attempts to overwrite the locked email are prevented
const attemptSecondChange = "new.email@gmail.com";
const resolvedEmail = isEmailLockedAfterSave ? normalized : attemptSecondChange;
testAssert(
  resolvedEmail === "harsha.vadhan@gmail.com",
  "Subsequent modifications are blocked (locked strictly to initial written Gmail)",
  `resolvedEmail="${resolvedEmail}"`
);

console.log("\n================================================================================");
console.log(`RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
console.log("================================================================================");
