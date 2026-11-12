import { NextResponse } from "next/server";
import { DELETE as rootDelete } from "../route";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const newReq = new Request(req.url, {
      method: "DELETE",
      headers: req.headers,
      body: JSON.stringify({ ...body, id }),
    });
    return rootDelete(newReq);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
