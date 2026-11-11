// Test suite for Birthday & 72-Hour Milestone Pop-up & Loved Ones Feature
import {
  getBirthdayStatus,
  getLovedOnesStatus,
  getUpcomingLovedOnesBirthdays,
  getActiveCelebrationTarget,
  isCustomerEligibleForBirthdayDiscount,
} from '../src/lib/birthdayHelper.ts';

console.log("================================================================================");
console.log("   PIXELLOSTORE — BIRTHDAY & 72-HOUR POPUP & LOVED ONES FEATURE TESTS           ");
console.log("================================================================================");

let passed = 0;
let total = 0;

function assert(condition, testName, details = "") {
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

// 1. Birthday Today Test
const now = new Date();
const todayStr = `2000-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
const todayStatus = getBirthdayStatus(todayStr);
assert(
  todayStatus.isToday && todayStatus.isWithin72Hours,
  "Birthday on today's date triggers active celebration window",
  `isToday=${todayStatus.isToday}, isWithin72Hours=${todayStatus.isWithin72Hours}`
);

// 2. Birthday in 2 days (48 hours)
const inTwoDays = new Date(Date.now() + 48 * 60 * 60 * 1000);
const twoDaysStr = `1998-${(inTwoDays.getMonth() + 1).toString().padStart(2, '0')}-${inTwoDays.getDate().toString().padStart(2, '0')}`;
const twoDaysStatus = getBirthdayStatus(twoDaysStr);
assert(
  twoDaysStatus.isWithin72Hours && twoDaysStatus.hoursUntil > 0 && twoDaysStatus.hoursUntil <= 72,
  "Birthday in 48 hours is strictly recognized within 72-hour celebration window",
  `hoursUntil=${twoDaysStatus.hoursUntil}h, coupon=${twoDaysStatus.couponCode}`
);

// 3. Birthday far in future (e.g. in 60 days)
const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
const in60DaysStr = `1995-${(in60Days.getMonth() + 1).toString().padStart(2, '0')}-${in60Days.getDate().toString().padStart(2, '0')}`;
const farStatus = getBirthdayStatus(in60DaysStr);
assert(
  !farStatus.isWithin72Hours && farStatus.daysUntil >= 58,
  "Birthday far in future (>72 hours) does not prematurely activate celebration popup",
  `isWithin72Hours=${farStatus.isWithin72Hours}, daysUntil=${farStatus.daysUntil}`
);

// 4. Test Customer Eligibility for Birthday Discount
assert(
  isCustomerEligibleForBirthdayDiscount(todayStr) === true,
  "Customer with birthday today is eligible for exclusive BDAY25 discount",
  "Eligible: true"
);

assert(
  isCustomerEligibleForBirthdayDiscount(twoDaysStr) === true,
  "Customer with birthday in 48h is eligible for exclusive BDAY25 discount",
  "Eligible: true"
);

assert(
  isCustomerEligibleForBirthdayDiscount(in60DaysStr) === false,
  "Customer with birthday 60 days away is NOT eligible for exclusive BDAY25 discount",
  "Eligible: false"
);

assert(
  isCustomerEligibleForBirthdayDiscount(null) === false && isCustomerEligibleForBirthdayDiscount("") === false,
  "Customer without birthday set is NOT eligible for exclusive BDAY25 discount",
  "Eligible: false"
);

// 5. Test Loved Ones Birthday Detection
const sampleLovedOnes = [
  { id: "lo_1", name: "Arjun", relationship: "Best Friend", birthday: twoDaysStr },
  { id: "lo_2", name: "Mother", relationship: "Mother", birthday: in60DaysStr },
  { id: "lo_3", name: "Priya", relationship: "Partner / Spouse", birthday: todayStr },
];

const lovedStatuses = getLovedOnesStatus(sampleLovedOnes);
assert(
  lovedStatuses.length === 3,
  "getLovedOnesStatus calculates statuses for all saved loved ones",
  `Count: ${lovedStatuses.length}`
);

const upcomingLovedOnes = getUpcomingLovedOnesBirthdays(sampleLovedOnes);
assert(
  upcomingLovedOnes.length === 2,
  "getUpcomingLovedOnesBirthdays correctly filters only those within 72h (Arjun & Priya)",
  `Upcoming: ${upcomingLovedOnes.map(u => u.lovedOne.name).join(", ")}`
);

// 6. Test Active Celebration Target Resolution
// Case A: User has far birthday, loved one Arjun is approaching -> Active target is Arjun
const targetA = getActiveCelebrationTarget(in60DaysStr, "Harshavardhan", [sampleLovedOnes[0]]);
assert(
  targetA !== null && targetA.type === "loved_one" && targetA.name === "Arjun",
  "Active celebration target correctly falls back to approaching loved one when self birthday is not active",
  `Target: ${targetA?.type} (${targetA?.name} - ${targetA?.relationship})`
);

// Case B: User has birthday today, loved one also approaching -> Self birthday takes precedence
const targetB = getActiveCelebrationTarget(todayStr, "Harshavardhan", [sampleLovedOnes[0]]);
assert(
  targetB !== null && targetB.type === "self" && targetB.name === "Harshavardhan",
  "Active celebration target gives precedence to customer's self birthday when active",
  `Target: ${targetB?.type} (${targetB?.name})`
);

// Case C: Neither has upcoming birthday -> Returns null
const targetC = getActiveCelebrationTarget(in60DaysStr, "Harshavardhan", [sampleLovedOnes[1]]);
assert(
  targetC === null,
  "Active celebration target returns null when no birthdays are within 72 hours",
  `Target: ${targetC}`
);

// 7. Test BDAY25 Promo API
async function testPromoApi() {
  try {
    const res = await fetch("http://localhost:3000/api/promos?code=BDAY25");
    const data = await res.json();
    assert(
      res.status === 200 && data.success && data.promo.value === 25,
      "Promo API recognizes BDAY25 code with 25% discount",
      `Code: ${data.promo?.code}, Discount: ${data.promo?.value}%`
    );
  } catch (e) {
    assert(false, "Promo API test failed", e.message);
  }

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================");
}

testPromoApi();
