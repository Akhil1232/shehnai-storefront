/**
 * Seeds a working storefront: taxonomy, a starter catalogue with real SKUs and
 * stock, the homepage triptych, and the two editorial blocks.
 *
 *   npm run db:seed
 *
 * Safe to re-run — everything upserts on a natural key.
 *
 * Images point at placeholder URLs. Replace them from the admin panel, or edit
 * IMG below before seeding. Required sizes are noted against each field.
 */
import { PrismaClient, Badge, ProductStatus } from "@prisma/client";
import { buildSku } from "../src/lib/slug";

const prisma = new PrismaClient();

// Seeded products deliberately ship with NO image URLs. The storefront then
// renders the built-in concept illustrations (src/components/ui/JewelArt),
// which look like one coherent catalogue instead of a wall of broken
// placeholders. Upload real photos from the admin panel and they take over
// automatically — nothing here needs changing.
const IMG = {
  product: (_i: number) => null,
  triptych: (_i: number) => null,
  editorial: (_i: number) => null,
  mini: (_i: number) => null,
  banner: (_i: number) => null,
};

const VERTICALS = [
  {
    slug: "mens", name: "Men's", devName: "पुरुष", sortOrder: 1,
    description: "Malas, kalgis and brooches built for sherwanis, bandhgalas and suits.",
    categories: [
      { slug: "mala", name: "Mala" },
      { slug: "kalgi", name: "Kalgi / Kalangi" },
      { slug: "brooches", name: "Brooches" },
    ],
  },
  {
    slug: "womens", name: "Women's", devName: "महिला", sortOrder: 2,
    description: "Necklaces, pendant sets, earrings and bracelets for everyday elegance and celebration.",
    categories: [
      { slug: "necklace", name: "Necklace" },
      { slug: "pendant-set", name: "Pendant Set" },
      { slug: "earrings", name: "Earrings" },
      { slug: "bracelet", name: "Bracelet" },
    ],
  },
  {
    slug: "murti", name: "Murti Sringaar", devName: "मूर्ति शृंगार", sortOrder: 3,
    description: "Stone, pearl and flower necklaces and brooches sized for idol adornment — daily and festive.",
    categories: [
      { slug: "stone-necklace", name: "Stone Necklace" },
      { slug: "pearl-necklace", name: "Pearl Necklace" },
      { slug: "flower-necklace", name: "Flower Necklace" },
      { slug: "brooches", name: "Brooches" },
    ],
  },
  {
    slug: "wedding", name: "Wedding", devName: "विवाह", sortOrder: 4,
    description: "Swagat brooches, lapel pins, malas and sets for the groom's welcome and the baraat.",
    categories: [
      { slug: "swagat-brooches", name: "Swagat Brooches" },
      { slug: "swagat-lapel-pin", name: "Swagat Lapel Pin" },
      { slug: "swagat-mala", name: "Swagat Mala" },
      { slug: "swagat-set", name: "Swagat Set" },
    ],
  },
];

type SeedProduct = {
  slug: string; name: string; vertical: string; category: string;
  description: string; price: number; mrp: number; stock: number;
  badge?: Badge; featured?: boolean;
  material?: string; dimensions?: string; weight?: number; closure?: string;
};

