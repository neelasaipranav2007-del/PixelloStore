import fs from "fs";
import path from "path";
import crypto from "crypto";

// Active database in root or prisma directory
const DB_PATH = fs.existsSync(path.join(process.cwd(), "dev.db"))
  ? path.join(process.cwd(), "dev.db")
  : path.join(process.cwd(), "prisma", "dev.db");

const BACKUP_DIR = path.join(process.cwd(), "backups");
const RETENTION_DAYS = 7;

export function performBackup() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("Database file not found at:", DB_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `db-backup-${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  // Copy database file safely
  fs.copyFileSync(DB_PATH, backupFilePath);

  // Update mtime to current timestamp
  const now = new Date();
  fs.utimesSync(backupFilePath, now, now);

  // Calculate SHA-256 checksum for verification
  const fileBuffer = fs.readFileSync(backupFilePath);
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  const checksumFilePath = `${backupFilePath}.sha256`;
  fs.writeFileSync(checksumFilePath, hash, "utf8");

  const stats = fs.statSync(backupFilePath);
  console.log(`[Backup Success] Created: ${backupFileName}`);
  console.log(`Source: ${DB_PATH} | Size: ${(stats.size / 1024).toFixed(2)} KB | SHA-256: ${hash}`);

  // Apply retention policy: remove backups older than RETENTION_DAYS
  const cutoffTime = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUP_DIR);
  let prunedCount = 0;

  for (const f of files) {
    if (f.startsWith("db-backup-") && f !== backupFileName && f !== `${backupFileName}.sha256`) {
      const fullPath = path.join(BACKUP_DIR, f);
      const fileStat = fs.statSync(fullPath);
      if (fileStat.mtimeMs < cutoffTime) {
        fs.unlinkSync(fullPath);
        prunedCount++;
      }
    }
  }

  if (prunedCount > 0) {
    console.log(`[Retention] Pruned ${prunedCount} backup files older than ${RETENTION_DAYS} days.`);
  }

  return { backupFilePath, checksumFilePath, hash, sizeBytes: stats.size };
}

performBackup();
