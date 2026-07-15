import { PrismaClient, ProductStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.review.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.wishlistItem.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.product.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.category.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.userAddress.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const adminUser = await prisma.user.create({
    data: { email: 'admin@marketverse.local', password: await bcrypt.hash('Admin123!', 12), name: 'Admin', role: UserRole.ADMIN, emailVerified: true },
  });

  const customer = await prisma.user.create({
    data: { email: 'customer@marketverse.local', password: await bcrypt.hash('Customer123!', 12), name: 'Demo Customer', role: UserRole.CUSTOMER, emailVerified: true },
  });

  const vendorUser = await prisma.user.create({
    data: { email: 'vendor@marketverse.local', password: await bcrypt.hash('Vendor123!', 12), name: 'Demo Vendor', role: UserRole.VENDOR, emailVerified: true },
  });

  const vendor = await prisma.vendor.create({
    data: { userId: vendorUser.id, storeName: 'TechVault', storeSlug: 'techvault', description: 'Premium electronics and gadgets', isVerified: true, commissionRate: 10 },
  });

  const electronics = await prisma.category.create({ data: { name: 'Electronics', slug: 'electronics', description: 'Gadgets and devices' } });
  const fashion = await prisma.category.create({ data: { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories' } });

  await prisma.product.createMany({
    data: [
      {
        vendorId: vendor.id,
        categoryId: electronics.id,
        name: 'Wireless Noise-Cancelling Headphones',
        slug: 'wireless-noise-cancelling-headphones',
        description: 'Immersive sound with industry-leading noise cancellation and 30-hour battery life.',
        shortDescription: 'Premium wireless headphones with active noise cancellation.',
        price: 299.99,
        sku: 'WH-1000XM5',
        stock: 50,
        lowStockThreshold: 10,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/600x600?text=Headphones'],
        tags: ['audio', 'wireless', 'headphones'],
      },
      {
        vendorId: vendor.id,
        categoryId: electronics.id,
        name: 'Smart Fitness Watch',
        slug: 'smart-fitness-watch',
        description: 'Track your health, workouts, and sleep with GPS and heart-rate monitoring.',
        shortDescription: 'Advanced fitness tracker with GPS and SpO2.',
        price: 199.99,
        sku: 'FIT-PRO-01',
        stock: 80,
        lowStockThreshold: 15,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/600x600?text=Watch'],
        tags: ['fitness', 'wearables', 'smartwatch'],
      },
      {
        vendorId: vendor.id,
        categoryId: fashion.id,
        name: 'Minimalist Leather Backpack',
        slug: 'minimalist-leather-backpack',
        description: 'Handcrafted full-grain leather backpack with laptop compartment.',
        shortDescription: 'Genuine leather backpack for work and travel.',
        price: 149.99,
        sku: 'BP-LTHR-01',
        stock: 25,
        lowStockThreshold: 5,
        status: ProductStatus.ACTIVE,
        images: ['https://placehold.co/600x600?text=Backpack'],
        tags: ['fashion', 'leather', 'travel'],
      },
    ],
  });

  console.log('Seeded database with:');
  console.log(`  Admin: ${adminUser.email}`);
  console.log(`  Customer: ${customer.email}`);
  console.log(`  Vendor: ${vendorUser.email}`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
