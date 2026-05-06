import { PrismaClient, Role, TagType, TagStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
    .slice(0, 12);
}

async function main() {
  console.log('Seeding database...');

  // Create admin user (password: Admin123!)
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@scan2call.com.au' },
    update: {},
    create: {
      email: 'admin@scan2call.com.au',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });

  // Create sample products
  const products = [
    {
      name: 'Pet Collar Tag',
      slug: 'pet-collar-tag',
      description: 'Durable QR tag that attaches to any pet collar. Waterproof and UV-resistant.',
      shortDescription: 'For pets',
      priceInCents: 1299,
      sku: 'TAG-PET-001',
      stockQuantity: 100,
      isInStock: true,
      tagType: TagType.PET_COLLAR,
      includesTagCount: 1,
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      name: 'Car Windshield Sticker',
      slug: 'car-windshield-sticker',
      description: 'Transparent QR sticker for your car windshield. Heat and weather resistant.',
      shortDescription: 'For vehicles',
      priceInCents: 899,
      sku: 'TAG-CAR-001',
      stockQuantity: 200,
      isInStock: true,
      tagType: TagType.CAR_STICKER,
      includesTagCount: 1,
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      name: 'Luggage Tag',
      slug: 'luggage-tag',
      description: 'Sleek QR luggage tag with leather strap. Perfect for travel.',
      shortDescription: 'For bags & luggage',
      priceInCents: 999,
      sku: 'TAG-LUG-001',
      stockQuantity: 150,
      isInStock: true,
      tagType: TagType.LUGGAGE_TAG,
      includesTagCount: 1,
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
    },
    {
      name: 'Keychain Tag',
      slug: 'keychain-tag',
      description: 'Compact QR keychain tag. Lightweight aluminium with split ring.',
      shortDescription: 'For keys',
      priceInCents: 799,
      sku: 'TAG-KEY-001',
      stockQuantity: 300,
      isInStock: true,
      tagType: TagType.KEYCHAIN,
      includesTagCount: 1,
      isActive: true,
      isFeatured: false,
      sortOrder: 4,
    },
    {
      name: 'Medical ID Band',
      slug: 'medical-id-band',
      description: 'Adjustable silicone wristband with QR code. For medical, dementia, or child safety use.',
      shortDescription: 'For people',
      priceInCents: 1499,
      sku: 'TAG-MED-001',
      stockQuantity: 75,
      isInStock: true,
      tagType: TagType.MEDICAL_BAND,
      includesTagCount: 1,
      isActive: true,
      isFeatured: true,
      sortOrder: 5,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  // Create a sample tag batch
  const batch = await prisma.tagBatch.create({
    data: {
      name: 'Seed Batch - Demo Tags',
      quantity: 5,
      tagType: TagType.GENERIC,
      generatedBy: admin.id,
      notes: 'Auto-generated seed data',
    },
  });

  // Create sample tags
  for (let i = 0; i < 5; i++) {
    await prisma.tag.create({
      data: {
        token: generateToken(),
        type: TagType.GENERIC,
        status: TagStatus.INACTIVE,
        batchId: batch.id,
      },
    });
  }

  const qrTemplates = [
    {
      name: 'Yellow Badge',
      description: 'Gold badge with high-contrast QR.',
      config: {
        size: 320,
        margin: 2,
        foregroundColor: '#111111',
        backgroundColor: '#F9C63A',
      },
    },
    {
      name: 'Midnight Slate',
      description: 'Dark slate background with bright QR.',
      config: {
        size: 320,
        margin: 2,
        foregroundColor: '#F8FAFC',
        backgroundColor: '#0B1220',
      },
    },
    {
      name: 'Ocean Mist',
      description: 'Soft aqua backdrop with deep ink QR.',
      config: {
        size: 320,
        margin: 2,
        foregroundColor: '#0F172A',
        backgroundColor: '#DFF4F1',
      },
    },
  ];

  const templateByName = new Map<string, { id: string }>();
  for (const template of qrTemplates) {
    const existing = await prisma.qrDesignTemplate.findFirst({ where: { name: template.name } });
    if (existing) {
      templateByName.set(template.name, existing);
      continue;
    }

    const created = await prisma.qrDesignTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        config: template.config,
        isActive: true,
        createdBy: admin.id,
      },
    });

    templateByName.set(template.name, created);
  }

  const defaultTemplate = templateByName.get('Yellow Badge');
  if (defaultTemplate) {
    await prisma.systemSetting.upsert({
      where: { key: 'defaultQrDesignTemplateId' },
      update: { value: { templateId: defaultTemplate.id } },
      create: {
        key: 'defaultQrDesignTemplateId',
        value: { templateId: defaultTemplate.id },
        description: 'Default QR design template for new tag batches.',
      },
    });
  }

  // Log what was created
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const tagBatchCount = await prisma.tagBatch.count();
  const tagCount = await prisma.tag.count();
  const qrTemplateCount = await prisma.qrDesignTemplate.count();

  console.log('--- Seed Summary ---');
  console.log(`Admin user: ${admin.email} (role: ${admin.role})`);
  console.log(`Users: ${userCount}`);
  console.log(`Products: ${productCount}`);
  console.log(`Tag Batches: ${tagBatchCount}`);
  console.log(`Tags: ${tagCount}`);
  console.log(`QR Templates: ${qrTemplateCount}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
