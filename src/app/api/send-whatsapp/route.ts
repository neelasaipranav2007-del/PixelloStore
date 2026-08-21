import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { toPhone, studentName, type, message, apiToken, phoneId } = await req.json();

    const PIXELLO_WHATSAPP_NUMBER = "8074589949";

    // Clean recipient phone
    let cleanPhone = (toPhone || "").replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const encodedText = encodeURIComponent(message);
    const directWaUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    const waToken = apiToken || process.env.WHATSAPP_API_TOKEN;
    const targetPhoneId = phoneId || process.env.WHATSAPP_PHONE_NUMBER_ID || "8074589949";

    // Meta WhatsApp Cloud API Dispatch
    if (waToken) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v18.0/${targetPhoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: message },
          }),
        });
        const metaData = await metaRes.json();
        return NextResponse.json({
          success: true,
          mode: "META_CLOUD_API",
          from: PIXELLO_WHATSAPP_NUMBER,
          to: cleanPhone,
          directWaUrl,
          metaData,
        });
      } catch (err: any) {
        console.error("Meta WhatsApp Cloud API error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      mode: "WHATSAPP_DIRECT_DISPATCH",
      from: PIXELLO_WHATSAPP_NUMBER,
      to: cleanPhone,
      studentName,
      directWaUrl,
      message: `Intimation generated for ${studentName} (+${cleanPhone}) from Pixello WhatsApp 8074589949.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
