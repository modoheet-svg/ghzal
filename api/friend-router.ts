import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { friends, blocks, notifications } from "@db/schema";
import { eq, and, or } from "drizzle-orm";

export const friendRouter = createRouter({
  // Send friend request
  sendRequest: authedQuery
    .input(z.object({ addresseeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const requesterId = ctx.user.id;

      // Check if already friends
      const existing = await db.query.friends.findFirst({
        where: and(
          eq(friends.requesterId, requesterId),
          eq(friends.addresseeId, input.addresseeId)
        ),
      });

      if (existing) return { success: false, message: "Already sent" };

      await db.insert(friends).values({
        requesterId,
        addresseeId: input.addresseeId,
        status: "pending",
      });

      // Create notification
      await db.insert(notifications).values({
        userId: input.addresseeId,
        type: "friend_request",
        title: "طلب صداقة جديد",
        content: `${ctx.user.name} أرسل لك طلب صداقة`,
      });

      return { success: true };
    }),

  // Accept friend request
  acceptRequest: authedQuery
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(friends)
        .set({ status: "accepted" })
        .where(eq(friends.id, input.requestId));

      return { success: true };
    }),

  // Reject friend request
  rejectRequest: authedQuery
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(friends)
        .set({ status: "rejected" })
        .where(eq(friends.id, input.requestId));

      return { success: true };
    }),

  // Get friends list
  getFriends: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const result = await db
      .select()
      .from(friends)
      .where(
        and(
          or(
            eq(friends.requesterId, ctx.user.id),
            eq(friends.addresseeId, ctx.user.id)
          ),
          eq(friends.status, "accepted")
        )
      );

    return result;
  }),

  // Get pending requests
  getPendingRequests: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.addresseeId, ctx.user.id),
          eq(friends.status, "pending")
        )
      );
  }),

  // Block user
  blockUser: authedQuery
    .input(z.object({ blockedId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.insert(blocks).values({
        blockerId: ctx.user.id,
        blockedId: input.blockedId,
      });

      return { success: true };
    }),

  // Unblock user
  unblockUser: authedQuery
    .input(z.object({ blockedId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(blocks)
        .where(
          and(
            eq(blocks.blockerId, ctx.user.id),
            eq(blocks.blockedId, input.blockedId)
          )
        );

      return { success: true };
    }),

  // Get blocked users
  getBlockedUsers: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(blocks)
      .where(eq(blocks.blockerId, ctx.user.id));
  }),
});
