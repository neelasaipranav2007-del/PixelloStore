import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/session";
import { safeErrorResponse } from "@/lib/errorHandler";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required to access ambassador applicant data." },
        { status: 401 }
      );
    }

    const SPREADSHEET_ID = "1ZTw_Huk4okA8LTN7LK3y7nfoPuZXnHAnxNbc8oaauwY";
    const GID = "1729008018";
    const GOOGLE_CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID}`;

    const res = await fetch(GOOGLE_CSV_URL, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Google Sheet: status ${res.status}`);
    }

    const csvText = await res.text();
    const lines = csvText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const submissions = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanCols = cols.map((c) => c.replace(/^"|"$/g, "").trim());

      if (cleanCols.length >= 3 && cleanCols[1]) {
        const timestamp = cleanCols[0] || "8/9/2026";
        const fullName = cleanCols[1] || "Student Applicant";
        const mobile = cleanCols[2] || "";
        const email = cleanCols[3] || "";
        const address = cleanCols[4] || "";
        const gender = cleanCols[5] || "";
        const dob = cleanCols[6] || "";
        const college = cleanCols[7] || "University";
        const location = cleanCols[8] || "";
        const course = cleanCols[9] || "";
        const year = cleanCols[10] || "";
        const instagram = cleanCols[11] ? (cleanCols[11].startsWith("@") ? cleanCols[11] : `@${cleanCols[11]}`) : "";

        submissions.push({
          id: `GF-SHEET-${i}-${Date.now()}`,
          submittedAt: timestamp,
          name: fullName,
          phone: mobile,
          email: email,
          address: address,
          gender: gender,
          dob: dob,
          college: college,
          location: location,
          course: course,
          year: year,
          instagram: instagram,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: submissions.length,
      submissions,
    });
  } catch (error: any) {
    return safeErrorResponse(error, 500, "Error synchronizing google sheet submissions");
  }
}
