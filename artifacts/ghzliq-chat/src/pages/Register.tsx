import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";

const AVATARS = ["🦁", "🐯", "🦊", "🐺", "🦅", "🦋", "🐉", "🌟", "🔥", "💎", "🌙", "⚡"];

export default function Register() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [selectedAvatar, setSelectedAvatar] = useState("🦁");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLocation("/rooms");
    }, 1400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8" style={{ background: "hsl(234 52% 4%)" }}>
      <StarBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <span className="text-3xl">❤️</span>
              <span className="text-2xl font-bold golden-glow" style={{ color: "hsl(38 92% 50%)" }}>
                غزل عراقي
              </span>
            </div>
          </Link>
          <p className="text-sm mt-2" style={{ color: "hsl(234 20% 58%)" }}>
            أنشئ حسابك مجاناً والتحق بالمجتمع
          </p>
        </div>

        <div
          className="rounded-3xl p-7"
          style={{
            background: "hsl(234 48% 7%)",
            border: "1px solid hsl(234 35% 14%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.05)",
          }}
        >
          <div className="mb-6">
            <p className="text-sm font-medium mb-3" style={{ color: "hsl(45 70% 75%)" }}>
              اختر صورتك 😊
            </p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110"
                  style={{
                    background: selectedAvatar === avatar ? "hsl(38 92% 50% / 0.25)" : "hsl(234 42% 10%)",
                    border: `2px solid ${selectedAvatar === avatar ? "hsl(38 92% 50%)" : "transparent"}`,
                  }}
                  data-testid={`avatar-${avatar}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: "اسم المستخدم", key: "username", type: "text", placeholder: "مثال: أبو علي..." },
              { label: "البريد الإلكتروني (اختياري)", key: "email", type: "email", placeholder: "example@gmail.com" },
              { label: "كلمة المرور", key: "password", type: "password", placeholder: "8 أحرف على الأقل" },
              { label: "تأكيد كلمة المرور", key: "confirm", type: "password", placeholder: "أعد كتابة كلمة المرور" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(45 70% 75%)" }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(form as Record<string, string>)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  required={field.key !== "email"}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{
                    background: "hsl(234 42% 10%)",
                    border: "1px solid hsl(234 35% 18%)",
                    color: "hsl(45 85% 88%)",
                    direction: "rtl",
                  }}
                  data-testid={`input-${field.key}`}
                />
              </div>
            ))}

            {form.password && form.confirm && form.password !== form.confirm && (
              <p className="text-xs" style={{ color: "hsl(0 85% 60%)" }}>
                ❌ كلمتا المرور غير متطابقتين
              </p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all mt-2"
              style={{
                background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))",
                color: "hsl(234 52% 4%)",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}
              data-testid="btn-register"
            >
              {loading ? "⏳ جاري الإنشاء..." : `${selectedAvatar} إنشاء الحساب مجاناً`}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: "hsl(234 20% 55%)" }}>
          عندك حساب؟{" "}
          <Link href="/login">
            <span className="font-semibold cursor-pointer hover:underline" style={{ color: "hsl(38 92% 50%)" }}>
              سجل دخول 🔐
            </span>
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
