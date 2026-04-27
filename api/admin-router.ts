import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import {
  users,
  chatMessages,
  chatRooms,
  siteSettings,
  notifications,
} from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const adminRouter = createRouter({
  // Dashboard stats
  getStats: adminQuery.query(async () => {
    const db = getDb();
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const onlineUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isOnline, true));
    const totalMessages = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages);
    const totalRooms = await db.select({ count: sql<number>`count(*)` }).from(chatRooms);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      onlineUsers: onlineUsers[0]?.count || 0,
      totalMessages: totalMessages[0]?.count || 0,
      totalRooms: totalRooms[0]?.count || 0,
    };
  }),

  // Get all users with pagination
  getUsers: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);
    }),

  // Update user
  updateUser: adminQuery
    .input(
      z.object({
        userId: z.number(),
        rank: z
          .enum(["visitor", "member", "premium", "royal", "bot", "admin", "owner"])
          .optional(),
        role: z.enum(["user", "admin"]).optional(),
        coins: z.number().optional(),
        isOnline: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { userId, ...data } = input;
      await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  // Delete message
  deleteMessage: adminQuery
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .delete(chatMessages)
        .where(eq(chatMessages.id, input.messageId));

      return { success: true };
    }),

  // Create room
  createRoom: adminQuery
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["public", "private", "admin"]).default("public"),
        icon: z.string().optional(),
        order: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(chatRooms).values(input);
      return { success: true };
    }),

  // Update room
  updateRoom: adminQuery
    .input(
      z.object({
        roomId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { roomId, ...data } = input;
      await db
        .update(chatRooms)
        .set(data)
        .where(eq(chatRooms.id, roomId));

      return { success: true };
    }),

  // Delete room
  deleteRoom: adminQuery
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(chatRooms).where(eq(chatRooms.id, input.roomId));
      return { success: true };
    }),

  // Send announcement
  sendAnnouncement: adminQuery
    .input(
      z.object({
        roomId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.insert(chatMessages).values({
        roomId: input.roomId,
        content: input.content,
        type: "announcement",
      });

      return { success: true };
    }),

  // Update site settings
  updateSetting: adminQuery
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .insert(siteSettings)
        .values({ key: input.key, value: input.value })
        .onDuplicateKeyUpdate({
          set: { value: input.value, updatedAt: new Date() },
        });

      return { success: true };
    }),

  // Get site settings
  getSettings: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(siteSettings);
  }),

  // Send notification to all users
  broadcastNotification: adminQuery
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const allUsers = await db.select({ id: users.id }).from(users);

      for (const user of allUsers) {
        await db.insert(notifications).values({
          userId: user.id,
          type: "system",
          title: input.title,
          content: input.content,
        });
      }

      return { success: true };
    }),
});
