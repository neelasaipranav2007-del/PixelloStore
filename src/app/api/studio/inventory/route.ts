import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { portalEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.studioInventory.findMany({
      orderBy: { itemName: "asc" },
    });
    return NextResponse.json({ success: true, inventory: items });
  } catch (error: any) {
    console.error("Error fetching studio inventory:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemName, category, stock, unit, minAlert } = body;

    if (!itemName) {
      return NextResponse.json({ success: false, error: "Item name is required" }, { status: 400 });
    }

    const created = await prisma.studioInventory.create({
      data: {
        itemName,
        category: category || "Frames",
        stock: Number(stock) || 0,
        unit: unit || "pcs",
        minAlert: minAlert !== undefined ? Number(minAlert) : 10,
        status: (Number(stock) || 0) <= 0 ? "Out of Stock" : ((Number(stock) || 0) <= (Number(minAlert) || 10) ? "Low Stock" : "In Stock"),
      },
    });

    portalEvents.emit("inventory_change", { action: "CREATE", item: created });
    return NextResponse.json({ success: true, item: created });
  } catch (error: any) {
    console.error("Error adding inventory item:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, stock, minAlert, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID required" }, { status: 400 });
    }

    const updated = await prisma.studioInventory.update({
      where: { id },
      data: {
        stock: stock !== undefined ? Number(stock) : undefined,
        minAlert: minAlert !== undefined ? Number(minAlert) : undefined,
        status: status || (stock !== undefined ? (Number(stock) <= 0 ? "Out of Stock" : (Number(stock) <= (minAlert || 10) ? "Low Stock" : "In Stock")) : undefined),
      },
    });

    portalEvents.emit("inventory_change", { action: "UPDATE", item: updated });
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
