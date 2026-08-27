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

async function migrateOrderIds() {
  console.log("=== MIGRATING ALL PREVIOUS ORDER IDS TO PXL-PHONE-PINCODE FORMAT ===\n");

  const orders = await prisma.order.findMany({
    include: {
      items: true,
      history: true,
      transaction: true,
      deliveryInfo: true,
      commission: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const usedIds = new Set();
  const idMap = [];

  for (const o of orders) {
    const cleanPhone = (o.customerPhone || "").replace(/\D/g, "").slice(-4) || "1000";
    const pincodeMatch = (o.shippingAddress || "").match(/\b\d{6}\b/) || (o.shippingAddress || "").match(/\b\d{4,6}\b/);
    const cleanPin = pincodeMatch ? pincodeMatch[0].slice(-4) : "5000";

    const baseId = `PXL-${cleanPhone}-${cleanPin}`;
    let newId = baseId;

    if (usedIds.has(newId)) {
      let seq = 2;
      while (usedIds.has(`${baseId}-${seq}`)) {
        seq++;
      }
      newId = `${baseId}-${seq}`;
    }

    usedIds.add(newId);
    idMap.push({ oldId: o.id, newId, order: o });
  }

  console.log("Planned ID Renaming:");
  idMap.forEach(({ oldId, newId, order }) => {
    console.log(`  ${oldId}  -->  ${newId} (${order.customerName}, Rs ${order.totalAmount})`);
  });

  // Re-create each order with the new ID and copy all relations
  for (const { oldId, newId, order } of idMap) {
    if (oldId === newId) continue;

    // 1. Delete old relations & order
    await prisma.orderItem.deleteMany({ where: { orderId: oldId } });
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: oldId } });
    await prisma.transaction.deleteMany({ where: { orderId: oldId } });
    await prisma.commission.deleteMany({ where: { orderId: oldId } });
    await prisma.deliveryInfo.deleteMany({ where: { orderId: oldId } });
    await prisma.notification.deleteMany({ where: { referenceId: oldId } });
    await prisma.order.delete({ where: { id: oldId } });

    // 2. Create new Order with new ID
    await prisma.order.create({
      data: {
        id: newId,
        customerProfileId: order.customerProfileId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        deliveryType: order.deliveryType,
        assignedStudio: order.assignedStudio,
        shippingAddress: order.shippingAddress,
        referralCode: order.referralCode,
        referralDiscount: order.referralDiscount,
        commissionEarned: order.commissionEarned,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: {
          create: order.items.map((it) => ({
            name: it.name,
            size: it.size,
            quantity: it.quantity,
            price: it.price,
            image: it.image,
            customizationDetails: it.customizationDetails,
          })),
        },
        history: {
          create: order.history.map((h) => ({
            status: h.status,
            note: h.note,
            createdAt: h.createdAt,
          })),
        },
        ...(order.transaction ? {
          transaction: {
            create: {
              paymentMethod: order.transaction.paymentMethod,
              amount: order.transaction.amount,
              status: order.transaction.status,
              createdAt: order.transaction.createdAt,
            },
          },
        } : {}),
        ...(order.deliveryInfo ? {
          deliveryInfo: {
            create: {
              deliveryPartnerName: order.deliveryInfo.deliveryPartnerName,
              pickupTime: order.deliveryInfo.pickupTime,
              deliveryTime: order.deliveryInfo.deliveryTime,
            },
          },
        } : {}),
        ...(order.commission ? {
          commission: {
            create: {
              ambassadorProfileId: order.commission.ambassadorProfileId,
              referralCode: order.commission.referralCode,
              amount: order.commission.amount,
              status: order.commission.status,
              createdAt: order.commission.createdAt,
            },
          },
        } : {}),
      },
    });
  }

  const updatedOrders = await prisma.order.findMany({
    select: { id: true, customerName: true, customerPhone: true, totalAmount: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n=== ALL MIGRATED ORDERS IN DEV.DB ===");
  updatedOrders.forEach((o) => {
    console.log(` - ${o.id} | ${o.customerName} | ${o.customerPhone} | Rs ${o.totalAmount} | ${o.status}`);
  });

  console.log(`\n🎉 Successfully migrated ${updatedOrders.length} orders to PXL-Phone-Pincode format!`);
}

migrateOrderIds().catch(console.error);
