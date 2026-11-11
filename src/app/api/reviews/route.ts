import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";
import { getAuthenticatedAdmin } from "@/lib/session";
import { sanitizeText } from "@/lib/validators";
import { safeErrorResponse } from "@/lib/errorHandler";

export const dynamic = "force-dynamic";

const DEFAULT_REVIEWS = [
  {
    id: "rev-1",
    orderId: "PXL-6610-8001",
    productName: "Premium Wooden Frame",
    productSize: "4x6 INCH (180 GSM, Black Frame)",
    productImage: "/images/wooden_frame_main.png",
    rating: 5,
    title: "Exceptional Frame Finish & Print Clarity!",
    comment: "The wooden frame is solidly crafted and the photo quality exceeded my expectations. Colors came out vivid and true to life.",
    tags: ["Crisp HD Print Clarity", "Sturdy Pine Wood Frame", "Rich & Vibrant Colors"],
    photoUrl: null,
    reviewerName: "Harsha",
    reviewerEmail: "7989856610@pixello.store",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "Published",
    featured: true,
    adminReply: "Thank you Harsha! We are thrilled that you loved the frame finish and clarity.",
  },
  {
    id: "rev-2",
    orderId: "PXL-1231-0070",
    productName: "Classic Custom Polaroid Set (24 prints)",
    productSize: "Classic 300 GSM Pack of 24",
    productImage: "/images/polaroid_set.png",
    rating: 5,
    title: "Aesthetic Retro Vibes • Perfect for Scrapbook",
    comment: "Ordered these for our anniversary scrapbooking album. The 300 GSM paper feels super premium and smudge-proof!",
    tags: ["Crisp HD Print Clarity", "Express Safe Packaging", "Great Value for Money"],
    photoUrl: null,
    reviewerName: "Sai Pranav",
    reviewerEmail: "neelasaipranav2007@gmail.com",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "Published",
    featured: true,
    adminReply: null,
  },
  {
    id: "rev-3",
    orderId: "PXL-4482-1920",
    productName: "LED Acrylic Photo Lamp",
    productSize: "Solid Teak Base • Warm Glow",
    productImage: "/images/led_acrylic_lamp.png",
    rating: 4,
    title: "Good Warm Ambient Light",
    comment: "Good quality lamp and warm lighting on my desk. Laser engraving was very neat.",
    tags: ["Sturdy Frame", "Smooth Matt Finish"],
    photoUrl: null,
    reviewerName: "Pooja Sharma",
    reviewerEmail: "pooja.sharma@campus.edu",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: "Published",
    featured: false,
    adminReply: null,
  }
];

async function getStoredReviews(): Promise<any[]> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: "pixello_customer_reviews" },
    });
    if (record && record.value) {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading stored reviews:", err);
  }
  return DEFAULT_REVIEWS;
}

async function saveStoredReviews(reviews: any[]) {
  try {
    await prisma.systemSetting.upsert({
      where: { key: "pixello_customer_reviews" },
      update: { value: JSON.stringify(reviews) },
      create: { key: "pixello_customer_reviews", value: JSON.stringify(reviews) },
    });
  } catch (err) {
    console.error("Error saving stored reviews:", err);
  }
}

export async function GET() {
  try {
    const reviews = await getStoredReviews();

    const total = reviews.length;
    const sumRating = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avgRating = total > 0 ? (sumRating / total).toFixed(1) : "5.0";

    const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
      ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        total,
        averageRating: Number(avgRating),
        ratingCounts,
        fiveStarPercentage: total > 0 ? Math.round(((ratingCounts[5] || 0) / total) * 100) : 100,
      }
    });
  } catch (error: any) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      productName,
      productSize,
      productImage,
      rating,
      title,
      comment,
      tags,
      photoUrl,
      reviewerName,
      reviewerEmail,
    } = body;

    if (!orderId || !productName) {
      return NextResponse.json({ success: false, error: "Order ID and Product Name are required." }, { status: 400 });
    }

    const reviews = await getStoredReviews();
    const existingIdx = reviews.findIndex(
      (r) => r.orderId === orderId && r.productName === productName
    );

    const newReview = {
      id: existingIdx >= 0 ? reviews[existingIdx].id : `rev-${Date.now()}`,
      orderId,
      productName: sanitizeText(productName, 100),
      productSize: sanitizeText(productSize || "Standard", 50),
      productImage: productImage || "/images/wooden_frame_main.png",
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      title: sanitizeText(title || "Product Review", 150),
      comment: sanitizeText(comment || "", 1000),
      tags: Array.isArray(tags) ? tags.map((t: any) => sanitizeText(String(t), 50)) : [],
      photoUrl: photoUrl || null,
      reviewerName: sanitizeText(reviewerName || "Verified Customer", 100),
      reviewerEmail: sanitizeText(reviewerEmail || "", 100),
      createdAt: new Date().toISOString(),
      status: "Published",
      featured: false,
      adminReply: existingIdx >= 0 ? reviews[existingIdx].adminReply : null,
    };

    let updatedReviews: any[];
    if (existingIdx >= 0) {
      updatedReviews = [...reviews];
      updatedReviews[existingIdx] = newReview;
    } else {
      updatedReviews = [newReview, ...reviews];
    }

    await saveStoredReviews(updatedReviews);

    // Create Notification for Admin
    await prisma.notification.create({
      data: {
        role: "ADMIN",
        type: "REVIEW_RECEIVED",
        title: "New Review Received",
        message: `${newReview.reviewerName} rated ${newReview.rating}★ on ${newReview.productName}: "${newReview.title}"`,
        referenceType: "REVIEW",
        referenceId: newReview.id,
      },
    }).catch(() => {});

    // Broadcast review & notification events
    portalEvents.emit("new_review", newReview);
    portalEvents.emit("notification_change", { action: "CREATE", type: "REVIEW" });

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to moderate reviews." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, featured, status, adminReply } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID required." }, { status: 400 });
    }

    const reviews = await getStoredReviews();
    const targetIdx = reviews.findIndex((r) => r.id === id);

    if (targetIdx === -1) {
      return NextResponse.json({ success: false, error: "Review not found." }, { status: 404 });
    }

    const updated = {
      ...reviews[targetIdx],
      ...(featured !== undefined && { featured: Boolean(featured) }),
      ...(status !== undefined && { status }),
      ...(adminReply !== undefined && { adminReply }),
    };

    reviews[targetIdx] = updated;
    await saveStoredReviews(reviews);

    // If Admin replied, create customer notification
    if (adminReply && adminReply.trim()) {
      await prisma.notification.create({
        data: {
          role: "CUSTOMER",
          type: "STUDIO_REPLY",
          title: "Pixello Studio Team",
          message: adminReply,
          referenceType: "ORDER",
          referenceId: updated.orderId,
        },
      }).catch(() => {});

      portalEvents.emit("notification_change", { action: "CREATE", type: "REPLY" });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to delete reviews." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID required." }, { status: 400 });
    }

    const reviews = await getStoredReviews();
    const filtered = reviews.filter((r) => r.id !== id);
    await saveStoredReviews(filtered);

    return NextResponse.json({ success: true, message: "Review removed." });
  } catch (error: any) {
    console.error("DELETE /api/reviews error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
