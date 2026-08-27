const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/node_modules/@libsql/client");
const { PrismaLibSql } = require("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/node_modules/@prisma/adapter-libsql");
const { PrismaClient } = require("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/node_modules/@prisma/client");

const dbPath = path.resolve("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/dev.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

const libsql = createClient({ url: dbUrl });
libsql.url = dbUrl;
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

const SESSION_SECRET = "pixello-super-secret-auth-key-2026";

function createToken(payload) {
  const data = { ...payload, issuedAt: Date.now() };
  const json = JSON.stringify(data);
  const base64Data = Buffer.from(json, "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(base64Data).digest("base64url");
  return `${base64Data}.${signature}`;
}

function makeRequest({ path, method = "GET", token, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (payload) headers["Content-Length"] = Buffer.byteLength(payload);

    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path,
        method,
        headers,
      },
      (res) => {
        let d = "";
        res.on("data", (chunk) => (d += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(d);
            resolve({ statusCode: res.statusCode, data: json });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: d });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runMaster21StepTest() {
  console.log("===============================================================================");
  console.log("PIXELLOSTORE — 21-STEP MASTER PRISMA PERSISTENCE & SYNC VERIFICATION");
  console.log("===============================================================================\n");

  // STEP 1: Login as Customer A
  console.log("STEP 1: Login as Customer A via /api/customers...");
  const custA_Phone = "+91 9618401231";
  const custA_Name = "Neela Sai Pranav";
  const custA_Email = "neelasaipranav2007@gmail.com";

  const loginRes = await makeRequest({
    path: "/api/customers",
    method: "POST",
    body: {
      name: custA_Name,
      phone: custA_Phone,
      email: custA_Email,
      password: "1234",
    },
  });
  assert(loginRes.statusCode === 200 && loginRes.data.success, "Customer A login/register succeeded");
  const custA_Token = loginRes.data.token;
  assert(Boolean(custA_Token), "Customer A received signed HMAC session token");

  // STEP 2 & 3: Add real product and prepare checkout
  console.log("\nSTEP 2 & 3: Selecting Real Product & Preparing Checkout...");
  const products = await prisma.product.findMany({ take: 1 });
  const selectedProduct = products[0] || {
    id: "prod_wooden_frame",
    name: "Handcrafted Wooden Frame",
    basePrice: 1499,
  };
  console.log(`  Selected Real Product: "${selectedProduct.name}" (Rs ${selectedProduct.basePrice})`);

  // STEP 4 & 5: Place Order & Receive Real Order Number from Backend
  console.log("\nSTEP 4 & 5: Placing Order from Customer Portal Checkout...");
  const orderPlacementRes = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: custA_Token,
    body: {
      customerName: custA_Name,
      customerPhone: custA_Phone,
      deliveryAddress: "Flat 402, Sai Residency, Madhapur, Hyderabad - 500081",
      referralCode: "SAIROHAN10",
      totalAmount: selectedProduct.basePrice || 1499,
      items: [
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          size: "12x18 INCH",
          quantity: 1,
          price: selectedProduct.basePrice || 1499,
          image: "/images/wooden_frame_main.png",
          photos: ["/images/wooden_frame_main.png"],
        },
      ],
    },
  });
  assert(orderPlacementRes.statusCode === 200 && orderPlacementRes.data.success, "Order placed successfully via POST /api/orders");
  const realOrderNumber = orderPlacementRes.data.order?.id;
  assert(Boolean(realOrderNumber && realOrderNumber.startsWith("PXL-")), `Received Real Backend Order ID: ${realOrderNumber}`);

  // STEP 6: Verify Order in Prisma Database
  console.log("\nSTEP 6: Direct SQLite / Prisma Database Record Verification...");
  const dbOrder = await prisma.order.findUnique({
    where: { id: realOrderNumber },
    include: {
      items: true,
      customerProfile: { include: { user: true } },
      history: true,
      transaction: true,
      commission: true,
    },
  });
  assert(dbOrder !== null, `Prisma finds Order '${realOrderNumber}' in SQLite dev.db`);
  assert(dbOrder.totalAmount === (selectedProduct.basePrice || 1499), `Order total amount matches Rs ${dbOrder.totalAmount}`);

  // STEP 7 & 8 & 9 & 10: Verify Prisma Studio / Database Relations
  console.log("\nSTEP 7-10: Verifying Prisma Studio Database Tables & Relationships...");
  assert(dbOrder.items.length === 1, `OrderItem table has ${dbOrder.items.length} item record(s)`);
  assert(dbOrder.items[0].name === selectedProduct.name, `OrderItem name is "${dbOrder.items[0].name}"`);
  assert(dbOrder.customerProfileId !== null, `Order has customerProfileId: ${dbOrder.customerProfileId}`);
  assert(dbOrder.customerName === custA_Name, `Customer Name in DB is "${dbOrder.customerName}"`);
  assert(dbOrder.history.length >= 1, `OrderStatusHistory has ${dbOrder.history.length} audit entry`);
  assert(dbOrder.transaction !== null, `Transaction record exists (Method: ${dbOrder.transaction?.paymentMethod})`);
  assert(dbOrder.commission !== null, `Ambassador commission attributed for SAIROHAN10 (Rs ${dbOrder.commission?.amount})`);

  // STEP 11, 12, 13: Open Admin Portal & Fetch /api/admin/orders
  console.log("\nSTEP 11-13: Admin Portal Order Synchronization...");
  const adminToken = createToken({ userId: "admin_master", role: "ADMIN", name: "Master Admin" });
  const adminOrdersRes = await makeRequest({
    path: "/api/admin/orders",
    token: adminToken,
  });
  assert(adminOrdersRes.statusCode === 200 && adminOrdersRes.data.success, "Admin successfully fetches /api/admin/orders");
  const foundInAdmin = adminOrdersRes.data.orders.find((o) => o.id === realOrderNumber);
  assert(foundInAdmin !== undefined, `Admin Portal finds exact Order ID '${realOrderNumber}'`);

  // STEP 14 & 15: Open Order Details in Admin & Verify Info
  console.log("\nSTEP 14-15: Verifying Order Details on Admin Portal...");
  assert(foundInAdmin.customerName === custA_Name, `Admin sees Customer Name: "${foundInAdmin.customerName}"`);
  assert(foundInAdmin.items.length === 1, `Admin sees Order Items: ${foundInAdmin.items[0]?.name}`);
  assert(foundInAdmin.status === "Processing", `Admin sees current status: "${foundInAdmin.status}"`);

  // STEP 16 & 17: Admin Changes Order Status & Verifies DB Update
  console.log("\nSTEP 16-17: Admin Updating Order Status to 'Out for Delivery'...");
  const statusUpdateRes = await makeRequest({
    path: `/api/admin/orders/${encodeURIComponent(realOrderNumber)}/status`,
    method: "PATCH",
    token: adminToken,
    body: {
      status: "Out for Delivery",
      note: "Dispatched with rider Ramesh Kumar",
      deliveryPartnerName: "Ramesh Kumar",
    },
  });
  assert(statusUpdateRes.statusCode === 200 && statusUpdateRes.data.success, `Admin PATCH status response success: true`);

  const dbOrderAfterUpdate = await prisma.order.findUnique({
    where: { id: realOrderNumber },
    include: { history: true, deliveryInfo: true },
  });
  assert(dbOrderAfterUpdate.status === "OUT_FOR_DELIVERY", `Prisma database enum status updated to OUT_FOR_DELIVERY`);
  assert(dbOrderAfterUpdate.history.length === 2, `OrderStatusHistory updated to 2 entries in DB`);
  assert(dbOrderAfterUpdate.deliveryInfo?.deliveryPartnerName === "Ramesh Kumar", `DeliveryInfo assigned to Ramesh Kumar`);

  // STEP 18 & 19: Refresh Admin Portal & Verify Status Remains
  console.log("\nSTEP 18-19: Refresh Admin Portal & Verify Status Persistence...");
  const refreshedAdminOrders = await makeRequest({
    path: "/api/admin/orders",
    token: adminToken,
  });
  const updatedInAdmin = refreshedAdminOrders.data.orders.find((o) => o.id === realOrderNumber);
  assert(updatedInAdmin.status === "Out for Delivery", `Admin sees persistent status: "${updatedInAdmin.status}"`);

  // STEP 20 & 21: Open Customer Portal & Verify Customer Sees Updated Status
  console.log("\nSTEP 20-21: Customer Portal Order Tracking & Live Synchronization...");
  const custOrdersRes = await makeRequest({
    path: "/api/customer/orders",
    token: custA_Token,
  });
  assert(custOrdersRes.statusCode === 200 && custOrdersRes.data.success, "Customer successfully fetches /api/customer/orders");
  const orderInCustomerPortal = custOrdersRes.data.orders.find((o) => o.id === realOrderNumber);
  assert(orderInCustomerPortal !== undefined, `Customer Portal sees own Order '${realOrderNumber}'`);
  assert(orderInCustomerPortal.status === "Out for Delivery", `Customer Portal sees live updated status: "${orderInCustomerPortal.status}"`);
  assert(orderInCustomerPortal.deliveryPartner === "Ramesh Kumar", `Customer Portal sees assigned delivery partner: "Ramesh Kumar"`);

  console.log("\n===============================================================================");
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED (100% COMPLETE)`);
  console.log("===============================================================================\n");

  if (failed === 0) {
    console.log("🎉 ALL 21 STEPS OF COMPLETE DATABASE PERSISTENCE & SYNC PASSED!");
  } else {
    process.exit(1);
  }
}

runMaster21StepTest().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
