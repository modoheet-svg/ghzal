import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, coinTransactions, wallPosts } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const userRouter = createRouter({
  // Get user profile
  getProfile: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.users.findFirst({
        where: eq(users.id, input.id),
        columns: {
          id: true,
          name: true,
          displayName: true,
          username: true,
          avatar: true,
          rank: true,
          status: true,
          mood: true,
          gender: true,
          country: true,
          age: true,
          about: true,
          coins: true,
          isOnline: true,
          lastActive: true,
          createdAt: true,
        },
      });
    }),

  // Update profile
  updateProfile: authedQuery
    .input(
      z.object({
        displayName: z.string().max(100).optional(),
        status: z.string().max(255).optional(),
        mood: z.string().max(100).optional(),
        gender: z.enum(["male", "female", "unknown"]).optional(),
        country: z.string().max(50).optional(),
        age: z.number().min(13).max(120).optional(),
        about: z.string().max(500).optional(),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  // Get all users (admin only)
  listUsers: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        displayName: users.displayName,
        username: users.username,
        email: users.email,
        rank: users.rank,
        role: users.role,
        isOnline: users.isOnline,
        coins: users.coins,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  // Update user rank
  updateRank: adminQuery
    .input(
      z.object({
        userId: z.number(),
        rank: z.enum(["visitor", "member", "premium", "royal", "bot", "admin", "owner"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ rank: input.rank, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Add coins
  addCoins: authedQuery
    .input(
      z.object({
        amount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user) throw new Error("User not found");

      const newCoins = (user.coins || 0) + input.amount;
      await db
        .update(users)
        .set({ coins: newCoins })
        .where(eq(users.id, ctx.user.id));

      // Record transaction
      await db.insert(coinTransactions).values({
        userId: ctx.user.id,
        amount: input.amount,
        type: "earn",
        description: "Coins added",
      });

      return { coins: newCoins };
    }),

  // Get coin history
  getCoinHistory: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(coinTransactions)
      .where(eq(coinTransactions.userId, ctx.user.id))
      .orderBy(desc(coinTransactions.createdAt));
  }),

  // Get wall posts
  getWallPosts: publicQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(wallPosts)
        .where(eq(wallPosts.userId, input.userId))
        .orderBy(desc(wallPosts.createdAt));
    }),

  // Add wall post
  addWallPost: authedQuery
    .input(z.object({ content: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(wallPosts).values({
        userId: ctx.user.id,
        content: input.content,
      });
      return { success: true };
    }),
});
