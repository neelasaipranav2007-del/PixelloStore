import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req) => {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Missing webhook signature or secret" }), { status: 400 });
    }

    const rawBody = await req.text();

    // Verify HMAC SHA-256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSig !== signature) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || `${payload.event}_${payload.created_at}`;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency check: insert webhook event
    const { error: insertErr } = await supabase.from("payment_webhook_events").insert({
      event_id: eventId,
      event_type: payload.event,
      payload,
    });

    if (insertErr && insertErr.code === "23505") {
      // Event already processed (idempotent duplicate)
      return new Response(JSON.stringify({ status: "already_processed" }), { status: 200 });
    }

    // Process event
    if (payload.event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const orderId = notes.orderId;

      if (orderId) {
        await supabase.rpc("confirm_order_and_reserve_inventory", {
          p_order_id: orderId,
          p_razorpay_order_id: paymentEntity.order_id || "",
          p_razorpay_payment_id: paymentEntity.id || "",
          p_signature: signature,
          p_amount: (paymentEntity.amount || 0) / 100,
        });
      }
    }

    return new Response(JSON.stringify({ success: true, event: payload.event }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
