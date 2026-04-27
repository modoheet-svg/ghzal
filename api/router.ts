import { authRouter } from "./auth-router";
import { chatRouter } from "./chat-router";
import { userRouter } from "./user-router";
import { friendRouter } from "./friend-router";
import { storeRouter } from "./store-router";
import { gameRouter } from "./game-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  chat: chatRouter,
  user: userRouter,
  friend: friendRouter,
  store: storeRouter,
  game: gameRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
