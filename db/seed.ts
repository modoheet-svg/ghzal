import { getDb } from "../api/queries/connection";
import { chatRooms, storeItems } from "./schema";

async function seed() {
  console.log("Seeding database...");
  const db = getDb();

  // Seed chat rooms
  const existingRooms = await db.select().from(chatRooms);
  if (existingRooms.length === 0) {
    console.log("Creating default chat rooms...");
    await db.insert(chatRooms).values([
      {
        name: "الـغـرفة الـعـامـة",
        description: "غرفة تضم جميع أعضاء شات عراق المحبة",
        icon: "MessageCircle",
        type: "public",
        order: 1,
      },
      {
        name: "روم المسابقات",
        description: "غرفة تحتوي على أسئلة وأجوبة وجوائز",
        icon: "Trophy",
        type: "public",
        order: 2,
      },
      {
        name: "روم العراق",
        description: "روم العراق في شات عراق المحبة",
        icon: "Flag",
        type: "public",
        order: 3,
      },
      {
        name: "Room للبنات",
        description: "غرفة مخصصة للبنات للتواصل المحترم",
        icon: "Heart",
        type: "public",
        order: 4,
      },
      {
        name: "روم اليمن",
        description: "روم اليمن في شات عراق المحبة",
        icon: "Flag",
        type: "public",
        order: 5,
      },
      {
        name: "روم العامة الثانية",
        description: "غرفة تضم جميع أعضاء شات عراق المحبة",
        icon: "MessageSquare",
        type: "public",
        order: 6,
      },
      {
        name: "غرفة الادارة",
        description: "غرفة اجتماعات الإداريين",
        icon: "Shield",
        type: "admin",
        order: 7,
      },
    ]);
    console.log("Default rooms created!");
  }

  // Seed store items
  const existingItems = await db.select().from(storeItems);
  if (existingItems.length === 0) {
    console.log("Creating default store items...");
    await db.insert(storeItems).values([
      { name: "وسام الملكي", description: "وسام خاص للأعضاء الملكيين", category: "badge", price: 1000, icon: "Crown", color: "gold" },
      { name: "وسام المميز", description: "وسام للأعضاء المميزين", category: "badge", price: 500, icon: "Star", color: "purple" },
      { name: "وسام المحبوب", description: "وسام للأعضاء المحبوبين", category: "badge", price: 300, icon: "Heart", color: "red" },
      { name: "ثيم الليل", description: "ثيم داكن أنيق للدردشة", category: "theme", price: 200, icon: "Moon", color: "slate" },
      { name: "ثيم النهار", description: "ثيم فاتح ومشرق", category: "theme", price: 150, icon: "Sun", color: "yellow" },
      { name: "تأثير النجوم", description: "تأثير نجوم متحركة", category: "effect", price: 400, icon: "Sparkles", color: "blue" },
      { name: "رتبة بريميوم", description: "رتبة مميزة لمدة شهر", category: "rank", price: 2000, icon: "Gem", color: "green" },
    ]);
    console.log("Default store items created!");
  }

  console.log("Done.");
  process.exit(0);
}

seed();
