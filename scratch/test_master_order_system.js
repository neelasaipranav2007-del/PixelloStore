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

async function runMasterTestSuite() {
  console.log("===============================================================================");
  console.log("PIXELLOSTORE — MASTER CENTRAL ORDERS & ADMIN VERIFICATION TEST SUITE");
  console.log("===============================================================================\n");

  // 1. Clean previous test orders and setup test users
  console.log("1. Preparing Test Customer & Admin Users in DB...");
  const testPhones = ["+91 9811122233", "+91 9822233344", "+91 9833344455", "9811122233", "9822233344", "9833344455"];
  const prevOrders = await prisma.order.findMany({
    where: {
      OR: testPhones.map((p) => ({ customerPhone: { contains: p.slice(-10) } })),
    },
    select: { id: true },
  });

  if (prevOrders.length > 0) {
    const prevIds = prevOrders.map((o) => o.id);
    await prisma.orderItem.deleteMany({ where: { orderId: { in: prevIds } } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: prevIds } } });
    await prisma.transaction.deleteMany({ where: { orderId: { in: prevIds } } });
    await prisma.commission.deleteMany({ where: { orderId: { in: prevIds } } });
    await prisma.deliveryInfo.deleteMany({ where: { orderId: { in: prevIds } } });
    await prisma.order.deleteMany({ where: { id: { in: prevIds } } });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pixellostore.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Master Admin",
      email: "admin@pixellostore.com",
      phone: "+91 9999999999",
      role: "ADMIN",
    },
  });

  const custA = await prisma.user.upsert({
    where: { phone: "+91 9811122233" },
    update: { name: "Sita Sharma" },
    create: {
      name: "Sita Sharma",
      phone: "+91 9811122233",
      email: "sita@example.com",
      role: "CUSTOMER",
      customerProfile: { create: {} },
    },
    include: { customerProfile: true },
  });

  const custB = await prisma.user.upsert({
    where: { phone: "+91 9822233344" },
    update: { name: "Rahul Roy" },
    create: {
      name: "Rahul Roy",
      phone: "+91 9822233344",
      email: "rahul@example.com",
      role: "CUSTOMER",
      customerProfile: { create: {} },
    },
    include: { customerProfile: true },
  });

  const custC = await prisma.user.upsert({
    where: { phone: "+91 9833344455" },
    update: { name: "Ananya Gupta" },
    create: {
      name: "Ananya Gupta",
      phone: "+91 9833344455",
      email: "ananya@example.com",
      role: "CUSTOMER",
      customerProfile: { create: {} },
    },
    include: { customerProfile: true },
  });

  const tokenAdmin = createToken({ userId: adminUser.id, role: "ADMIN", name: "Master Admin" });
  const tokenA = createToken({ userId: custA.id, role: "CUSTOMER", phone: custA.phone, name: custA.name });
  const tokenB = createToken({ userId: custB.id, role: "CUSTOMER", phone: custB.phone, name: custB.name });
  const tokenC = createToken({ userId: custC.id, role: "CUSTOMER", phone: custC.phone, name: custC.name });

  console.log("  Users ready: Admin, Customer A (Sita), Customer B (Rahul), Customer C (Ananya)\n");

  // 2. Test Security & Access Controls
  console.log("2. Testing Security & Access Controls...");
  const unauthAdmin = await makeRequest({ path: "/api/admin/orders" });
  assert(unauthAdmin.statusCode === 401, "GET /api/admin/orders without token returns 401 Unauthorized");

  const unauthCust = await makeRequest({ path: "/api/customer/orders" });
  assert(unauthCust.statusCode === 401, "GET /api/customer/orders without token returns 401 Unauthorized");

  const custToAdmin = await makeRequest({ path: "/api/admin/orders", token: tokenA });
  assert(custToAdmin.statusCode === 401 || custToAdmin.statusCode === 403, "Customer token cannot access /api/admin/orders (401/403)");

  // 3. Customer A places 2 orders
  console.log("\n3. Placing Orders for Customer A (Sita Sharma)...");
  const orderA1Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenA,
    body: {
      customerName: "Sita Sharma",
      customerPhone: "+91 9811122233",
      deliveryAddress: "Flat 402, Sunshine Apts, Madhapur, Hyderabad - 500081",
      referralCode: "VYSHU10",
      totalAmount: 1499,
      items: [
        { name: "Custom Canvas Photo Frame", size: "12x18 INCH", price: 1499, quantity: 1, image: "/images/wooden_frame_main.png" },
      ],
    },
  });
  assert(orderA1Res.statusCode === 200 && orderA1Res.data.success, `Customer A placed Order #1: ${orderA1Res.data?.order?.id}`);

  const orderA2Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenA,
    body: {
      customerName: "Sita Sharma",
      customerPhone: "+91 9811122233",
      deliveryAddress: "Flat 402, Sunshine Apts, Madhapur, Hyderabad - 500081",
      totalAmount: 799,
      items: [
        { name: "Polaroid Photo Prints Set", size: "Mini Size (12 Prints)", price: 799, quantity: 1, image: "/images/polaroid_set.png" },
      ],
    },
  });
  assert(orderA2Res.statusCode === 200 && orderA2Res.data.success, `Customer A placed Order #2: ${orderA2Res.data?.order?.id}`);

  // 4. Customer B places 3 orders
  console.log("\n4. Placing Orders for Customer B (Rahul Roy)...");
  const orderB1Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenB,
    body: {
      customerName: "Rahul Roy",
      customerPhone: "+91 9822233344",
      deliveryAddress: "H.No 12-5/A, Jubilee Hills, Hyderabad - 500033",
      totalAmount: 1999,
      items: [{ name: "Handcrafted Wooden Frame", size: "A4 Size", price: 1999, quantity: 1, image: "/images/wooden_frame_angle.png" }],
    },
  });
  assert(orderB1Res.statusCode === 200 && orderB1Res.data.success, `Customer B placed Order #1: ${orderB1Res.data?.order?.id}`);

  const orderB2Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenB,
    body: {
      customerName: "Rahul Roy",
      customerPhone: "+91 9822233344",
      deliveryAddress: "H.No 12-5/A, Jubilee Hills, Hyderabad - 500033",
      totalAmount: 2499,
      items: [{ name: "LED Acrylic Photo Lamp", size: "Standard Lamp", price: 2499, quantity: 1, image: "/images/polaroid_set.png" }],
    },
  });
  assert(orderB2Res.statusCode === 200 && orderB2Res.data.success, `Customer B placed Order #2: ${orderB2Res.data?.order?.id}`);

  const orderB3Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenB,
    body: {
      customerName: "Rahul Roy",
      customerPhone: "+91 9822233344",
      deliveryAddress: "H.No 12-5/A, Jubilee Hills, Hyderabad - 500033",
      totalAmount: 899,
      items: [{ name: "Custom Spotify Acrylic Plaque", size: "A5 Plaque", price: 899, quantity: 1, image: "/images/wooden_frame_main.png" }],
    },
  });
  assert(orderB3Res.statusCode === 200 && orderB3Res.data.success, `Customer B placed Order #3: ${orderB3Res.data?.order?.id}`);

  // 5. Customer C places 2 orders
  console.log("\n5. Placing Orders for Customer C (Ananya Gupta)...");
  const orderC1Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenC,
    body: {
      customerName: "Ananya Gupta",
      customerPhone: "+91 9833344455",
      deliveryAddress: "Plot 88, Banjara Hills, Hyderabad - 500034",
      totalAmount: 1299,
      items: [{ name: "Premium Wooden Frame", size: "8x10 INCH", price: 1299, quantity: 1, image: "/images/wooden_frame_main.png" }],
    },
  });
  assert(orderC1Res.statusCode === 200 && orderC1Res.data.success, `Customer C placed Order #1: ${orderC1Res.data?.order?.id}`);

  const orderC2Res = await makeRequest({
    path: "/api/orders",
    method: "POST",
    token: tokenC,
    body: {
      customerName: "Ananya Gupta",
      customerPhone: "+91 9833344455",
      deliveryAddress: "Plot 88, Banjara Hills, Hyderabad - 500034",
      totalAmount: 3199,
      items: [{ name: "Custom Canvas Photo Frame", size: "16x24 INCH", price: 3199, quantity: 1, image: "/images/wooden_frame_main.png" }],
    },
  });
  assert(orderC2Res.statusCode === 200 && orderC2Res.data.success, `Customer C placed Order #2: ${orderC2Res.data?.order?.id}`);

  // 6. Strict Customer Data Scoping & Isolation
  console.log("\n6. Verifying Strict Customer Isolation via /api/customer/orders...");
  const custAOrders = await makeRequest({ path: "/api/customer/orders", token: tokenA });
  assert(custAOrders.statusCode === 200, "Customer A successfully accesses /api/customer/orders");
  assert(custAOrders.data.orders.length === 2, `Customer A sees exactly 2 orders (Got: ${custAOrders.data.orders.length})`);
  assert(custAOrders.data.orders.every((o) => o.customerPhone.includes("9811122233")), "All Customer A orders belong strictly to Customer A");

  const custBOrders = await makeRequest({ path: "/api/customer/orders", token: tokenB });
  assert(custBOrders.statusCode === 200, "Customer B successfully accesses /api/customer/orders");
  assert(custBOrders.data.orders.length === 3, `Customer B sees exactly 3 orders (Got: ${custBOrders.data.orders.length})`);
  assert(custBOrders.data.orders.every((o) => o.customerPhone.includes("9822233344")), "All Customer B orders belong strictly to Customer B");

  const custCOrders = await makeRequest({ path: "/api/customer/orders", token: tokenC });
  assert(custCOrders.statusCode === 200, "Customer C successfully accesses /api/customer/orders");
  assert(custCOrders.data.orders.length === 2, `Customer C sees exactly 2 orders (Got: ${custCOrders.data.orders.length})`);
  assert(custCOrders.data.orders.every((o) => o.customerPhone.includes("9833344455")), "All Customer C orders belong strictly to Customer C");

  // Verify ZERO cross-customer leakage
  const custAIds = new Set(custAOrders.data.orders.map((o) => o.id));
  const custBIds = new Set(custBOrders.data.orders.map((o) => o.id));
  const hasOverlap = [...custAIds].some((id) => custBIds.has(id));
  assert(!hasOverlap, "Zero cross-customer data leakage between Customer A and Customer B");

  // 7. Admin Master Order Verification
  console.log("\n7. Verifying Admin Master Order Portal via /api/admin/orders...");
  const adminOrdersRes = await makeRequest({ path: "/api/admin/orders?limit=100", token: tokenAdmin });
  assert(adminOrdersRes.statusCode === 200, "Admin successfully accesses /api/admin/orders");
  assert(adminOrdersRes.data.orders && adminOrdersRes.data.orders.length >= 7, `Admin sees ALL orders across all customers (Total returned: ${adminOrdersRes.data.orders.length})`);

  // Verify specific customer orders in admin
  const adminFoundA = adminOrdersRes.data.orders.filter((o) => o.customerPhone.includes("9811122233"));
  const adminFoundB = adminOrdersRes.data.orders.filter((o) => o.customerPhone.includes("9822233344"));
  const adminFoundC = adminOrdersRes.data.orders.filter((o) => o.customerPhone.includes("9833344455"));
  assert(adminFoundA.length === 2, `Admin sees all 2 orders of Customer A (Sita)`);
  assert(adminFoundB.length === 3, `Admin sees all 3 orders of Customer B (Rahul)`);
  assert(adminFoundC.length === 2, `Admin sees all 2 orders of Customer C (Ananya)`);

  // 8. Server-Side Admin Search & Pagination
  console.log("\n8. Verifying Admin Search & Pagination...");
  const searchSita = await makeRequest({ path: "/api/admin/orders?search=Sita", token: tokenAdmin });
  assert(searchSita.data.orders.length === 2, `Server-side search for 'Sita' returns exactly 2 orders`);

  const searchOrder = await makeRequest({ path: `/api/admin/orders?search=${orderA1Res.data.order.id}`, token: tokenAdmin });
  assert(searchOrder.data.orders.length === 1 && searchOrder.data.orders[0].id === orderA1Res.data.order.id, `Server-side search by Order ID '${orderA1Res.data.order.id}' returns exact match`);

  const paginationRes = await makeRequest({ path: "/api/admin/orders?page=1&limit=5", token: tokenAdmin });
  assert(paginationRes.data.orders.length === 5, "Admin pagination limit=5 returns exactly 5 orders");
  assert(paginationRes.data.pagination.page === 1 && paginationRes.data.pagination.limit === 5, "Pagination metadata is properly structured");
  assert(paginationRes.data.pagination.totalPages >= 2, "Pagination totalPages calculated correctly");

  // 9. Order Status Update & Synchronization
  console.log("\n9. Testing Order Status Lifecycle & Customer Sync...");
  const orderA1Id = orderA1Res.data.order.id;
  const statusUpdateRes = await makeRequest({
    path: `/api/admin/orders/${encodeURIComponent(orderA1Id)}/status`,
    method: "PATCH",
    token: tokenAdmin,
    body: {
      status: "Out for Delivery",
      note: "Dispatched with rider Ramesh Kumar for direct delivery",
      deliveryPartnerName: "Ramesh Kumar",
    },
  });
  assert(statusUpdateRes.statusCode === 200 && statusUpdateRes.data.success, `Admin updated Order ${orderA1Id} to 'Out for Delivery'`);

  // Verify Customer A sees updated status
  const refreshedCustA = await makeRequest({ path: "/api/customer/orders", token: tokenA });
  const updatedA1InCustomer = refreshedCustA.data.orders.find((o) => o.id === orderA1Id);
  assert(updatedA1InCustomer && updatedA1InCustomer.status === "Out for Delivery", `Customer A immediately sees updated status 'Out for Delivery'`);
  assert(updatedA1InCustomer && updatedA1InCustomer.deliveryPartner === "Ramesh Kumar", `Customer A sees assigned delivery partner 'Ramesh Kumar'`);

  // 10. Database Direct Persistence Check
  console.log("\n10. Checking Direct SQLite Database Records...");
  const dbOrderA1 = await prisma.order.findUnique({
    where: { id: orderA1Id },
    include: { items: true, history: true, deliveryInfo: true },
  });
  assert(dbOrderA1 !== null, `Order ${orderA1Id} exists directly in SQLite dev.db`);
  assert(dbOrderA1.status === "OUT_FOR_DELIVERY", `Database enum status is OUT_FOR_DELIVERY`);
  assert(dbOrderA1.history.length >= 2, `Database order status history has 2 logged entries`);

  console.log("\n===============================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================================\n");

  if (failed === 0) {
    console.log("🎉 MASTER ORDER SYSTEM TEST SUITE PASSED 100%!");
  } else {
    process.exit(1);
  }
}

runMasterTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
