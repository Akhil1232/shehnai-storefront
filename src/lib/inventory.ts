import { Prisma, StockReason } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * =============================================================================
 * INVENTORY
 * =============================================================================
 * Rules of the house:
 *
 *  1. NEVER write `stockQty` directly. Always go through `applyStockMovement`
 *     so the ledger and the running total move together, in one transaction.
 *  2. `stockQty`    = units physically on the shelf.
 *     `reservedQty` = units promised to orders that aren't shipped yet.
 *     available     = stockQty - reservedQty  <- this is what the storefront shows.
 *  3. Reserve at order creation, convert to a SALE on payment, RELEASE on
 *     cancellation or payment failure. That's what stops two customers buying
 *     the same one-of-a-kind piece during a festival rush.
 */

export type StockMovementInput = {
  variantId: string;
  delta: number; // signed: +12 received, -1 sold
  reason: StockReason;
  // These mirror nullable Prisma columns, so they accept null as well as
  // undefined — form helpers hand back `string | null` and shouldn't each
  // have to coerce.
  note?: string | null;
  reference?: string | null; // order number, invoice, stocktake id
  createdBy?: string | null;
};

/** Records a movement AND updates the running total atomically. */
export async function applyStockMovement(
  input: StockMovementInput,
  tx?: Prisma.TransactionClient
) {
  const run = async (db: Prisma.TransactionClient) => {
    const variant = await db.productVariant.findUnique({
      where: { id: input.variantId },
      select: { id: true, sku: true, stockQty: true },
    });
    if (!variant) throw new Error(`Unknown variant ${input.variantId}`);

    const next = variant.stockQty + input.delta;
    if (next < 0) {
      throw new Error(
        `Refusing to take ${variant.sku} below zero (have ${variant.stockQty}, asked ${input.delta})`
      );
    }

    await db.stockMovement.create({ data: input });
    return db.productVariant.update({
      where: { id: input.variantId },
      data: { stockQty: next },
    });
  };

  return tx ? run(tx) : prisma.$transaction(run);
}

/** Hold units for an unpaid order. Throws if someone got there first. */
export async function reserveStock(
  items: { variantId: string; qty: number }[],
  reference: string,
  tx?: Prisma.TransactionClient
) {
  const run = async (db: Prisma.TransactionClient) => {
    for (const item of items) {
      const v = await db.productVariant.findUnique({
        where: { id: item.variantId },
        select: { sku: true, stockQty: true, reservedQty: true },
      });
      if (!v) throw new Error(`Unknown variant ${item.variantId}`);

      const available = v.stockQty - v.reservedQty;
      if (available < item.qty) {
        throw new Error(
          `Only ${available} left of ${v.sku} — someone else is checking out with it.`
        );
      }

      await db.productVariant.update({
        where: { id: item.variantId },
        data: { reservedQty: { increment: item.qty } },
      });
      await db.stockMovement.create({
        data: {
          variantId: item.variantId,
          delta: 0, // a reservation moves nothing physically
          reason: StockReason.RESERVE,
          reference,
          note: `Reserved ${item.qty}`,
        },
      });
    }
  };

  return tx ? run(tx) : prisma.$transaction(run);
}

/** Payment cleared: reservation becomes a real outbound movement. */
export async function commitReservation(
  items: { variantId: string; qty: number }[],
  reference: string,
  tx?: Prisma.TransactionClient
) {
  const run = async (db: Prisma.TransactionClient) => {
    for (const item of items) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { reservedQty: { decrement: item.qty } },
      });
      await applyStockMovement(
        {
          variantId: item.variantId,
          delta: -item.qty,
          reason: StockReason.SALE,
          reference,
        },
        db
      );
    }
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

/** Order cancelled or payment failed: put the hold back. */
export async function releaseReservation(
  items: { variantId: string; qty: number }[],
  reference: string,
  tx?: Prisma.TransactionClient
) {
  const run = async (db: Prisma.TransactionClient) => {
    for (const item of items) {
      await db.productVariant.update({
        where: { id: item.variantId },
        data: { reservedQty: { decrement: item.qty } },
      });
      await db.stockMovement.create({
        data: {
          variantId: item.variantId,
          delta: 0,
          reason: StockReason.RELEASE,
          reference,
          note: `Released ${item.qty}`,
        },
      });
    }
  };
  return tx ? run(tx) : prisma.$transaction(run);
}

/** Powers the admin dashboard alert list. */
export async function lowStockVariants() {
  const rows = await prisma.$queryRaw<
    { id: string; sku: string; name: string; stockQty: number; lowStockAt: number }[]
  >`
    SELECT v.id, v.sku, p.name, v."stockQty", v."lowStockAt"
    FROM "ProductVariant" v
    JOIN "Product" p ON p.id = v."productId"
    WHERE v."isActive" = true AND v."stockQty" <= v."lowStockAt"
    ORDER BY v."stockQty" ASC
  `;
  return rows;
}

export const availableQty = (v: { stockQty: number; reservedQty: number }) =>
  Math.max(0, v.stockQty - v.reservedQty);
