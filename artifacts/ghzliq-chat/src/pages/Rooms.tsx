import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Lock, Users, ArrowRight, MessageCircle } from "lucide-react";
import StarBackground from "@/components/StarBackground";

const ROOMS = [
  { id: "1", name: "الديوانية العامة", desc: "للجميع، تحدث عن أي شيء", online: 34, category: "عام", icon: "🏛️", locked: false },
  { id: "2", name: "دردشة بغداد", desc: "لأهل العاصمة والقريب منها", online: 21, category: "عام", icon: "🌆", locked: false },
  { id: "3", name: "الترفيه والضحك", desc: "نكت، طرائف، وإشياء تضحك", online: 28, category: "ترفيه", icon: "😂", locked: false },
  { id: "4", name: "الرياضة العراقية", desc: "كرة قدم، رياضات، وكل شيء رياضي", online: 15, category: "رياضة", icon: "⚽", locked: false },
  { id: "5", name: "البصرة تتكلم", desc: "خاصة بأهل البصرة والجنوب", online: 12, category: "عام", icon: "🌊", locked: false },
  { id: "6", name: "موسيقى وطرب", desc: "أغاني، موسيقى، وفنانين", online: 18, category: "ترفيه", icon: "🎵", locked: false },
  { id: "7", name: "نقاشات جادة", desc: "سياسة، اقتصاد، ومواضيع مهمة", online: 9, category: "نقاشات", icon: "💡", locked: false },
  { id: "8", name: "غرفة VIP ⭐", desc: "للأعضاء المميزين فقط", online: 5, category: "عام", icon: "👑", locked: true },
];

const CATEGORIES = ["الكل", "عام", "ترفيه", "رياضة", "نقاشات"];

export default function Rooms() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filtered = ROOMS.filter((r) => {
    const matchSearch = r.name.includes(search) || r.desc.includes(search);
    const matchCat = activeCategory === "الكل" || r.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(234 52% 4%)" }}>
      <StarBackground />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(234 35% 14%)" }}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">❤️</span>
            <span className="text-lg font-bold golden-glow" style={{ color: "hsl(38 92% 50%)" }}>
              غزل عراقي
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <button className="w-9 h-9 rounded-full flex items-center justify-center glass hover:glass-golden transition-all" data-testid="nav-profile">
              <span className="text-lg">👤</span>
            </button>
          </Link>
          <Link href="/login">
            <button
              className="px-4 py-1.5 rounded-full font-medium text-sm transition-all hover:scale-105"
              style={{
                background: "hsl(38 92% 50% / 0.15)",
                border: "1px solid hsl(38 92% 50% / 0.4)",
                color: "hsl(38 92% 50%)",
              }}
              data-testid="nav-login"
            >
              دخول الأعضاء
            </button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-1" style={{ color: "hsl(38 92% 50%)" }}>
            غرف الدردشة 💬
          </h1>
          <p className="text-sm" style={{ color: "hsl(234 20% 58%)" }}>
            اختر الغرفة المناسبة وابدأ الدردشة الآن
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="ابحث عن غرفة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl outline-none text-sm"
              style={{
                background: "hsl(234 40% 10%)",
                border: "1px solid hsl(234 35% 18%)",
                color: "hsl(45 85% 88%)",
                direction: "rtl",
              }}
              data-testid="search-rooms"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: activeCategory === cat ? "hsl(38 92% 50%)" : "hsl(234 40% 10%)",
                  color: activeCategory === cat ? "hsl(234 52% 4%)" : "hsl(45 70% 75%)",
                  border: `1px solid ${activeCategory === cat ? "hsl(38 92% 50%)" : "hsl(234 35% 18%)"}`,
                }}
                data-testid={`cat-${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={room.locked ? "#" : `/chat/${room.id}`}>
                <div
                  className="p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    background: "hsl(234 48% 7%)",
                    border: "1px solid hsl(234 35% 14%)",
                  }}
                  data-testid={`room-card-${room.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: "hsl(234 40% 12%)" }}
                      >
                        {room.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base" style={{ color: "hsl(45 85% 88%)" }}>
                            {room.name}
                          </h3>
                          {room.locked && <Lock size={13} style={{ color: "hsl(38 92% 50%)" }} />}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(234 20% 55%)" }}>
                          {room.desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.7)" }} />
                        <span className="text-sm font-bold" style={{ color: "hsl(38 92% 60%)" }}>
                          {room.online}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(234 40% 14%)", color: "hsl(234 20% 60%)" }}>
                        {room.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1" style={{ color: "hsl(234 20% 50%)" }}>
                      <Users size={13} />
                      <span className="text-xs">{room.online} متصل</span>
                    </div>
                    <div
                      className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "hsl(38 92% 50%)" }}
                    >
                      {room.locked ? (
                        <>
                          <Lock size={13} />
                          <span>للأعضاء فقط</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle size={13} />
                          <span>ادخل الغرفة</span>
                          <ArrowRight size={12} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p style={{ color: "hsl(234 20% 55%)" }}>لم يتم العثور على غرف مطابقة</p>
          </div>
        )}
      </main>
    </div>
  );
}
