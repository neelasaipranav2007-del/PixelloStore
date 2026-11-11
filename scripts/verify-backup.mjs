import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient } from "@libsql/client";

const BACKUP_DIR = path.join(process.cwd(), "backups");

async function verifyLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error("No backups directory found.");
    process.exit(1);
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("db-backup-") && f.endsWith(".db"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("No backup files found to verify.");
    process.exit(1);
  }

  const latestBackup = files[0];
  const backupPath = path.join(BACKUP_DIR, latestBackup);
  const checksumPath = `${backupPath}.sha256`;

  console.log(`[Verification] Testing latest backup: ${latestBackup}`);

  // 1. Verify Checksum
  if (!fs.existsSync(checksumPath)) {
    throw new Error(`Checksum file missing for ${latestBackup}`);
  }

  const expectedHash = fs.readFileSync(checksumPath, "utf8").trim();
  const fileBuffer = fs.readFileSync(backupPath);
  const actualHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

  if (expectedHash !== actualHash) {
    throw new Error(`Checksum mismatch! Expected: ${expectedHash}, Actual: ${actualHash}`);
  }
  console.log("✓ SHA-256 checksum verified perfectly.");

  // 2. Perform Isolated Restore Test
  const testRestorePath = path.join(BACKUP_DIR, "test-restore-isolated.db");
  fs.copyFileSync(backupPath, testRestorePath);

  try {
    const client = createClient({
      url: `file:${testRestorePath.replace(/\\/g, "/")}`,
    });

    // 3. Database Consistency & Integrity Check
    const integrityRes = await client.execute("PRAGMA integrity_check;");
    const integrityResult = integrityRes.rows[0]?.[0];
    if (integrityResult !== "ok") {
      throw new Error(`SQLite integrity check failed: ${integrityResult}`);
    }
    console.log("✓ PRAGMA integrity_check: ok");

    // 4. Verify Critical Tables and Record Counts
    const userCount = await client.execute("SELECT count(*) as count FROM User;");
    const productCount = await client.execute("SELECT count(*) as count FROM Product;");
    const orderCount = await client.execute("SELECT count(*) as count FROM \"Order\";");

    console.log(`✓ Data consistency verified:`);
    console.log(`  - Users: ${userCount.rows[0].count}`);
    console.log(`  - Products: ${productCount.rows[0].count}`);
    console.log(`  - Orders: ${orderCount.rows[0].count}`);

    client.close();
    console.log("✓ All backup restoration and consistency checks passed successfully.");
  } finally {
    // Wait briefly on Windows to allow file handle release
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      if (fs.existsSync(testRestorePath)) {
        fs.unlinkSync(testRestorePath);
      }
    } catch (e) {
      // Ignored if file lock is pending release
    }
  }
}

verifyLatestBackup().catch((err) => {
  console.error("Backup verification failed:", err);
  process.exit(1);
});
