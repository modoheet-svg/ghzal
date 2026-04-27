import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { storeItems, userInventory, users } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const storeRouter = createRouter({
  // Get all items
  getItems: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(storeItems).where(eq(storeItems.isActive, true));
  }),

  // Get items by category
  getItemsByCategory: publicQuery
    .input(z.object({ category: z.enum(["badge", "theme", "effect", "rank", "other"]) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(storeItems)
        .where(
          and(
            eq(storeItems.category, input.category),
            eq(storeItems.isActive, true)
          )
        );
    }),

  // Purchase item
  purchaseItem: authedQuery
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      const item = await db.query.storeItems.findFirst({
        where: eq(storeItems.id, input.itemId),
      });

      if (!user || !item) throw new Error("Not found");
      if ((user.coins || 0) < item.price) throw new Error("Insufficient coins");

      // Deduct coins
      await db
        .update(users)
        .set({ coins: (user.coins || 0) - item.price })
        .where(eq(users.id, ctx.user.id));

      // Add to inventory
      await db.insert(userInventory).values({
        userId: ctx.user.id,
        itemId: input.itemId,
      });

      return { success: true };
    }),

  // Get user inventory
  getInventory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(userInventory)
      .where(eq(userInventory.userId, ctx.user.id));
  }),

  // Equip item
  equipItem: authedQuery
    .input(z.object({ inventoryId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(userInventory)
        .set({ isEquipped: true })
        .where(eq(userInventory.id, input.inventoryId));

      return { success: true };
    }),

  // Create item (admin only)
  createItem: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["badge", "theme", "effect", "rank", "other"]),
        price: z.number().min(0),
        icon: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(storeItems).values(input);
      return { success: true };
    }),
});
