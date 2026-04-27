import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { chatMessages, chatRooms, userRoomPresence, users } from "@db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";

export const chatRouter = createRouter({
  // Get messages for a room
  getMessages: publicQuery
    .input(z.object({ roomId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const db = getDb();
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.roomId, input.roomId))
        .orderBy(desc(chatMessages.createdAt))
        .limit(input.limit);
      return messages.reverse();
    }),

  // Send a message
  sendMessage: publicQuery
    .input(
      z.object({
        roomId: z.number(),
        content: z.string().min(1).max(1000),
        guestName: z.string().optional(),
        type: z.enum(["text", "system", "private", "game", "announcement"]).default("text"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id;

      const result = await db.insert(chatMessages).values({
        roomId: input.roomId,
        userId: userId ?? null,
        guestName: input.guestName ?? null,
        content: input.content,
        type: input.type,
      });

      return result;
    }),

  // Get online users for a room
  getOnlineUsers: publicQuery
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const presence = await db
        .select()
        .from(userRoomPresence)
        .where(eq(userRoomPresence.roomId, input.roomId));

      const userIds = presence
        .filter((p): p is typeof p & { userId: number } => p.userId !== null)
        .map((p) => p.userId);

      const guestUsers = presence
        .filter((p) => p.guestName !== null)
        .map((p) => ({
          id: 0,
          name: p.guestName,
          displayName: p.guestName,
          rank: "visitor" as const,
          avatar: null,
          status: null,
          mood: null,
          isOnline: true,
        }));

      if (userIds.length === 0) return guestUsers;

      const onlineUsers = await db
        .select({
          id: users.id,
          name: users.name,
          displayName: users.displayName,
          rank: users.rank,
          avatar: users.avatar,
          status: users.status,
          mood: users.mood,
          isOnline: users.isOnline,
        })
        .from(users)
        .where(inArray(users.id, userIds));

      return [...onlineUsers, ...guestUsers];
    }),

  // Join room
  joinRoom: publicQuery
    .input(
      z.object({
        roomId: z.number(),
        guestName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id;

      // Remove old presence for user
      if (userId) {
        await db.delete(userRoomPresence).where(eq(userRoomPresence.userId, userId));
      }

      // Add new presence
      await db.insert(userRoomPresence).values({
        userId: userId ?? null,
        guestName: input.guestName ?? null,
        roomId: input.roomId,
      });

      return { success: true };
    }),

  // Leave room
  leaveRoom: publicQuery
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id;

      if (userId) {
        await db
          .delete(userRoomPresence)
          .where(
            and(
              eq(userRoomPresence.userId, userId),
              eq(userRoomPresence.roomId, input.roomId)
            )
          );
      }

      return { success: true };
    }),

  // Get all rooms
  getRooms: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(chatRooms).orderBy(asc(chatRooms.order));
  }),

  // Get room by id
  getRoom: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.chatRooms.findFirst({
        where: eq(chatRooms.id, input.id),
      });
    }),
});
