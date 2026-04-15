import { Link } from "wouter";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" style={{ background: "hsl(234 52% 4%)" }}>
      <StarBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="relative z-10 text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-8xl mb-6"
        >
          🌌
        </motion.div>
        <h1 className="text-6xl font-black mb-2 golden-glow" style={{ color: "hsl(38 92% 50%)" }}>
          404
        </h1>
        <h2 className="text-2xl font-bold mb-3" style={{ color: "hsl(45 85% 88%)" }}>
          الصفحة مو موجودة! 😢
        </h2>
        <p className="text-base mb-8" style={{ color: "hsl(234 20% 58%)" }}>
          الصفحة اللي تدور عليها ما اكو، ربما انحذفت أو الرابط غلط
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-xl font-bold"
              style={{
                background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))",
                color: "hsl(234 52% 4%)",
                boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
              }}
              data-testid="btn-home"
            >
              🏠 الرئيسية
            </motion.button>
          </Link>
          <Link href="/rooms">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-xl font-bold glass"
              style={{ color: "hsl(45 85% 88%)" }}
              data-testid="btn-rooms"
            >
              💬 الغرف
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
