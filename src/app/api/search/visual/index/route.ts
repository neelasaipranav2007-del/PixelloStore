import { NextResponse } from "next/server";
import { indexCatalogProducts, readCachedIndex } from "@/lib/visualSearch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = readCachedIndex();
    return NextResponse.json({
      success: true,
      totalIndexed: Object.keys(cached).length,
      items: Object.values(cached).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        imageUrl: item.imageUrl,
        updatedAt: item.updatedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let forceReindex = false;
    try {
      const body = await req.json();
      if (body.forceReindex) forceReindex = true;
    } catch {}

    const result = await indexCatalogProducts(forceReindex);

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${result.totalIndexed} catalog product images (${result.newlyIndexed} newly indexed).`,
      summary: result,
    });
  } catch (error: any) {
    console.error("[Visual Search Index Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
