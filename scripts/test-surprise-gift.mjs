import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

const libsql = createClient({ url: dbUrl });
libsql.url = dbUrl;
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("=================================================");
  console.log("PIXELLOSTORE SURPRISE GIFT & CHECKOUT VERIFICATION");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
    }
  }

  try {
    // Test 1: Verify Prisma schema has isSurpriseGift and surpriseGiftMessage
    console.log("1. Verifying Database Schema for Surprise Gift...");
    const testOrderId = `TEST-GIFT-${Date.now()}`;
    const createdOrder = await prisma.order.create({
      data: {
        id: testOrderId,
        customerName: "Priya Tester",
        customerPhone: "+91 9876543210",
        totalAmount: 499.0,
        status: "PLACED",
        shippingAddress: "Flat 202, Marine Drive, Mumbai - 400020",
        deliveryType: "Shipping",
        isSurpriseGift: true,
        surpriseGiftMessage: "Happy Birthday Priya! Wishing you endless joy & success.",
        items: {
          create: [
            {
              name: "Signature Luxe Frame",
              size: "6x8 Inch",
              quantity: 1,
              price: 499.0,
              image: "/images/wooden_frame_main.png",
            },
          ],
        },
      },
    });

    assert(createdOrder.id === testOrderId, "Order created in database with unique ID");
    assert(createdOrder.isSurpriseGift === true, "Order correctly saved isSurpriseGift = true");
    assert(
      createdOrder.surpriseGiftMessage === "Happy Birthday Priya! Wishing you endless joy & success.",
      "Order saved surpriseGiftMessage correctly"
    );

    // Test 2: Retrieve order via findUnique
    console.log("\n2. Retrieving Order from DB...");
    const fetched = await prisma.order.findUnique({
      where: { id: testOrderId },
      include: { items: true },
    });

    assert(fetched !== null, "Successfully retrieved order");
    assert(fetched?.isSurpriseGift === true, "Retrieved order maintains isSurpriseGift: true flag");
    assert(
      fetched?.surpriseGiftMessage?.includes("Priya"),
      "Retrieved order contains personalized wax-sealed note"
    );

    // Test 3: Cleanup test order
    console.log("\n3. Cleaning up test record...");
    await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
    await prisma.order.delete({ where: { id: testOrderId } });
    assert(true, "Cleaned up temporary test order");

    console.log(`\nResults: ${passed}/${total} checks passed (${Math.round((passed / total) * 100)}%)`);
    if (passed === total) {
      console.log("\n🎉 ALL SURPRISE GIFT DATABASE CHECKS PASSED PERFECTLY!\n");
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
