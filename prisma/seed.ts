import { prisma } from "../src/lib/db";

async function main() {
  console.log("Seeding database...");

  // 1. Categories
  const categories = [
    { id: "cat-frames", name: "Frames", slug: "frames", image: "/images/wooden_frame_main.png" },
    { id: "cat-polaroids", name: "Polaroids", slug: "polaroids", image: "/images/polaroid_set.png" },
    { id: "cat-gifts", name: "Gifts", slug: "gifts", image: "/images/custom_mug.png" },
    { id: "cat-led", name: "LED", slug: "led", image: "/images/led_acrylic_lamp.png" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // 2. Products Catalog
  const products = [
    {
      id: "PRD-01",
      name: "Premium Wooden Frame",
      slug: "premium-wooden-frame",
      categoryId: "cat-frames",
      categoryName: "Frames",
      description: "Personalized Premium Wooden Frame crafted with premium quality materials. Perfect for home, office & gifting.",
      basePrice: 149,
      originalPrice: 199,
      rating: 4.8,
      reviews: 124,
      badgeTag: "25% OFF OPENING OFFER",
      badge: "Bestseller",
      images: JSON.stringify(["/images/wooden_frame_main.png", "/images/wooden_frame_angle.png", "/images/wooden_frame_wall.png"]),
      stock: 150,
      status: "Active",
      isActive: true,
      frameSizes: JSON.stringify([
        { label: "4x6 INCH", name: "4x6 INCH", dimensions: "4 x 6 Inches (10.1 x 15.2 cm)", originalPrice: 199, discountPct: 25, gsm180Price: 149, gsm260Price: 159 },
        { label: "5x7 INCH", name: "5x7 INCH", dimensions: "5 x 7 Inches (12.7 x 17.7 cm)", originalPrice: 249, discountPct: 32, gsm180Price: 169, gsm260Price: 179 },
        { label: "6x8 INCH", name: "6x8 INCH", dimensions: "6 x 8 Inches (15.2 x 20.3 cm)", originalPrice: 299, discountPct: 40, gsm180Price: 179, gsm260Price: 189 },
        { label: "A4 SIZE", name: "A4 SIZE (21 x 29.7 cm)", dimensions: "A4 Size (21.0 x 29.7 cm)", originalPrice: 359, discountPct: 45, gsm180Price: 199, gsm260Price: 229 },
      ]),
      frameColors: JSON.stringify([
        { label: "Black", colorClass: "bg-black text-white", borderClass: "border-black", hex: "#000000" },
        { label: "Brown", colorClass: "bg-[#5A3A28] text-white", borderClass: "border-[#5A3A28]", hex: "#5A3A28" },
        { label: "White", colorClass: "bg-white text-[#3A2B24]", borderClass: "border-[#EFE6DD]", hex: "#FFFFFF" },
      ]),
    },
    {
      id: "PRD-02",
      name: "Classic Custom Polaroid Set (24 prints)",
      slug: "classic-custom-polaroid-set",
      categoryId: "cat-polaroids",
      categoryName: "Polaroids",
      description: "Tiny prints, big memories! Transform digital photos into retro-style aesthetic polaroid prints with premium photo paper quality.",
      basePrice: 8,
      originalPrice: 12,
      rating: 4.9,
      reviews: 342,
      badgeTag: "ONLY AT ₹399 • POPULAR",
      badge: "Trending",
      images: JSON.stringify(["/images/polaroid_set.png"]),
      stock: 500,
      status: "Active",
      isActive: true,
      polaroidSizes: JSON.stringify([
        { label: "SMALL", name: "Small Polaroid", priceEach: 8, minOrderQty: 10, description: "Tiny prints • Min order 10 prints" },
        { label: "MEDIUM", name: "Medium Polaroid", priceEach: 15, minOrderQty: 12, description: "Classic polaroid size • Min order 12 prints" },
        { label: "LARGE", name: "Large Polaroid", priceEach: 25, minOrderQty: 4, description: "Jumbo aesthetic print • Min order 4 prints" },
      ]),
    },
    {
      id: "PRD-03",
      name: "Custom Magic Photo Mug",
      slug: "custom-magic-photo-mug",
      categoryId: "cat-gifts",
      categoryName: "Gifts",
      description: "Enjoy hot drinks with your favorite memories! High-grade ceramic mug printed with rich vibrant colors that reveal upon filling hot beverages.",
      basePrice: 349,
      originalPrice: 499,
      rating: 4.6,
      reviews: 89,
      badgeTag: "ONLY AT ₹349 • NEW",
      badge: "New",
      images: JSON.stringify(["/images/custom_mug.png"]),
      stock: 0,
      status: "Out of Stock",
      isActive: true,
    },
    {
      id: "PRD-04",
      name: "LED Acrylic Photo Lamp",
      slug: "led-acrylic-photo-lamp",
      categoryId: "cat-led",
      categoryName: "LED",
      description: "Illuminate your special moments with custom laser-engraved LED acrylic lamps. Features 7 warm light modes with solid wood base.",
      basePrice: 1299,
      originalPrice: 1999,
      rating: 4.9,
      reviews: 215,
      badgeTag: "ONLY AT ₹1299 • TOP RATED",
      badge: "Popular",
      images: JSON.stringify(["/images/led_acrylic_lamp.png"]),
      stock: 45,
      status: "Active",
      isActive: true,
    },
    {
      id: "PRD-05",
      name: "Spotify Acrylic Music Plaque",
      slug: "spotify-acrylic-music-plaque",
      categoryId: "cat-gifts",
      categoryName: "Gifts",
      description: "Scan & Play! Custom acrylic plaque printed with your favorite song waveform, album cover, and scannable Spotify code.",
      basePrice: 799,
      originalPrice: 1199,
      rating: 4.5,
      reviews: 156,
      badgeTag: "ONLY AT ₹799 • LIMITED",
      badge: "Limited",
      images: JSON.stringify(["/images/wooden_frame_angle.png"]),
      stock: 12,
      status: "Low Stock",
      isActive: true,
    },
    {
      id: "PRD-06",
      name: "Lighting Panda",
      slug: "lighting-panda",
      categoryId: "cat-gifts",
      categoryName: "Gifts",
      description: "Light up your CUTE MOMENTS! Moss Panda Lamp featuring soft warm glow, energy-efficient LED, and adorable room decor design.",
      basePrice: 89,
      originalPrice: 199,
      rating: 4.9,
      reviews: 28,
      badgeTag: "ONLY AT ₹89 • SPECIAL DEAL",
      badge: "New",
      images: JSON.stringify(["/images/led_acrylic_lamp.png"]),
      stock: 20,
      status: "Active",
      isActive: true,
    },
    {
      id: "PRD-07",
      name: "Collage Wall Photo Frame Set",
      slug: "collage-wall-photo-frame-set",
      categoryId: "cat-frames",
      categoryName: "Frames",
      description: "Transform your empty walls into a gallery of memories with our multi-frame wall collage set.",
      basePrice: 1499,
      originalPrice: 2499,
      rating: 4.9,
      reviews: 402,
      badgeTag: "ONLY AT ₹1499 • BEST VALUE",
      badge: "Best Value",
      images: JSON.stringify(["/images/wooden_frame_wall.png"]),
      stock: 80,
      status: "Active",
      isActive: true,
    },
    {
      id: "PRD-08",
      name: "Paper Weight",
      slug: "paper-weight",
      categoryId: "cat-gifts",
      categoryName: "Gifts",
      description: "Hold your FOREVER US PAPER WEIGHT! A keepsake that lasts forever. Beautifully crafted with crystal clear design, romantic resin figurines, and ambient LED light.",
      basePrice: 229,
      originalPrice: 399,
      rating: 5.0,
      reviews: 1,
      badgeTag: "ONLY AT ₹229 • BEST QUALITY ♥",
      badge: "Best Quality",
      images: JSON.stringify(["/images/led_acrylic_lamp.png"]),
      stock: 65,
      status: "Active",
      isActive: true,
      variants: JSON.stringify([
        { id: "v1", name: "FOREVER US PAPER WEIGHT (STANDARD)", price: 229, originalPrice: 399, description: "Crystal clear acrylic • Couple figurine with warm LED glow", discountTag: "42% OFF" },
        { id: "v2", name: "FOREVER US PAPER WEIGHT + GIFT WRAP BOX", price: 269, originalPrice: 499, description: "Includes gift box + Personalized message card", discountTag: "46% OFF" },
      ]),
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: prod,
      create: prod,
    });
  }

  // 3. Create Default Users & Profiles
  await prisma.user.upsert({
    where: { email: "neelasaipranav2007@gmail.com" },
    update: {},
    create: {
      name: "Admin Pranav",
      email: "neelasaipranav2007@gmail.com",
      role: "ADMIN",
      phone: "+91 9618401231",
    },
  });

  await prisma.user.upsert({
    where: { email: "studio.powai@pixellostore.com" },
    update: {},
    create: {
      name: "Studio Alpha (Central Powai)",
      email: "studio.powai@pixellostore.com",
      role: "STUDIO",
      phone: "+91 9618401232",
      studioProfile: {
        create: {
          businessName: "Studio Alpha (Central Powai Branch)",
          address: "CHRISTIANS COLONY, HASTINAPURAM, Sarada Nagar, K.V.Rangareddy, Telangana - 500070",
          workingHours: "09:00 AM - 09:00 PM",
          verificationStatus: "APPROVED",
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "ramesh.delivery@pixellostore.com" },
    update: {},
    create: {
      name: "Ramesh Kumar",
      email: "ramesh.delivery@pixellostore.com",
      role: "DELIVERY",
      phone: "+91 9876543210",
      deliveryProfile: {
        create: {
          vehicleDetails: "TVS XL 100 - TS 07 AB 1234",
          licenseNumber: "DL-1420110012345",
          isOnline: true,
          verificationStatus: "APPROVED",
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "sairohan@aurora.edu" },
    update: {},
    create: {
      name: "Sai Rohan",
      email: "sairohan@aurora.edu",
      role: "AMBASSADOR",
      phone: "+91 9876500001",
      ambassadorProfile: {
        create: {
          referralCode: "SAIROHAN10",
          rank: "GOLD",
          totalEarned: 2450.0,
          balance: 1200.0,
          college: "Aurora University",
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "vyshu@sreenidhii.edu" },
    update: {},
    create: {
      name: "Vyshu",
      email: "vyshu@sreenidhii.edu",
      role: "AMBASSADOR",
      phone: "+91 9876500002",
      ambassadorProfile: {
        create: {
          referralCode: "VYSHU10",
          rank: "SILVER",
          totalEarned: 1850.0,
          balance: 950.0,
          college: "Sreenidhii Engineering College",
        },
      },
    },
  });

  // 4. Seed Default Coupons / Promo Codes
  const coupons = [
    {
      code: "PIXELLO20",
      type: "percentage",
      value: 20,
      minOrder: 0,
      maxCustomerLimit: 200,
      usageCount: 142,
      category: "All Categories",
      status: "Active",
      description: "Official Store Launch Offer • 20% OFF on Total Order Amount",
    },
    {
      code: "PIXELLO 15",
      type: "percentage",
      value: 15,
      minOrder: 199,
      maxCustomerLimit: 1,
      usageCount: 0,
      category: "All Categories",
      status: "Active",
      description: "Special Store Launch Offer • 15% OFF (Min Order ₹199)",
    },
    {
      code: "SAIROHAN10",
      type: "percentage",
      value: 10,
      minOrder: 0,
      maxCustomerLimit: 100,
      usageCount: 89,
      category: "All Categories",
      status: "Active",
      description: "Campus Ambassador Referral Code (Sai Rohan - Aurora University)",
    },
    {
      code: "VYSHU10",
      type: "percentage",
      value: 10,
      minOrder: 0,
      maxCustomerLimit: 100,
      usageCount: 64,
      category: "All Categories",
      status: "Active",
      description: "Campus Ambassador Referral Code (Vyshu - Sreenidhii Engineering)",
    },
    {
      code: "WELCOME100",
      type: "flat",
      value: 100,
      minOrder: 0,
      maxCustomerLimit: 300,
      usageCount: 215,
      category: "All Categories",
      status: "Active",
      description: "First Time Customer Welcome Bonus • Flat ₹100 Instant Discount",
    },
    {
      code: "FESTIVE15",
      type: "percentage",
      value: 15,
      minOrder: 0,
      maxCustomerLimit: 50,
      usageCount: 38,
      category: "Frames",
      status: "Active",
      description: "Festive Season Discount • 15% OFF on Total Order Amount",
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }

  // 5. Seed Initial Orders
  const initialOrders = [
    {
      id: "PXL-1231-0001",
      customerName: "Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 2410.00,
      status: "DELIVERED" as const,
      assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
      shippingAddress: "H.No 3-45/1, Christians Colony, Hastinapuram, Hyderabad, Telangana - 500070",
      items: [
        {
          name: "Premium Wooden Frame",
          size: "A4 SIZE (260 GSM, Black Frame)",
          quantity: 10,
          price: 229.0,
          image: "/images/wooden_frame_main.png",
          customizationDetails: JSON.stringify({ photos: ["/images/wooden_frame_main.png"] }),
        },
      ],
    },
    {
      id: "PXL-1231-0070",
      customerName: "Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 161.00,
      status: "DELIVERED" as const,
      assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
      shippingAddress: "CHRISTIANS COLONY, HASTINAPURAM ,, 500070, K.V.Rangareddy, Telangana - 500070",
      items: [
        {
          name: "Premium Wooden Frame",
          size: "5x7 INCH (260 GSM, Black Frame)",
          quantity: 1,
          price: 179.0,
          image: "/images/wooden_frame_main.png",
          customizationDetails: JSON.stringify({ photos: ["/images/wooden_frame_main.png"] }),
        },
      ],
    },
    {
      id: "PXL-6610-0010",
      customerName: "Harsha",
      customerPhone: "+91 7989856610",
      totalAmount: 462.00,
      status: "OUT_FOR_DELIVERY" as const,
      assignedStudio: "Direct Warehouse Dispatch (No Studio Required)",
      shippingAddress: "Near nepal reddy Motors, Alwal, Hyderabad, Telangana - 500010",
      items: [
        {
          name: "Paper Weight",
          size: "Forever Us Paper Weight (Standard)",
          quantity: 1,
          price: 462.0,
          image: "/images/wooden_frame_angle.png",
          customizationDetails: JSON.stringify({ photos: ["/images/wooden_frame_angle.png"] }),
        },
      ],
    },
    {
      id: "PXL-9988-5001",
      customerName: "Harsha vardhan",
      customerPhone: "+91 9988112233",
      totalAmount: 638.82,
      status: "DELIVERED" as const,
      assignedStudio: "Pixello Studio (Sanath Nagar, Hyderabad)",
      shippingAddress: "Near Nepal reddy motors, Alwal, Hyderabad - 500018",
      items: [
        {
          name: "Classic Polaroid Set (24 prints)",
          size: "MEDIUM Polaroid (12 Prints)",
          quantity: 1,
          price: 638.82,
          image: "/images/polaroid_set.png",
          customizationDetails: JSON.stringify({ photos: ["/images/polaroid_set.png"] }),
        },
      ],
    },
    {
      id: "PXL-9618-5015",
      customerName: "Neela Sai Pranav",
      customerPhone: "+91 9618401231",
      totalAmount: 2410.00,
      status: "DELIVERED" as const,
      assignedStudio: "Pixello Store (Sarada Nagar, Telangana)",
      shippingAddress: "Plot No. 42, Alwal Hills, Secunderabad, Telangana - 500015",
      items: [
        {
          name: "Custom Spotify Acrylic Plaque",
          size: "A5 Acrylic Plaque (Scannable Code)",
          quantity: 2,
          price: 1205.0,
          image: "/images/wooden_frame_main.png",
          customizationDetails: JSON.stringify({ photos: ["/images/wooden_frame_main.png"] }),
        },
      ],
    },
  ];

  for (const o of initialOrders) {
    const { items, ...orderData } = o;
    const existing = await prisma.order.findUnique({ where: { id: o.id } });
    if (!existing) {
      await prisma.order.create({
        data: {
          ...orderData,
          items: {
            create: items,
          },
          history: {
            create: {
              status: o.status,
              note: `Initial order record created with status ${o.status}`,
            },
          },
          transaction: {
            create: {
              amount: o.totalAmount,
              paymentMethod: "COD",
              status: "SUCCESS",
            },
          },
        },
      });
    }
  }

  // 6. Studio Inventory Items
  const inventory = [
    { id: "inv-01", itemName: "A4 Synthetic Black Wooden Frame", category: "Frames", stock: 120, unit: "pcs", minAlert: 20, status: "In Stock" },
    { id: "inv-02", itemName: "5x7 Inch Natural Pine Wood Frame", category: "Frames", stock: 85, unit: "pcs", minAlert: 15, status: "In Stock" },
    { id: "inv-03", itemName: "260 GSM Premium Ultra Glossy Photo Paper", category: "Paper", stock: 450, unit: "sheets", minAlert: 50, status: "In Stock" },
    { id: "inv-04", itemName: "High Grade Sublimation Blank Magic Mugs", category: "Mugs", stock: 8, unit: "pcs", minAlert: 10, status: "Low Stock" },
    { id: "inv-05", itemName: "Laser Cut Clear Acrylic Base (Warm LED)", category: "LED", stock: 35, unit: "units", minAlert: 10, status: "In Stock" },
  ];

  for (const inv of inventory) {
    await prisma.studioInventory.upsert({
      where: { id: inv.id },
      update: inv,
      create: inv,
    });
  }

  console.log("Database seeded successfully with all Pixello catalog and relations!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
