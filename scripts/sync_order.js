require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const { createClient } = require("@libsql/client");
const path = require("path");

const dbPath = path.resolve(process.cwd(), "dev.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

const libsql = createClient({
  url: dbUrl,
});
libsql.url = dbUrl;

const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function run() {
  const orderId = "127093c0243c6e9c9d456bcf28b72a9fd014b64e";
  
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, deliveryInfo: true, history: true }
  });

  if (existing) {
    console.log("Order already exists in DB:", existing.id, existing.status);
    return;
  }

  const newOrder = await prisma.order.create({
    data: {
      id: orderId,
      customerName: "Harsha",
      customerPhone: "+91 7989856610",
      shippingAddress: "Flat 402, Sai Ram Towers, Sarada Nagar, Hyderabad - 500070",
      totalAmount: 149,
      status: "READY_FOR_PICKUP",
      assignedStudio: "Pixello Studio (Hastinapuram Branch)",
      deliveryType: "Shipping",
      items: {
        create: [
          {
            name: "Premium Wooden Frame",
            size: "4x6 INCH (180 GSM, Black Frame)",
            quantity: 1,
            price: 149,
            image: "/images/wooden_frame_main.png"
          }
        ]
      },
      deliveryInfo: {
        create: {
          deliveryPartnerName: "Ramesh Kumar (Pixello Express)",
          trackingUrl: "https://maps.google.com/?q=17.3551,78.5300"
        }
      },
      history: {
        create: [
          {
            status: "PLACED",
            note: "Order placed via website."
          },
          {
            status: "ACCEPTED_BY_STUDIO",
            note: "Studio accepted and verified high-res photo."
          },
          {
            status: "READY_FOR_PICKUP",
            note: "Order framed and ready for express delivery pickup."
          }
        ]
      },
      transaction: {
        create: {
          paymentMethod: "RAZORPAY",
          razorpayPaymentId: "pay_127093c0243c6e9c",
          amount: 149,
          status: "SUCCESS"
        }
      }
    },
    include: {
      items: true,
      deliveryInfo: true,
      history: true
    }
  });

  console.log("Successfully created order in DB:", newOrder.id, newOrder.status);
}

run().catch(console.error).finally(() => prisma.$disconnect());