const PRODUCTS: SeedProduct[] = [
  { slug: "stag-wreath-chain-brooch", name: "Stag Wreath Chain Brooch", vertical: "mens", category: "brooches",
    description: "A triple-chain brooch with an antique-brass stag medallion — the flagship of the men's bench.",
    price: 2499, mrp: 3299, stock: 18, badge: Badge.BEST, featured: true,
    material: "Antique brass, alloy chain", dimensions: "7.2 × 5 cm", weight: 34, closure: "Safety-lock pin" },
  { slug: "ashoka-kundan-brooch", name: "Ashoka Kundan Brooch", vertical: "mens", category: "brooches",
    description: "A compact kundan brooch with three drops — the everyday statement for a bandhgala collar.",
    price: 1899, mrp: 2499, stock: 24, badge: Badge.NEW,
    material: "Alloy, kundan stones, glass drops", dimensions: "6 × 4.4 cm", weight: 22, closure: "Safety-lock pin" },
  { slug: "darbar-layered-mala", name: "Darbar Layered Mala", vertical: "mens", category: "mala",
    description: "Three strands of antique-gold beads finished with a carved pendant.",
    price: 3299, mrp: 4199, stock: 12, badge: Badge.BEST, featured: true,
    material: "Brass beads, alloy pendant", dimensions: "46 cm drop", weight: 88, closure: "Hook clasp" },
  { slug: "royal-kalgi-plume", name: "Royal Kalgi Plume", vertical: "mens", category: "kalgi",
    description: "A sculpted kalgi with a pearl drop, sized for a safa or turban.",
    price: 2199, mrp: 2899, stock: 9, badge: Badge.NEW,
    material: "Alloy, faux pearl", dimensions: "12 × 5 cm", weight: 40, closure: "Pin fastening" },
  { slug: "emerald-kundan-bridal-necklace", name: "Emerald Kundan Bridal Necklace", vertical: "womens", category: "necklace",
    description: "A full bridal collar in kundan and emerald-tone stones, with matching drop earrings.",
    price: 6499, mrp: 8999, stock: 7, badge: Badge.BEST, featured: true,
    material: "Alloy, kundan, glass stones", dimensions: "22 cm collar", weight: 180, closure: "Adjustable dori" },
  { slug: "gulab-pendant-set", name: "Gulab Pendant Set", vertical: "womens", category: "pendant-set",
    description: "A rose-motif pendant with chain and studs, finished in antique gold.",
    price: 1699, mrp: 2299, stock: 22, featured: true,
    material: "Alloy, enamel", dimensions: "3.2 cm pendant", weight: 26, closure: "Lobster clasp" },
  { slug: "pearl-drop-earrings", name: "Pearl Drop Earrings", vertical: "womens", category: "earrings",
    description: "Everyday jhumkas with a soft pearl drop, light enough for a full day.",
    price: 899, mrp: 1299, stock: 40, badge: Badge.NEW,
    material: "Alloy, faux pearl", dimensions: "5.5 cm drop", weight: 12, closure: "Push-back" },
  { slug: "kundan-cuff-bracelet", name: "Kundan Cuff Bracelet", vertical: "womens", category: "bracelet",
    description: "An openable kundan cuff that sits flat against the wrist — festive without being heavy.",
    price: 2299, mrp: 2999, stock: 16, badge: Badge.NEW,
    material: "Alloy, kundan stones", dimensions: "6 cm inner diameter", weight: 48, closure: "Hinged clasp" },
  { slug: "ratna-stone-necklace", name: "Ratna Stone Necklace", vertical: "murti", category: "stone-necklace",
    description: "A festive stone necklace sized for a home idol — bright, but light enough for daily sringaar.",
    price: 1299, mrp: 1799, stock: 30, badge: Badge.BEST, featured: true,
    material: "Alloy, coloured stones", dimensions: "14 cm drop", weight: 32, closure: "Tie thread" },
  { slug: "moti-pearl-necklace", name: "Moti Pearl Necklace", vertical: "murti", category: "pearl-necklace",
    description: "A double-strand pearl necklace for everyday adornment.",
    price: 999, mrp: 1399, stock: 35, badge: Badge.NEW,
    material: "Faux pearl, alloy", dimensions: "12 cm drop", weight: 24, closure: "Tie thread" },
  { slug: "pushp-flower-necklace", name: "Pushp Flower Necklace", vertical: "murti", category: "flower-necklace",
    description: "A fabric-flower necklace in festival colours — light to place and easy to store.",
    price: 749, mrp: 1099, stock: 44,
    material: "Fabric, alloy", dimensions: "15 cm drop", weight: 16, closure: "Tie thread" },
  { slug: "sringaar-mini-brooch-pair", name: "Sringaar Mini Brooch Pair", vertical: "murti", category: "brooches",
    description: "A pair of small brooches for pinning fabric and drapes neatly in place.",
    price: 649, mrp: 899, stock: 38,
    material: "Alloy, stones", dimensions: "2.6 cm each", weight: 10, closure: "Pin fastening" },
  { slug: "swagat-groom-brooch", name: "Swagat Groom Brooch", vertical: "wedding", category: "swagat-brooches",
    description: "The welcome brooch for baraat morning — bold, photogenic, and pinned in seconds.",
    price: 1599, mrp: 2199, stock: 26, badge: Badge.NEW, featured: true,
    material: "Alloy, kundan", dimensions: "6.8 × 5.2 cm", weight: 30, closure: "Safety-lock pin" },
  { slug: "swagat-lapel-pin-set", name: "Swagat Lapel Pin Set", vertical: "wedding", category: "swagat-lapel-pin",
    description: "A set of four lapel pins for the groom's party, boxed and ready to gift.",
    price: 1299, mrp: 1799, stock: 20,
    material: "Alloy, enamel", dimensions: "3 cm each", weight: 34, closure: "Butterfly clutch" },
  { slug: "swagat-baraat-mala", name: "Swagat Baraat Mala", vertical: "wedding", category: "swagat-mala",
    description: "A weighty welcome mala in antique gold, made to photograph well in daylight.",
    price: 2899, mrp: 3799, stock: 14,
    material: "Brass beads, alloy", dimensions: "52 cm drop", weight: 120, closure: "Hook clasp" },
  { slug: "swagat-complete-set", name: "Swagat Complete Set", vertical: "wedding", category: "swagat-set",
    description: "Mala, kalgi and brooch in one box — the whole baraat-morning kit.",
    price: 5499, mrp: 7499, stock: 6, badge: Badge.LIMITED, featured: true,
    material: "Brass, alloy, kundan", dimensions: "Boxed set", weight: 210, closure: "Mixed" },
];

