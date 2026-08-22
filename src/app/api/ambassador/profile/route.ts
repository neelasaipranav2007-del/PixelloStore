import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedAmbassador } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador, user } = auth;

    return NextResponse.json({
      success: true,
      profile: {
        id: ambassador.id,
        userId: user.id,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        college: ambassador.college || "",
        branch: ambassador.branch || "",
        year: ambassador.year || "",
        bio: ambassador.bio || "",
        instagramHandle: ambassador.instagramHandle || "",
        referralCode: ambassador.referralCode,
        rank: ambassador.rank,
        upiId: ambassador.upiId || "",
        accountNumber: ambassador.accountNumber || "",
        status: ambassador.status,
      },
    });
  } catch (error: any) {
    console.error("GET /api/ambassador/profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthenticatedAmbassador(req);
    if (!auth || !auth.ambassador) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in as an Ambassador." },
        { status: 401 }
      );
    }

    const { ambassador, user } = auth;
    const body = await req.json();

    const { name, college, branch, year, bio, instagramHandle, upiId, accountNumber } = body;

    // Update User name if provided
    if (name && name.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    // Update AmbassadorProfile
    const updatedProfile = await prisma.ambassadorProfile.update({
      where: { id: ambassador.id },
      data: {
        college: college !== undefined ? college : ambassador.college,
        branch: branch !== undefined ? branch : ambassador.branch,
        year: year !== undefined ? year : ambassador.year,
        bio: bio !== undefined ? bio : ambassador.bio,
        instagramHandle: instagramHandle !== undefined ? instagramHandle : ambassador.instagramHandle,
        upiId: upiId !== undefined ? upiId : ambassador.upiId,
        accountNumber: accountNumber !== undefined ? accountNumber : ambassador.accountNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      profile: {
        id: updatedProfile.id,
        name: name ? name.trim() : user.name,
        email: user.email,
        phone: user.phone,
        college: updatedProfile.college,
        branch: updatedProfile.branch,
        year: updatedProfile.year,
        bio: updatedProfile.bio,
        instagramHandle: updatedProfile.instagramHandle,
        referralCode: updatedProfile.referralCode,
        rank: updatedProfile.rank,
        upiId: updatedProfile.upiId,
        accountNumber: updatedProfile.accountNumber,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/ambassador/profile error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
