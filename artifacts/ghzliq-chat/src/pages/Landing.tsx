import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";

const STATS_CONFIG = [
  { label: "متصل الآن", value: 0, suffix: "", icon: "🟢" },
  { label: "غرف دردشة", value: 8, suffix: "", icon: "💬" },
  { label: "مسجل", value: 1240, suffix: "+", icon: "👥" },
];

export default function Landing() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(Math.floor(Math.random() * 40 + 5));
    }, 3000);
    setOnlineCount(Math.floor(Math.random() * 40 + 5));
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "متصل الآن", value: onlineCount, suffix: "", icon: "🟢" },
    { label: "غرف دردشة", value: 8, suffix: "", icon: "💬" },
    { label: "عضو مسجل", value: 1240, suffix: "+", icon: "👥" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "hsl(234 52% 4%)" }}
    >
      <StarBackground />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">❤️</span>
          <span
            className="text-lg font-bold golden-glow"
            style={{ color: "hsl(38 92% 50%)" }}
          >
            غزل عراقي
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm" style={{ color: "hsl(45 85% 88%)" }}>
          <div
            className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full"
          >
            <span className="online-dot inline-block"></span>
            <span className="font-medium">{onlineCount} غرفة</span>
          </div>
          <Link href="/login">
            <button
              className="px-4 py-1.5 rounded-full font-medium transition-all hover:scale-105"
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

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8"
            style={{
              background: "hsl(38 92% 50% / 0.1)",
              border: "1px solid hsl(38 92% 50% / 0.3)",
              color: "hsl(38 92% 60%)",
            }}
          >
            <span>🇮🇶</span>
            <span>الدردشة العراقية الأصيلة</span>
            <span>⚡</span>
            <span>منذ 2026</span>
          </div>

          <h1 className="mb-3 font-bold leading-tight" style={{ color: "hsl(45 85% 88%)" }}>
            <span className="block text-2xl mb-1">أهلاً بك في</span>
            <span
              className="block text-6xl md:text-7xl golden-glow"
              style={{ color: "hsl(38 92% 50%)" }}
            >
              غزل عراقي
            </span>
          </h1>

          <p
            className="text-lg mt-4 mb-8 max-w-md mx-auto"
            style={{ color: "hsl(45 60% 65%)" }}
          >
            تواصل مع أصدقاء جدد، شارك لحظاتك، وعش تجربة دردشة عراقية حقيقية
            <br />
            <span style={{ color: "hsl(45 85% 75%)" }}>✨ بتصميم عصري وأمان تام</span>
          </p>

          <motion.div
            className="flex gap-4 flex-wrap justify-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(245,158,11,0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all"
                style={{
                  background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))",
                  color: "hsl(234 52% 4%)",
                  boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
                }}
                data-testid="btn-register"
              >
                <span>✨</span> سجل مجاناً
              </motion.button>
            </Link>

            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all glass"
                style={{ color: "hsl(45 85% 88%)" }}
                data-testid="btn-login"
              >
                <span>🔐</span> دخول الأعضاء
              </motion.button>
            </Link>

            <Link href="/rooms">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all"
                style={{
                  background: "hsl(38 92% 50% / 0.15)",
                  border: "1px solid hsl(38 92% 50% / 0.4)",
                  color: "hsl(38 92% 60%)",
                }}
                data-testid="btn-guest"
              >
                <span>🚀</span> دخول كزائر
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            className="flex gap-8 justify-center flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center glass px-6 py-3 rounded-2xl"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: "hsl(38 92% 50%)" }}
                >
                  {stat.value.toLocaleString("ar-EG")}
                  {stat.suffix}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "hsl(234 20% 58%)" }}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { icon: "💬", title: "دردشة جماعية", desc: "غرف موضوعية متنوعة" },
            { icon: "😎", title: "إيموجيات حديثة", desc: "مثل واتساب وأكثر" },
            { icon: "🔒", title: "آمان تام", desc: "خصوصيتك محمية" },
            { icon: "📱", title: "متوافق موبايل", desc: "من أي جهاز" },
          ].map((f, i) => (
            <div
              key={i}
              className="glass p-4 rounded-2xl text-center hover:glass-golden transition-all duration-300"
            >
              <div className="text-3xl mb-2">{f.icon}</div>
              <div
                className="font-semibold text-sm"
                style={{ color: "hsl(45 85% 88%)" }}
              >
                {f.title}
              </div>
              <div className="text-xs mt-1" style={{ color: "hsl(234 20% 58%)" }}>
                {f.desc}
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 py-4 text-center">
        <div className="flex items-center justify-center gap-4 flex-wrap text-xs mb-3" style={{ color: "hsl(234 20% 55%)" }}>
          <Link href="/terms">
            <span className="hover:text-amber-400 transition-colors cursor-pointer">اللائحة 🔴</span>
          </Link>
          <span>|</span>
          <Link href="/terms">
            <span className="hover:text-amber-400 transition-colors cursor-pointer">الشروط والأحكام</span>
          </Link>
          <span>|</span>
          <Link href="/terms">
            <span className="hover:text-amber-400 transition-colors cursor-pointer">سياسة الخصوصية</span>
          </Link>
          <span>|</span>
          <Link href="/terms">
            <span className="hover:text-amber-400 transition-colors cursor-pointer">قوانين الاستخدام</span>
          </Link>
        </div>
        <a
          href="https://www.hssiq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs transition-all hover:scale-105"
          style={{
            background: "hsl(234 40% 10%)",
            border: "1px solid hsl(234 35% 18%)",
            color: "hsl(234 20% 58%)",
          }}
        >
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "hsl(38 92% 50%)", color: "hsl(234 52% 4%)" }}
          >
            H
          </span>
          <span style={{ color: "hsl(45 70% 70%)" }}>HSSIQ</span>
          <span>www.hssiq.com</span>
          <span>الهيكل للحلول البرمجية</span>
        </a>
        <p className="text-xs mt-2" style={{ color: "hsl(234 20% 40%)" }}>
          © 2026 غزل عراقي — جميع الحقوق محفوظة 🇮🇶
        </p>
      </footer>
    </div>
  );
}