async function main() {
  console.log("Seeding Shehnai…\n");

  // ---- taxonomy ---------------------------------------------------------
  for (const v of VERTICALS) {
    const vertical = await prisma.vertical.upsert({
      where: { slug: v.slug },
      update: { name: v.name, devName: v.devName, description: v.description, sortOrder: v.sortOrder },
      create: {
        slug: v.slug, name: v.name, devName: v.devName,
        description: v.description, sortOrder: v.sortOrder,
      },
    });
    for (const [i, c] of v.categories.entries()) {
      await prisma.category.upsert({
        where: { verticalId_slug: { verticalId: vertical.id, slug: c.slug } },
        update: { name: c.name, sortOrder: i },
        create: { slug: c.slug, name: c.name, verticalId: vertical.id, sortOrder: i },
      });
    }
  }
  console.log(`  ${VERTICALS.length} verticals + categories`);

  // ---- catalogue --------------------------------------------------------
  const seqByCat: Record<string, number> = {};
  const usedSkus = new Set<string>(
    (await prisma.productVariant.findMany({ select: { sku: true } })).map((v) => v.sku)
  );
  for (const [i, p] of PRODUCTS.entries()) {
    const vertical = await prisma.vertical.findUniqueOrThrow({ where: { slug: p.vertical } });
    const category = await prisma.category.findUniqueOrThrow({
      where: { verticalId_slug: { verticalId: vertical.id, slug: p.category } },
    });

    const key = `${p.vertical}:${p.category}`;
    seqByCat[key] = (seqByCat[key] ?? 0) + 1;
    let sku = buildSku(p.vertical, p.category, seqByCat[key]);

    // Guard: if two categories ever resolve to the same code, bump until free
    // rather than failing on the unique constraint.
    while (usedSkus.has(sku)) {
      seqByCat[key] += 1;
      sku = buildSku(p.vertical, p.category, seqByCat[key]);
    }
    usedSkus.add(sku);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug, name: p.name, description: p.description,
        verticalId: vertical.id, categoryId: category.id,
        material: p.material, dimensions: p.dimensions,
        weightGrams: p.weight, closure: p.closure,
        careNotes: "Wipe with a dry cloth. Keep away from perfume, water and humidity. Store in the pouch provided.",
        status: ProductStatus.PUBLISHED,
        badge: p.badge ?? Badge.NONE,
        isFeatured: p.featured ?? false,
        sortOrder: i,
        ratingAvg: 4.6 + (i % 4) * 0.1,
        reviewCount: 12 + i * 3,
        // No images seeded — see the IMG note above.
      },
    });

    // One default variant per product. Add more from the admin when a piece
    // genuinely has options (chain length, finish) — each gets its own SKU.
    const variant = await prisma.productVariant.upsert({
      where: { sku },
      update: {},
      create: {
        productId: product.id, sku,
        pricePaise: p.price * 100,
        mrpPaise: p.mrp * 100,
        costPaise: Math.round(p.price * 100 * 0.45),
        stockQty: 0, // set via a ledger movement below, never written directly
        lowStockAt: 5,
        reorderPoint: 10,
        isDefault: true,
      },
    });

    // Opening stock goes in as a real PURCHASE movement so the ledger balances
    // from day one. This is the pattern to follow for every future restock.
    const existing = await prisma.stockMovement.findFirst({
      where: { variantId: variant.id, reason: "PURCHASE", reference: "OPENING" },
    });
    if (!existing) {
      await prisma.$transaction([
        prisma.stockMovement.create({
          data: {
            variantId: variant.id, delta: p.stock, reason: "PURCHASE",
            reference: "OPENING", note: "Opening stock", createdBy: "seed",
          },
        }),
        prisma.productVariant.update({
          where: { id: variant.id },
          data: { stockQty: p.stock },
        }),
      ]);
    }
  }
  console.log(`  ${PRODUCTS.length} products with SKUs + opening stock`);

  // ---- homepage triptych ------------------------------------------------
  // sortOrder decides left / CENTRE / right. Murti sits at 1 = the centre panel.
  const triptych = [
    { key: "The Royal Brooch", href: "/product/stag-wreath-chain-brooch", sortOrder: 0 },
    { key: "Murti Sringaar", href: "/collections/murti", sortOrder: 1 },
    { key: "The Bridal Necklace", href: "/product/emerald-kundan-bridal-necklace", sortOrder: 2 },
  ];
  await prisma.banner.deleteMany({ where: { placement: "HOME_TRIPTYCH" } });
  for (const t of triptych) {
    await prisma.banner.create({
      data: {
        placement: "HOME_TRIPTYCH", title: t.key, href: t.href,
        alt: t.key, sortOrder: t.sortOrder, isActive: true,
      },
    });
  }
  console.log("  homepage triptych (Murti centred)");

  // ---- editable homepage sections ---------------------------------------
  const flagship = await prisma.product.findUnique({ where: { slug: "stag-wreath-chain-brooch" } });
  const bridal = await prisma.product.findUnique({ where: { slug: "emerald-kundan-bridal-necklace" } });

  await prisma.homeSection.upsert({
    where: { key: "flagship-piece" },
    update: {},
    create: {
      key: "flagship-piece", kind: "EDITORIAL",
      eyebrow: "The Flagship Piece",
      heading: flagship?.name ?? "Stag Wreath Chain Brooch",
      body: flagship?.description,
      ctaLabel: "View the Piece",
      productId: flagship?.id,
      config: { swatches: [{ label: "Antique Brass", hex: "#C9A24B" }, { label: "Triple Chain", hex: "#4A0D15" }] },
      sortOrder: 1, isActive: true,
    },
  });

  await prisma.homeSection.upsert({
    where: { key: "bridal-edit" },
    update: {},
    create: {
      key: "bridal-edit", kind: "EDITORIAL",
      eyebrow: "The Bridal Edit",
      heading: bridal?.name ?? "Emerald Kundan Bridal Necklace",
      body: bridal?.description,
      ctaLabel: "View the Necklace",
      productId: bridal?.id,
      config: { swatches: [{ label: "Emerald-Tone", hex: "#2F6B4F" }, { label: "Kundan & Gold", hex: "#C9A24B" }] },
      reversed: true, sortOrder: 2, isActive: true,
    },
  });
  console.log("  editable home sections");

  // ---- reviews ----------------------------------------------------------
  const reviews = [
    ["Arjun M.", "Mumbai", "Stole the sangeet", "Wore it on a black bandhgala — three cousins have already asked for the link."],
    ["Kabir S.", "Delhi", "Packaging is a gift in itself", "Bought for my brother's wedding. Didn't even need wrapping paper."],
    ["Devansh R.", "Bengaluru", "Exactly as pictured", "The kundan work looks even better in hand than on screen."],
    ["Meera P.", "Ahmedabad", "Perfect for the mandir at home", "The stone necklace sits beautifully on our idol — festive, but not heavy at all."],
    ["Rohan K.", "Jaipur", "Groom-ready", "The swagat set made getting dressed for baraat morning so easy."],
  ];
  if ((await prisma.review.count()) === 0) {
    await prisma.review.createMany({
      data: reviews.map(([name, city, title, body]) => ({
        name, city, title, body, rating: 5, isPublished: true, isFeatured: true,
      })),
    });
  }
  console.log("  reviews");

  // ---- settings ---------------------------------------------------------
  const settings: Record<string, unknown> = {
    announcement: "Free pan-India shipping over ₹999 · New: The Kundan Bridal Edit is live",
    freeShippingThresholdPaise: 99900,
    flatShippingPaise: 9900,
    codEnabled: true,
    supportEmail: "care@shehnai.in",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }
  console.log("  settings\n");
  console.log("Done. Run `npm run dev` and open http://localhost:3000");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
