import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

const SESSION_SECRET = process.env.NEXTAUTH_SECRET || "pixello-super-secret-auth-key-2026";

function createCustomerToken(payload) {
  const data = {
    ...payload,
    issuedAt: Date.now(),
  };
  const json = JSON.stringify(data);
  const base64Data = Buffer.from(json, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Data)
    .digest("base64url");
  return `${base64Data}.${signature}`;
}

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
const libsql = createClient({ url: dbUrl });
libsql.url = dbUrl;
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function testVerify() {
  console.log("Testing POST /api/payment/verify directly...");

  // Find a customer user in DB
  let user = await prisma.user.findFirst({
    where: { role: "CUSTOMER" },
    include: { customerProfile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Harsha Vardhan",
        phone: "+91 9999999999",
        email: "harsha.tester@gmail.com",
        role: "CUSTOMER",
        customerProfile: { create: {} },
      },
      include: { customerProfile: true },
    });
  }

  const token = createCustomerToken({
    userId: user.id,
    role: "CUSTOMER",
    phone: user.phone,
    email: user.email,
    name: user.name,
  });

  const payload = {
    razorpayOrderId: `order_cod_${Date.now()}`,
    razorpayPaymentId: `COD_${Date.now()}`,
    razorpaySignature: "cod_verified",
    items: [
      {
        name: "Test Signature Luxe Frame",
        size: "6x8 Inch",
        quantity: 1,
        price: 499,
        image: "/images/wooden_frame_main.png",
      },
    ],
    deliveryAddress: "Flat 101, Marine Drive, Mumbai - 400020",
    totalAmount: 499,
    referralCode: "VYSHU10",
    deliveryType: "Shipping",
    assignedStudio: "Studio Alpha (Central Powai Branch)",
    customerName: user.name || "Harsha Vardhan",
    customerPhone: user.phone || "+91 9999999999",
    isSurpriseGift: true,
    surpriseGiftMessage: "Surprise gift for my friend!",
    paymentMethod: "COD",
  };

  try {
    const res = await fetch("http://localhost:3000/api/payment/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cookie": `pixello_auth_token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.success && data.order) {
      console.log("\n✅ SUCCESS: Order verified and created!");
      console.log("Order ID:", data.order.id);
      console.log("isSurpriseGift:", data.order.isSurpriseGift);
      console.log("surpriseGiftMessage:", data.order.surpriseGiftMessage);

      // Clean up test order
      await prisma.commission.deleteMany({ where: { orderId: data.order.id } });
      await prisma.deliveryInfo.deleteMany({ where: { orderId: data.order.id } });
      await prisma.orderItem.deleteMany({ where: { orderId: data.order.id } });
      await prisma.transaction.deleteMany({ where: { orderId: data.order.id } });
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: data.order.id } });
      await prisma.order.delete({ where: { id: data.order.id } });
      console.log("Cleaned up test order.");
    } else {
      console.error("\n❌ FAILED:", data.error || data);
      process.exit(1);
    }
  } catch (err) {
    console.error("Fetch error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testVerify();
