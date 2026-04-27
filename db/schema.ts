import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  int,
  boolean,
} from "drizzle-orm/mysql-core";

// ====== USERS ======
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Chat-specific fields
  displayName: varchar("displayName", { length: 100 }),
  username: varchar("username", { length: 50 }).unique(),
  status: varchar("status", { length: 255 }),
  mood: varchar("mood", { length: 100 }),
  gender: mysqlEnum("gender", ["male", "female", "unknown"]).default("unknown"),
  country: varchar("country", { length: 50 }),
  age: int("age"),
  about: text("about"),
  isOnline: boolean("isOnline").default(false),
  lastActive: timestamp("lastActive").defaultNow(),
  // Rank system: visitor, member, premium, royal, bot, admin, owner
  rank: mysqlEnum("rank", ["visitor", "member", "premium", "royal", "bot", "admin", "owner"]).default("visitor"),
  coins: int("coins").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ====== CHAT ROOMS ======
export const chatRooms = mysqlTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  type: mysqlEnum("type", ["public", "private", "admin"]).default("public"),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = typeof chatRooms.$inferInsert;

// ====== CHAT MESSAGES ======
export const chatMessages = mysqlTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: bigint("roomId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  guestName: varchar("guestName", { length: 50 }),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["text", "system", "private", "game", "announcement"]).default("text"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ====== USER ROOM PRESENCE ======
export const userRoomPresence = mysqlTable("user_room_presence", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }),
  guestName: varchar("guestName", { length: 50 }),
  roomId: bigint("roomId", { mode: "number", unsigned: true }).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type UserRoomPresence = typeof userRoomPresence.$inferSelect;

// ====== FRIENDS ======
export const friends = mysqlTable("friends", {
  id: serial("id").primaryKey(),
  requesterId: bigint("requesterId", { mode: "number", unsigned: true }).notNull(),
  addresseeId: bigint("addresseeId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Friend = typeof friends.$inferSelect;

// ====== BLOCKS ======
export const blocks = mysqlTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: bigint("blockerId", { mode: "number", unsigned: true }).notNull(),
  blockedId: bigint("blockedId", { mode: "number", unsigned: true }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Block = typeof blocks.$inferSelect;

// ====== NOTIFICATIONS ======
export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  type: mysqlEnum("type", ["friend_request", "message", "mention", "system", "game"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ====== COIN TRANSACTIONS ======
export const coinTransactions = mysqlTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["earn", "spend", "gift", "purchase"]).notNull(),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoinTransaction = typeof coinTransactions.$inferSelect;

// ====== STORE ITEMS ======
export const storeItems = mysqlTable("store_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["badge", "theme", "effect", "rank", "other"]).notNull(),
  price: int("price").notNull(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StoreItem = typeof storeItems.$inferSelect;

// ====== USER INVENTORY ======
export const userInventory = mysqlTable("user_inventory", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  itemId: bigint("itemId", { mode: "number", unsigned: true }).notNull(),
  isEquipped: boolean("isEquipped").default(false),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type UserInventory = typeof userInventory.$inferSelect;

// ====== WALL POSTS ======
export const wallPosts = mysqlTable("wall_posts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  content: text("content").notNull(),
  likes: int("likes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WallPost = typeof wallPosts.$inferSelect;

// ====== SITE SETTINGS ======
export const siteSettings = mysqlTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ====== GAME SESSIONS ======
export const gameSessions = mysqlTable("game_sessions", {
  id: serial("id").primaryKey(),
  roomId: bigint("roomId", { mode: "number", unsigned: true }).notNull(),
  player1Id: bigint("player1Id", { mode: "number", unsigned: true }).notNull(),
  player2Id: bigint("player2Id", { mode: "number", unsigned: true }),
  player1Name: varchar("player1Name", { length: 50 }),
  player2Name: varchar("player2Name", { length: 50 }),
  gameType: mysqlEnum("gameType", ["rps", "trivia"]).default("rps"),
  player1Choice: varchar("player1Choice", { length: 20 }),
  player2Choice: varchar("player2Choice", { length: 20 }),
  winnerId: bigint("winnerId", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["waiting", "playing", "finished"]).default("waiting"),
  bet: int("bet").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameSession = typeof gameSessions.$inferSelect;

// ====== PRIVATE MESSAGES ======
export const privateMessages = mysqlTable("private_messages", {
  id: serial("id").primaryKey(),
  senderId: bigint("senderId", { mode: "number", unsigned: true }).notNull(),
  receiverId: bigint("receiverId", { mode: "number", unsigned: true }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PrivateMessage = typeof privateMessages.$inferSelect;

// TODO: Add your tables here. See docs/Database.md for schema examples and patterns.
//
// Example:
// export const posts = mysqlTable("posts", {
//   id: serial("id").primaryKey(),
//   title: varchar("title", { length: 255 }).notNull(),
//   content: text("content"),
//   createdAt: timestamp("created_at").notNull().defaultNow(),
// });
//
// Note: FK columns referencing a serial() PK must use:
//   bigint("columnName", { mode: "number", unsigned: true }).notNull()
