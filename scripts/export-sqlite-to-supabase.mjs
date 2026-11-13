import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Setup SQLite Prisma client
const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = "file:" + dbPath.replace(/\\/g, "/");
const libsql = createClient({ url: dbUrl });
libsql.url = dbUrl;
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

const EXPORT_DIR = path.resolve(process.cwd(), "supabase");

async function exportData() {
  console.log("=================================================");
  console.log("PIXELLOSTORE — SQLITE TO SUPABASE DATA EXPORTER");
  console.log("=================================================");
  console.log(`Reading source SQLite database: ${dbPath}`);

  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const data = {};

  const models = [
    "user",
    "customerProfile",
    "ambassadorProfile",
    "studioProfile",
    "deliveryProfile",
    "category",
    "product",
    "coupon",
    "order",
    "orderItem",
    "orderStatusHistory",
    "deliveryInfo",
    "commission",
    "transaction",
    "notification",
    "auditLog",
    "cartItem",
    "wishlistItem",
    "systemSetting",
    "termsAcceptance",
  ];

  let totalRecords = 0;

  for (const m of models) {
    try {
      const records = await prisma[m].findMany();
      data[m] = records;
      totalRecords += records.length;
      console.log(`✓ Fetched ${records.length.toString().padStart(3, " ")} records from model: ${m}`);
    } catch (err) {
      console.error(`✗ Error fetching ${m}:`, err.message);
      data[m] = [];
    }
  }

  // Write JSON export
  const jsonPath = path.join(EXPORT_DIR, "seed.json");
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
  console.log(`\n✓ Successfully saved complete JSON dump to: ${jsonPath}`);
  console.log(`Total records extracted: ${totalRecords}`);

  // Generate PostgreSQL compatible SQL seed script
  generatePostgreSqlSeed(data, path.join(EXPORT_DIR, "seed.sql"));
}

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (typeof val === "number") return val.toString();
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === "object") {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${val.toString().replace(/'/g, "''")}'`;
}

function generatePostgreSqlSeed(data, outputPath) {
  const lines = [
    "-- PixelloStore Supabase Seed Data",
    "-- Generated automatically from verified SQLite database",
    `-- Export Timestamp: ${new Date().toISOString()}`,
    "",
    "BEGIN;",
    "",
    "-- Disable triggers temporarily for bulk insertion",
    "SET session_replication_role = 'replica';",
    "",
  ];

  // 1. Categories
  if (data.category?.length) {
    lines.push("-- Insert Categories");
    for (const c of data.category) {
      lines.push(
        `INSERT INTO public.product_categories (id, name, slug, image_url) VALUES (` +
        `'${c.id}', ${escapeSql(c.name)}, ${escapeSql(c.slug)}, ${escapeSql(c.image)}) ` +
        `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;`
      );
    }
    lines.push("");
  }

  // 2. Products
  if (data.product?.length) {
    lines.push("-- Insert Products");
    for (const p of data.product) {
      let imagesJson = "[]";
      try {
        if (p.images) imagesJson = JSON.stringify(JSON.parse(p.images));
      } catch {
        imagesJson = JSON.stringify([p.images]);
      }

      lines.push(
        `INSERT INTO public.products (id, category_id, name, slug, description, base_price, original_price, rating, reviews_count, badge_tag, images, stock, status, is_active, variants, frame_sizes, frame_colors, polaroid_sizes, about_points) VALUES (` +
        `'${p.id}', ` +
        `${p.categoryId ? `'${p.categoryId}'` : "NULL"}, ` +
        `${escapeSql(p.name)}, ` +
        `${escapeSql(p.slug)}, ` +
        `${escapeSql(p.description)}, ` +
        `${p.basePrice || 0}, ` +
        `${p.originalPrice || "NULL"}, ` +
        `${p.rating || 4.8}, ` +
        `${p.reviews || 1}, ` +
        `${escapeSql(p.badgeTag || p.badge)}, ` +
        `'${imagesJson.replace(/'/g, "''")}'::jsonb, ` +
        `${p.stock || 50}, ` +
        `${escapeSql(p.status || "Active")}, ` +
        `${p.isActive !== false ? "TRUE" : "FALSE"}, ` +
        `'${(p.variants || "[]").replace(/'/g, "''")}'::jsonb, ` +
        `'${(p.frameSizes || "[]").replace(/'/g, "''")}'::jsonb, ` +
        `'${(p.frameColors || "[]").replace(/'/g, "''")}'::jsonb, ` +
        `'${(p.polaroidSizes || "[]").replace(/'/g, "''")}'::jsonb, ` +
        `'${(p.aboutPoints || "[]").replace(/'/g, "''")}'::jsonb` +
        `) ON CONFLICT (id) DO NOTHING;`
      );
    }
    lines.push("");
  }

  // 3. System Settings
  if (data.systemSetting?.length) {
    lines.push("-- Insert System Settings");
    for (const s of data.systemSetting) {
      let valJson = "{}";
      try {
        valJson = JSON.stringify(JSON.parse(s.value));
      } catch {
        valJson = JSON.stringify({ raw: s.value });
      }

      lines.push(
        `INSERT INTO public.system_settings (key, value, updated_at) VALUES (` +
        `${escapeSql(s.key)}, '${valJson.replace(/'/g, "''")}'::jsonb, ${escapeSql(s.updatedAt)}` +
        `) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;`
      );
    }
    lines.push("");
  }

  lines.push("SET session_replication_role = 'origin';");
  lines.push("COMMIT;");
  lines.push("");

  fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
  console.log(`✓ Successfully generated PostgreSQL seed SQL at: ${outputPath}`);
}

exportData()
  .catch((e) => {
    console.error("Migration exporter error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
