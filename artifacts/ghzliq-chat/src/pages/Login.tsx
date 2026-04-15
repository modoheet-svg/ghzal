import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";

export default function Login() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLocation("/rooms");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" style={{ background: "hsl(234 52% 4%)" }}>
      <StarBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <span className="text-3xl">❤️</span>
              <span className="text-2xl font-bold golden-glow" style={{ color: "hsl(38 92% 50%)" }}>
                غزل عراقي
              </span>
            </div>
          </Link>
          <p className="text-sm mt-2" style={{ color: "hsl(234 20% 58%)" }}>
            سجل دخولك للوصول إلى غرف الدردشة
          </p>
        </div>

        <div
          className="rounded-3xl p-8"
          style={{
            background: "hsl(234 48% 7%)",
            border: "1px solid hsl(234 35% 14%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.05)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "hsl(45 70% 75%)" }}>
                اسم المستخدم
              </label>
              <input
                type="text"
                placeholder="أدخل اسم المستخدم..."
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all"
                style={{
                  background: "hsl(234 42% 10%)",
                  border: "1px solid hsl(234 35% 18%)",
                  color: "hsl(45 85% 88%)",
                  direction: "rtl",
                }}
                data-testid="input-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "hsl(45 70% 75%)" }}>
                كلمة المرور
              </label>
              <input
                type="password"
                placeholder="أدخل كلمة المرور..."
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={{
                  background: "hsl(234 42% 10%)",
                  border: "1px solid hsl(234 35% 18%)",
                  color: "hsl(45 85% 88%)",
                  direction: "rtl",
                }}
                data-testid="input-password"
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))",
                color: "hsl(234 52% 4%)",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                opacity: loading ? 0.8 : 1,
              }}
              data-testid="btn-login"
            >
              {loading ? "⏳ جاري الدخول..." : "🔐 تسجيل الدخول"}
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: "hsl(234 35% 16%)" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3" style={{ background: "hsl(234 48% 7%)", color: "hsl(234 20% 55%)" }}>
                  أو
                </span>
              </div>
            </div>

            <Link href="/rooms">
              <button
                type="button"
                className="w-full py-3 rounded-xl font-medium text-sm transition-all glass hover:glass-golden"
                style={{ color: "hsl(45 85% 88%)" }}
                data-testid="btn-guest"
              >
                🚀 دخول كزائر بدون تسجيل
              </button>
            </Link>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "hsl(234 20% 55%)" }}>
          ما عندك حساب؟{" "}
          <Link href="/register">
            <span className="font-semibold cursor-pointer hover:underline" style={{ color: "hsl(38 92% 50%)" }}>
              سجل الآن مجاناً ✨
            </span>
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
