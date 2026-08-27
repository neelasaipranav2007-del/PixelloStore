const path = require("path");
const { createClient } = require("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/node_modules/@libsql/client");
const { PrismaLibSql } = require("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/node_modules/@prisma/adapter-libsql");
const { PrismaClient } = require("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/node_modules/@prisma/client");

const dbPath = path.resolve("c:/Users/NEELA SAI PRANAV/Desktop/Pixello Store/pixello-store/dev.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

const libsql = createClient({ url: dbUrl });
libsql.url = dbUrl;
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function restorePreviousOrders() {
  console.log("Restoring all previous customer & ambassador orders into Prisma dev.db...");

  // 1. Ensure Real User Accounts
  const pranavUser = await prisma.user.upsert({
    where: { email: "neelasaipranav2007@gmail.com" },
    update: { name: "Neela Sai Pranav", phone: "+91 9618401231" },
    create: {
      name: "Neela Sai Pranav",
      email: "neelasaipranav2007@gmail.com",
      phone: "+91 9618401231",
      role: "CUSTOMER",
    },
  });

  const pranavProfile = await prisma.customerProfile.upsert({
    where: { userId: pranavUser.id },
    update: {},
    create: { userId: pranavUser.id },
  });

  const harshaUser = await prisma.user.upsert({
    where: { email: "harshareddyy0307@gmail.com" },
    update: { name: "Harsha", phone: "+91 7989856610" },
    create: {
      name: "Harsha",
      email: "harshareddyy0307@gmail.com",
      phone: "+91 7989856610",
      role: "CUSTOMER",
    },
  });

  const harshaProfile = await prisma.customerProfile.upsert({
    where: { userId: harshaUser.id },
    update: {},
    create: { userId: harshaUser.id },
  });

  // 2. Fetch Ambassador Profiles
  const sreeProfile = await prisma.ambassadorProfile.findFirst({ where: { referralCode: "SREE20" } });
  const sairohanProfile = await prisma.ambassadorProfile.findFirst({ where: { referralCode: "SAIROHAN10" } });
  const aryanProfile = await prisma.ambassadorProfile.findFirst({ where: { referralCode: "ARYAN20" } });
  const vyshuProfile = await prisma.ambassadorProfile.findFirst({ where: { referralCode: "VYSHU10" } });
  const arjunProfile = await prisma.ambassadorProfile.findFirst({ where: { referralCode: "ARJUN10" } });

  const allPreviousOrders = [
    // Pranav's Orders
    {
      id: "PXL-9618-5015",
      customerProfileId: pranavProfile.id,
      customerName: "Neela Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 2410,
      status: "DELIVERED",
      deliveryAddress: "Flat 402, Sai Residency, Madhapur, Hyderabad - 500081",
      items: [{ name: "Custom Canvas Photo Frame", size: "12x18 INCH", price: 2410, quantity: 1, image: "/images/wooden_frame_main.png" }],
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: "PXL-1231-0001",
      customerProfileId: pranavProfile.id,
      customerName: "Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 2410,
      status: "DELIVERED",
      deliveryAddress: "H.No 12-5/A, Jubilee Hills, Hyderabad - 500033",
      items: [{ name: "Handcrafted Wooden Frame", size: "A4 Size", price: 2410, quantity: 1, image: "/images/wooden_frame_angle.png" }],
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: "PXL-1231-0070",
      customerProfileId: pranavProfile.id,
      customerName: "Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 502,
      status: "PRINTING",
      deliveryAddress: "H.No 12-5/A, Jubilee Hills, Hyderabad - 500033",
      items: [{ name: "Mini Polaroid Prints (12 Prints)", size: "Mini", price: 502, quantity: 1, image: "/images/polaroid_set.png" }],
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "PX-2026-446003",
      customerProfileId: pranavProfile.id,
      customerName: "Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 209,
      status: "QUALITY_CHECK",
      deliveryAddress: "H.No 12-5/A, Jubilee Hills, Hyderabad - 500033",
      items: [{ name: "Square Photo Magnet", size: "4x4 INCH", price: 209, quantity: 1, image: "/images/polaroid_set.png" }],
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },

    // Harsha's Orders
    {
      id: "PXL-6610-0010",
      customerProfileId: harshaProfile.id,
      customerName: "Harsha",
      customerPhone: "+91 7989856610",
      totalAmount: 177,
      status: "OUT_FOR_DELIVERY",
      deliveryAddress: "H.No 3-45, Christians Colony, Hastinapuram, Hyderabad - 500070",
      items: [{ name: "Custom Pocket Polaroid", size: "Pocket Size", price: 177, quantity: 1, image: "/images/polaroid_set.png" }],
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "PXL-6610-0010-939",
      customerProfileId: harshaProfile.id,
      customerName: "Harsha",
      customerPhone: "+91 7989856610",
      totalAmount: 122,
      status: "PLACED",
      deliveryAddress: "H.No 3-45, Christians Colony, Hastinapuram, Hyderabad - 500070",
      items: [{ name: "Mini Print Pack", size: "Mini", price: 122, quantity: 1, image: "/images/polaroid_set.png" }],
      date: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: "PX-2026-534533",
      customerProfileId: harshaProfile.id,
      customerName: "Harsha",
      customerPhone: "+91 7989856610",
      totalAmount: 462,
      status: "QUALITY_CHECK",
      deliveryAddress: "H.No 3-45, Christians Colony, Hastinapuram, Hyderabad - 500070",
      items: [{ name: "Custom Wooden Photo Frame", size: "6x8 INCH", price: 462, quantity: 1, image: "/images/wooden_frame_main.png" }],
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },

    // Ambassador SREE20 Orders
    ...(sreeProfile ? [
      {
        id: "PXL-SREE20-1000",
        ambassadorProfileId: sreeProfile.id,
        referralCode: "SREE20",
        customerName: "Rahul Sharma",
        customerPhone: "+91 9876543210",
        totalAmount: 1499,
        status: "DELIVERED",
        commissionEarned: 150,
        deliveryAddress: "Aurora University Hostel, Block B, Bhongiri",
        items: [{ name: "Custom Canvas Photo Frame", size: "12x18 INCH", price: 1499, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-SREE20-1001",
        ambassadorProfileId: sreeProfile.id,
        referralCode: "SREE20",
        customerName: "Sneha Kapoor",
        customerPhone: "+91 9876543211",
        totalAmount: 899,
        status: "DELIVERED",
        commissionEarned: 90,
        deliveryAddress: "Aurora Campus, Girls Hostel, Bhongiri",
        items: [{ name: "Polaroid Photo Prints Set", size: "12 Prints", price: 899, quantity: 1, image: "/images/polaroid_set.png" }],
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-SREE20-1002",
        ambassadorProfileId: sreeProfile.id,
        referralCode: "SREE20",
        customerName: "Priya Nair",
        customerPhone: "+91 9876543212",
        totalAmount: 2499,
        status: "DELIVERED",
        commissionEarned: 250,
        deliveryAddress: "Aurora University Campus, Staff Qtrs, Bhongiri",
        items: [{ name: "LED Acrylic Photo Lamp", size: "Standard Lamp", price: 2499, quantity: 1, image: "/images/polaroid_set.png" }],
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-SREE20-1003",
        ambassadorProfileId: sreeProfile.id,
        referralCode: "SREE20",
        customerName: "Ananya Deshmukh",
        customerPhone: "+91 9876543213",
        totalAmount: 1199,
        status: "OUT_FOR_DELIVERY",
        commissionEarned: 120,
        deliveryAddress: "Bhongiri Town, Main Road, Near Aurora Gate",
        items: [{ name: "Handcrafted Wooden Frame", size: "8x10 INCH", price: 1199, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ] : []),

    // Ambassador SAIROHAN10 Orders
    ...(sairohanProfile ? [
      {
        id: "PXL-SAIROHAN10-1000",
        ambassadorProfileId: sairohanProfile.id,
        referralCode: "SAIROHAN10",
        customerName: "Kavya Reddy",
        customerPhone: "+91 9876543220",
        totalAmount: 1999,
        status: "DELIVERED",
        commissionEarned: 200,
        deliveryAddress: "Aurora University Hostel, Block A, Bhongiri",
        items: [{ name: "Custom Canvas Photo Frame", size: "12x18 INCH", price: 1999, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-SAIROHAN10-1001",
        ambassadorProfileId: sairohanProfile.id,
        referralCode: "SAIROHAN10",
        customerName: "Vikram Aditya",
        customerPhone: "+91 9876543221",
        totalAmount: 2999,
        status: "DELIVERED",
        commissionEarned: 300,
        deliveryAddress: "Aurora University, Dept of CSE, Bhongiri",
        items: [{ name: "Premium Large Canvas Frame", size: "16x24 INCH", price: 2999, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-SAIROHAN10-1002",
        ambassadorProfileId: sairohanProfile.id,
        referralCode: "SAIROHAN10",
        customerName: "Deepak Varma",
        customerPhone: "+91 9876543222",
        totalAmount: 1299,
        status: "OUT_FOR_DELIVERY",
        commissionEarned: 130,
        deliveryAddress: "Bhongiri RTC Colony, Hyderabad",
        items: [{ name: "Handcrafted Wooden Frame", size: "8x10 INCH", price: 1299, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ] : []),

    // Ambassador VYSHU10 Orders
    ...(vyshuProfile ? [
      {
        id: "PXL-VYSHU10-1001",
        ambassadorProfileId: vyshuProfile.id,
        referralCode: "VYSHU10",
        customerName: "Keerthana Rao",
        customerPhone: "+91 9123456781",
        totalAmount: 1800,
        status: "DELIVERED",
        commissionEarned: 180,
        deliveryAddress: "Sreenidhii Engineering College Hostel, Ghatkesar",
        items: [{ name: "Custom Canvas Photo Frame", size: "12x18 INCH", price: 1800, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-VYSHU10-1002",
        ambassadorProfileId: vyshuProfile.id,
        referralCode: "VYSHU10",
        customerName: "Nikhil Reddy",
        customerPhone: "+91 9123456782",
        totalAmount: 2400,
        status: "DELIVERED",
        commissionEarned: 240,
        deliveryAddress: "Sreenidhii Engineering College Campus, Ghatkesar",
        items: [{ name: "Premium Wooden Frame", size: "A4 Size", price: 2400, quantity: 1, image: "/images/wooden_frame_angle.png" }],
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-VYSHU10-1005",
        ambassadorProfileId: vyshuProfile.id,
        referralCode: "VYSHU10",
        customerName: "Pooja Reddy",
        customerPhone: "+91 9123456785",
        totalAmount: 2200,
        status: "PRINTING",
        commissionEarned: 220,
        deliveryAddress: "Sreenidhii Engineering College Hostel, Ghatkesar",
        items: [{ name: "Handcrafted Wooden Frame", size: "8x10 INCH", price: 2200, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    ] : []),

    // Ambassador ARJUN10 Orders
    ...(arjunProfile ? [
      {
        id: "PXL-ARJUN10-1001",
        ambassadorProfileId: arjunProfile.id,
        referralCode: "ARJUN10",
        customerName: "Karthik Raj",
        customerPhone: "+91 9781234561",
        totalAmount: 1500,
        status: "DELIVERED",
        commissionEarned: 150,
        deliveryAddress: "Narayana Junior College Campus, Madhapur, Hyderabad",
        items: [{ name: "Classic Polaroid Set", size: "12 Prints", price: 1500, quantity: 1, image: "/images/polaroid_set.png" }],
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-ARJUN10-1002",
        ambassadorProfileId: arjunProfile.id,
        referralCode: "ARJUN10",
        customerName: "Harish Varma",
        customerPhone: "+91 9781234562",
        totalAmount: 2200,
        status: "DELIVERED",
        commissionEarned: 220,
        deliveryAddress: "Narayana Junior College Campus, Madhapur, Hyderabad",
        items: [{ name: "Custom Wooden Photo Frame", size: "A4 Size", price: 2200, quantity: 1, image: "/images/wooden_frame_main.png" }],
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: "PXL-ARJUN10-1003",
        ambassadorProfileId: arjunProfile.id,
        referralCode: "ARJUN10",
        customerName: "Sneha Reddy",
        customerPhone: "+91 9781234563",
        totalAmount: 1800,
        status: "PRINTING",
        commissionEarned: 180,
        deliveryAddress: "Narayana Junior College Campus, Madhapur, Hyderabad",
        items: [{ name: "LED Acrylic Lamp", size: "Standard", price: 1800, quantity: 1, image: "/images/polaroid_set.png" }],
        date: new Date(Date.now() - 10 * 60 * 60 * 1000),
      },
    ] : []),
  ];

  console.log(`Inserting ${allPreviousOrders.length} previous orders...`);

  for (const o of allPreviousOrders) {
    // Delete if existing to cleanly recreate
    const prevOrder = await prisma.order.findUnique({ where: { id: o.id } });
    if (prevOrder) {
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: o.id } });
      await prisma.transaction.deleteMany({ where: { orderId: o.id } });
      await prisma.commission.deleteMany({ where: { orderId: o.id } });
      await prisma.deliveryInfo.deleteMany({ where: { orderId: o.id } });
      await prisma.order.delete({ where: { id: o.id } });
    }

    await prisma.order.create({
      data: {
        id: o.id,
        customerProfileId: o.customerProfileId || null,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        status: o.status,
        deliveryType: "Shipping",
        assignedStudio: "Studio Alpha (Central Powai Branch)",
        shippingAddress: o.deliveryAddress,
        referralCode: o.referralCode || null,
        referralDiscount: o.referralCode ? Math.round(o.totalAmount * 0.1) : 0,
        commissionEarned: o.commissionEarned || 0,
        createdAt: o.date,
        items: {
          create: o.items.map((it) => ({
            name: it.name,
            size: it.size || "Standard",
            quantity: it.quantity || 1,
            price: it.price || o.totalAmount,
            image: it.image || "/images/wooden_frame_main.png",
            customizationDetails: JSON.stringify({ photos: [it.image || "/images/wooden_frame_main.png"] }),
          })),
        },
        history: {
          create: [
            { status: "PLACED", note: `Order placed by ${o.customerName}`, createdAt: o.date },
            ...(o.status !== "PLACED" ? [{ status: o.status, note: `Status updated to ${o.status}`, createdAt: new Date(o.date.getTime() + 3600000) }] : []),
          ],
        },
        transaction: {
          create: {
            amount: o.totalAmount,
            paymentMethod: "COD",
            status: "SUCCESS",
            createdAt: o.date,
          },
        },
        deliveryInfo: {
          create: {
            deliveryPartnerName: "Ramesh Kumar",
            ...(o.status === "DELIVERED" ? { deliveryTime: o.date } : {}),
            ...(o.status === "OUT_FOR_DELIVERY" ? { pickupTime: o.date } : {}),
          },
        },
        ...(o.ambassadorProfileId ? {
          commission: {
            create: {
              ambassadorProfileId: o.ambassadorProfileId,
              referralCode: o.referralCode,
              amount: o.commissionEarned || 0,
              status: o.status === "DELIVERED" ? "PAID" : "ELIGIBLE",
              createdAt: o.date,
            },
          },
        } : {}),
      },
    });
  }

  // Update Ambassador Balances
  if (sreeProfile) {
    const sreeSum = await prisma.commission.aggregate({
      where: { ambassadorProfileId: sreeProfile.id },
      _sum: { amount: true },
    });
    await prisma.ambassadorProfile.update({
      where: { id: sreeProfile.id },
      data: { totalEarned: sreeSum._sum.amount || 610, balance: sreeSum._sum.amount || 610 },
    });
  }

  if (vyshuProfile) {
    const vyshuSum = await prisma.commission.aggregate({
      where: { ambassadorProfileId: vyshuProfile.id },
      _sum: { amount: true },
    });
    await prisma.ambassadorProfile.update({
      where: { id: vyshuProfile.id },
      data: { totalEarned: vyshuSum._sum.amount || 640, balance: vyshuSum._sum.amount || 640 },
    });
  }

  if (sairohanProfile) {
    const sairohanSum = await prisma.commission.aggregate({
      where: { ambassadorProfileId: sairohanProfile.id },
      _sum: { amount: true },
    });
    await prisma.ambassadorProfile.update({
      where: { id: sairohanProfile.id },
      data: { totalEarned: sairohanSum._sum.amount || 630, balance: sairohanSum._sum.amount || 630 },
    });
  }

  if (arjunProfile) {
    const arjunSum = await prisma.commission.aggregate({
      where: { ambassadorProfileId: arjunProfile.id },
      _sum: { amount: true },
    });
    await prisma.ambassadorProfile.update({
      where: { id: arjunProfile.id },
      data: { totalEarned: arjunSum._sum.amount || 550, balance: arjunSum._sum.amount || 550 },
    });
  }

  const finalOrdersCount = await prisma.order.count();
  console.log(`✅ Successfully restored! Total orders in Prisma dev.db: ${finalOrdersCount}`);
}

restorePreviousOrders().catch(console.error);
