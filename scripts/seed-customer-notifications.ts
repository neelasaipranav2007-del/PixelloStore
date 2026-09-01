import { prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding Customer Portal Notifications...");

  const customerNotifications = [
    {
      role: "CUSTOMER",
      type: "ORDER_OUT_FOR_DELIVERY",
      title: "Out for Delivery 🚀",
      message: "Order #PXL-6610-5000 is on the way with delivery partner Ramesh Kumar.",
      referenceType: "ORDER",
      referenceId: "PXL-6610-5000",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    },
    {
      role: "CUSTOMER",
      type: "STUDIO_REPLY",
      title: "Pixello Studio Team",
      message: "Thank you Harsha! We are thrilled that you loved the frame finish and print clarity.",
      referenceType: "ORDER",
      referenceId: "PXL-6610-8001",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
    },
    {
      role: "CUSTOMER",
      type: "ORDER_PREPARATION",
      title: "Studio Production Update ✨",
      message: "Your Custom Wooden Frame order #PXL-6610-0070 is currently in precision framing & quality check.",
      referenceType: "ORDER",
      referenceId: "PXL-6610-0070",
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      role: "CUSTOMER",
      type: "PROMO_EXCLUSIVE",
      title: "Exclusive Festivity Offer 🎁",
      message: "Use promo code PIXELLO10 at checkout for flat 10% discount on personalized Polaroids.",
      referenceType: "PROMO",
      referenceId: "PIXELLO10",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    },
    {
      role: "CUSTOMER",
      type: "ORDER_DELIVERED",
      title: "Order Delivered Successfully 🎉",
      message: "Order #PXL-1231-0070 has been safely delivered to your doorstep. Enjoy your handcrafted memories!",
      referenceType: "ORDER",
      referenceId: "PXL-1231-0070",
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    },
    {
      role: "CUSTOMER",
      type: "WELCOME_PIXELLO",
      title: "Welcome to Pixello Store 💖",
      message: "Explore our collection of custom wooden frames, retro polaroids, acrylic plaques and gifts.",
      referenceType: null,
      referenceId: null,
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    },
  ];

  for (const notif of customerNotifications) {
    const created = await prisma.notification.create({
      data: notif,
    });
    console.log(`Created customer notification: ${created.title} (${created.id})`);
  }

  const total = await prisma.notification.count({ where: { role: "CUSTOMER" } });
  const unread = await prisma.notification.count({ where: { role: "CUSTOMER", isRead: false } });
  console.log(`Total Customer Notifications: ${total} (${unread} unread)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
