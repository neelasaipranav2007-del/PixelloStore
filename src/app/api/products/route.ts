import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { logAudit } from "@/lib/auditLogger";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

function formatProduct(p: any) {
  let images = [];
  try {
    images = typeof p.images === "string" ? JSON.parse(p.images) : p.images || [];
  } catch (e) {
    images = [p.images || "/images/wooden_frame_main.png"];
  }

  let frameSizes = undefined;
  if (p.frameSizes) {
    try {
      frameSizes = typeof p.frameSizes === "string" ? JSON.parse(p.frameSizes) : p.frameSizes;
    } catch (e) {}
  }

  let frameColors = undefined;
  if (p.frameColors) {
    try {
      frameColors = typeof p.frameColors === "string" ? JSON.parse(p.frameColors) : p.frameColors;
    } catch (e) {}
  }

  let polaroidSizes = undefined;
  if (p.polaroidSizes) {
    try {
      polaroidSizes = typeof p.polaroidSizes === "string" ? JSON.parse(p.polaroidSizes) : p.polaroidSizes;
    } catch (e) {}
  }

  let variants = undefined;
  if (p.variants) {
    try {
      variants = typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants;
    } catch (e) {}
  }

  let aboutPoints = undefined;
  if (p.aboutPoints) {
    try {
      aboutPoints = typeof p.aboutPoints === "string" ? JSON.parse(p.aboutPoints) : p.aboutPoints;
    } catch (e) {}
  }

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.categoryName || (p.category?.name) || "Frames",
    categoryId: p.categoryId,
    description: p.description,
    price: p.basePrice,
    originalPrice: p.originalPrice,
    rating: p.rating || 4.8,
    reviews: p.reviews || 1,
    badgeTag: p.badgeTag,
    badge: p.badge,
    image: images[0] || "/images/wooden_frame_main.png",
    images,
    stock: p.stock !== undefined ? p.stock : 50,
    status: p.status || (p.stock === 0 ? "Out of Stock" : "Active"),
    isActive: p.isActive,
    frameSizes,
    frameColors,
    polaroidSizes,
    variants,
    aboutTitle: p.aboutTitle || undefined,
    aboutPoints,
    imageEmbedding: p.imageEmbedding || undefined,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category && category !== "All") {
      where.OR = [
        { categoryName: category },
        { category: { name: category } },
        { category: { slug: category.toLowerCase() } },
      ];
    }

    const dbProducts = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });

    const formatted = dbProducts.map(formatProduct);
    return NextResponse.json({ success: true, products: formatted });
  } catch (error: any) {
    console.error("Error fetching products from database:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to create products." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      category,
      price,
      originalPrice,
      description,
      badgeTag,
      badge,
      image,
      images,
      stock,
      status,
      frameSizes,
      frameColors,
      polaroidSizes,
      variants,
      aboutTitle,
      aboutPoints,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, error: "Product name and price are required." }, { status: 400 });
    }

    const genId = body.id || `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
    const genSlug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + `-${Math.floor(100 + Math.random() * 900)}`;

    const imageList = Array.isArray(images) && images.length > 0 ? images : [image || "/images/wooden_frame_main.png"];

    const created = await prisma.product.create({
      data: {
        id: genId,
        name,
        slug: genSlug,
        categoryName: category || "Frames",
        description: description || name,
        basePrice: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        badgeTag,
        badge,
        images: JSON.stringify(imageList),
        stock: stock !== undefined ? Number(stock) : 50,
        status: status || "Active",
        frameSizes: frameSizes ? JSON.stringify(frameSizes) : undefined,
        frameColors: frameColors ? JSON.stringify(frameColors) : undefined,
        polaroidSizes: polaroidSizes ? JSON.stringify(polaroidSizes) : undefined,
        variants: variants ? JSON.stringify(variants) : undefined,
        aboutTitle: aboutTitle || undefined,
        aboutPoints: aboutPoints ? JSON.stringify(aboutPoints) : undefined,
      },
    });

    const formatted = formatProduct(created);

    // Trigger visual index update in background
    import("@/lib/visualSearch").then(({ indexCatalogProducts }) => {
      indexCatalogProducts(false).catch(() => {});
    }).catch(() => {});

    portalEvents.emit("product_change", { action: "CREATE", product: formatted });

    logAudit({
      userId: admin.user.id,
      actorRole: "ADMIN",
      action: "PRODUCT_CREATED",
      targetId: created.id,
      details: { name: created.name, basePrice: created.basePrice },
      req,
    }).catch(() => {});

    return NextResponse.json({ success: true, product: formatted });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error creating product");
  }
}
