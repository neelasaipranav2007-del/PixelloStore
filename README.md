# Pixello Store

Pixello Store is a modern personalized photo gifting and bespoke merchandise e-commerce platform built with Next.js 16 (App Router), Tailwind CSS, Prisma, and SQLite.

## Features

- **Personalized Hamper Builder**:
  - Interactive hamper boxes (crates, luxury gift sets, wooden treasure boxes)
  - Custom Polaroid sets with dynamic photo count and individual/multi-upload slots
  - Custom add-ons: keychains, Spotify plaques, paperweights, lighting gifts
- **Memory Frames Customizer**:
  - Custom size selection with live dimension calculation
  - Studio photo crop & orientation preview
- **Customer Portal**:
  - 10-stage live delivery tracking synchronized in real-time with the admin portal
  - Saved addresses, digital memories vault, and order history
- **Visual Search & Catalog Discovery**:
  - AI-assisted catalog search and image similarity matching
- **Admin Management Hub**:
  - Real-time order fulfillment & status updating
  - Custom frame, hamper, and promotional spotlight settings
  - Analytics and customer management

## Tech Stack

- **Framework**: Next.js 16 (App Router & Turbopack)
- **Styling**: Tailwind CSS & Framer Motion
- **Database**: SQLite via Prisma ORM
- **Authentication & Security**: Custom session management, audit logs, and security headers

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npx prisma generate
```

3. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
