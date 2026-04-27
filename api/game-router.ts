import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { gameSessions } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const gameRouter = createRouter({
  // Create game session
  createSession: publicQuery
    .input(
      z.object({
        roomId: z.number(),
        player1Name: z.string(),
        player2Name: z.string().optional(),
        gameType: z.enum(["rps", "trivia"]).default("rps"),
        bet: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id;

      const result = await db.insert(gameSessions).values({
        roomId: input.roomId,
        player1Id: userId ?? 0,
        player1Name: input.player1Name,
        player2Name: input.player2Name ?? null,
        gameType: input.gameType,
        bet: input.bet,
        status: "waiting",
      });

      return result;
    }),

  // Join game
  joinGame: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        player2Name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user?.id;

      await db
        .update(gameSessions)
        .set({
          player2Id: userId ?? null,
          player2Name: input.player2Name,
          status: "playing",
        })
        .where(eq(gameSessions.id, input.sessionId));

      return { success: true };
    }),

  // Make move (Rock Paper Scissors)
  makeMove: publicQuery
    .input(
      z.object({
        sessionId: z.number(),
        choice: z.enum(["rock", "paper", "scissors"]),
        playerNumber: z.number().min(1).max(2),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const updateData =
        input.playerNumber === 1
          ? { player1Choice: input.choice }
          : { player2Choice: input.choice };

      await db
        .update(gameSessions)
        .set(updateData)
        .where(eq(gameSessions.id, input.sessionId));

      // Check if both players made their choice
      const updated = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (updated?.player1Choice && updated?.player2Choice) {
        // Determine winner
        const winner = determineRpsWinner(
          updated.player1Choice,
          updated.player2Choice
        );

        await db
          .update(gameSessions)
          .set({
            winnerId: winner === 1 ? updated.player1Id : winner === 2 ? updated.player2Id : null,
            status: "finished",
          })
          .where(eq(gameSessions.id, input.sessionId));
      }

      return { success: true };
    }),

  // Get active games for room
  getActiveGames: publicQuery
    .input(z.object({ roomId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(gameSessions)
        .where(
          and(
            eq(gameSessions.roomId, input.roomId),
            eq(gameSessions.status, "waiting")
          )
        );
    }),

  // Get game result
  getGameResult: publicQuery
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });
    }),
});

function determineRpsWinner(p1: string, p2: string): number {
  if (p1 === p2) return 0; // Draw
  if (
    (p1 === "rock" && p2 === "scissors") ||
    (p1 === "paper" && p2 === "rock") ||
    (p1 === "scissors" && p2 === "paper")
  ) {
    return 1;
  }
  return 2;
}
