import { getAdminSecurityConfig, saveAdminSecurityConfig, verifyAdminCredentials } from "../src/lib/adminSecurity.ts";
import { prisma } from "../src/lib/db.ts";

async function runTests() {
  console.log("=== RUNNING ADMIN RESET & 2-FACTOR AUTHENTICATION TESTS ===");

  // 1. Check default config
  const config = await getAdminSecurityConfig();
  console.log("✓ Default config loaded:", {
    passwordSet: Boolean(config.loginPassword),
    securityPin: config.securityPin,
  });

  // 2. Test verifyAdminCredentials with wrong password
  const failPass = await verifyAdminCredentials("wrong_pass_123", "1234");
  if (failPass.valid === false && failPass.error?.includes("Password")) {
    console.log("✓ Correctly rejected wrong password:", failPass.error);
  } else {
    throw new Error("Failed wrong password check");
  }

  // 3. Test verifyAdminCredentials with wrong PIN
  const failPin = await verifyAdminCredentials("admin123", "9999");
  if (failPin.valid === false && failPin.error?.includes("PIN")) {
    console.log("✓ Correctly rejected wrong 4-digit PIN:", failPin.error);
  } else {
    throw new Error("Failed wrong PIN check");
  }

  // 4. Test verifyAdminCredentials with valid default credentials
  const successDef = await verifyAdminCredentials("admin123", "1234");
  if (successDef.valid === true) {
    console.log("✓ Successfully authenticated with default credentials (admin123 / 1234)");
  } else {
    throw new Error("Failed default credentials verification: " + successDef.error);
  }

  // 5. Test updating credentials to custom password and custom PIN
  const updated = await saveAdminSecurityConfig({
    loginPassword: "customPassword2026",
    securityPin: "5678",
  });
  console.log("✓ Successfully updated credentials:", {
    loginPassword: updated.loginPassword,
    securityPin: updated.securityPin,
  });

  const customVerify = await verifyAdminCredentials("customPassword2026", "5678");
  if (customVerify.valid === true) {
    console.log("✓ Verified custom password + custom 4-digit PIN successfully!");
  } else {
    throw new Error("Failed custom verification: " + customVerify.error);
  }

  // 6. Restore default test credentials
  await saveAdminSecurityConfig({
    loginPassword: "admin123",
    securityPin: "1234",
  });
  console.log("✓ Restored default credentials for portal usability (admin123 / 1234)");

  console.log("🎉 ALL ADMIN SECURITY & 2FA TESTS PASSED (100%)");
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });
