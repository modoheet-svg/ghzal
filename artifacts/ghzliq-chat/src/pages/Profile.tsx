import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Edit2, MessageCircle, Users, Star, Award, Settings, LogOut } from "lucide-react";
import StarBackground from "@/components/StarBackground";

const BADGES = [
  { icon: "🌟", label: "عضو مميز", color: "hsl(38 92% 50%)" },
  { icon: "💬", label: "كثير الكلام", color: "hsl(200 70% 50%)" },
  { icon: "🏆", label: "محبوب", color: "hsl(280 60% 60%)" },
  { icon: "🔥", label: "نشيط", color: "hsl(0 80% 55%)" },
];

export default function Profile() {
  const [tab, setTab] = useState<"info" | "settings">("info");

  return (
    <div className="min-h-screen" style={{ background: "hsl(234 52% 4%)" }}>
      <StarBackground />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(234 35% 14%)" }}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">❤️</span>
            <span className="text-lg font-bold golden-glow" style={{ color: "hsl(38 92% 50%)" }}>غزل عراقي</span>
          </div>
        </Link>
        <Link href="/rooms">
          <button className="px-4 py-1.5 rounded-full font-medium text-sm glass hover:glass-golden transition-all" style={{ color: "hsl(45 85% 88%)" }} data-testid="nav-rooms">
            💬 الغرف
          </button>
        </Link>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-3xl overflow-hidden" style={{ background: "hsl(234 48% 7%)", border: "1px solid hsl(234 35% 14%)" }}>
            <div
              className="h-28 relative"
              style={{ background: "linear-gradient(135deg, hsl(234 52% 8%), hsl(234 45% 12%), hsl(38 40% 15%))" }}
            >
              <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 50%, hsl(38 92% 50% / 0.3), transparent 60%)" }} />
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="relative">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border-4"
                    style={{ background: "hsl(234 40% 12%)", borderColor: "hsl(234 48% 7%)" }}
                  >
                    🦁
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 flex items-center justify-center" style={{ borderColor: "hsl(234 48% 7%)" }}>
                    <span className="text-xs">✓</span>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all glass hover:glass-golden" style={{ color: "hsl(38 92% 60%)" }} data-testid="btn-edit-profile">
                  <Edit2 size={13} />
                  <span>تعديل</span>
                </button>
              </div>

              <div className="mb-4">
                <h1 className="text-xl font-bold" style={{ color: "hsl(45 85% 88%)" }}>أبو علي العراقي</h1>
                <p className="text-sm mt-0.5" style={{ color: "hsl(234 20% 55%)" }}>@abu_ali_iraq</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 60%)", border: "1px solid hsl(38 92% 50% / 0.3)" }}>
                    👑 مشرف
                  </span>
                  <span className="text-xs" style={{ color: "hsl(234 20% 50%)" }}>عضو منذ يناير 2026</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { icon: <MessageCircle size={18} />, value: "1,240", label: "رسالة" },
                  { icon: <Users size={18} />, value: "23", label: "غرفة دخلها" },
                  { icon: <Star size={18} />, value: "4.8", label: "تقييم" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-3 rounded-2xl" style={{ background: "hsl(234 42% 10%)" }}>
                    <div className="flex justify-center mb-1" style={{ color: "hsl(38 92% 50%)" }}>{stat.icon}</div>
                    <div className="font-bold text-base" style={{ color: "hsl(45 85% 88%)" }}>{stat.value}</div>
                    <div className="text-xs" style={{ color: "hsl(234 20% 55%)" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "hsl(45 70% 75%)" }}>
                  <Award size={15} /> الشارات والإنجازات
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {BADGES.map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "hsl(234 42% 10%)", border: `1px solid ${badge.color}30` }}>
                      <span>{badge.icon}</span>
                      <span className="text-xs font-medium" style={{ color: badge.color }}>{badge.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/rooms" className="flex-1">
                  <button className="w-full py-2.5 rounded-xl font-medium text-sm transition-all" style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))", color: "hsl(234 52% 4%)" }} data-testid="btn-enter-rooms">
                    💬 دخول الغرف
                  </button>
                </Link>
                <button className="px-4 py-2.5 rounded-xl transition-all glass hover:glass-golden" style={{ color: "hsl(234 20% 55%)" }} data-testid="btn-settings">
                  <Settings size={17} />
                </button>
                <Link href="/">
                  <button className="px-4 py-2.5 rounded-xl transition-all" style={{ background: "hsl(0 60% 20%)", color: "hsl(0 80% 65%)" }} data-testid="btn-logout">
                    <LogOut size={17} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
