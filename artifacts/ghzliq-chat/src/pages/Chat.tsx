import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Smile, ArrowRight, Users, Crown, Shield } from "lucide-react";
import EmojiPicker from "@/components/EmojiPicker";

const ROOMS_DATA: Record<string, { name: string; icon: string; online: number }> = {
  "1": { name: "الديوانية العامة", icon: "🏛️", online: 34 },
  "2": { name: "دردشة بغداد", icon: "🌆", online: 21 },
  "3": { name: "الترفيه والضحك", icon: "😂", online: 28 },
  "4": { name: "الرياضة العراقية", icon: "⚽", online: 15 },
  "5": { name: "البصرة تتكلم", icon: "🌊", online: 12 },
  "6": { name: "موسيقى وطرب", icon: "🎵", online: 18 },
  "7": { name: "نقاشات جادة", icon: "💡", online: 9 },
};

const INITIAL_MESSAGES = [
  { id: 1, user: "أبو علي", text: "السلام عليكم يا جماعة 🌟", time: "10:30", own: false, role: "admin" },
  { id: 2, user: "أم حيدر", text: "وعليكم السلام ورحمة الله 💕", time: "10:31", own: false, role: "user" },
  { id: 3, user: "حسين البصري", text: "شلونكم اليوم؟ 😊", time: "10:32", own: false, role: "user" },
  { id: 4, user: "أنت", text: "أهلاً بكم جميعاً! 🎉", time: "10:33", own: true, role: "user" },
  { id: 5, user: "محمد الموصلي", text: "هيه كيف الأحوال؟ 👋", time: "10:35", own: false, role: "user" },
  { id: 6, user: "سارة الكرخي", text: "تسلمون ❤️ يوم جميل على الجميع", time: "10:36", own: false, role: "vip" },
  { id: 7, user: "أبو علي", text: "الله يسلمج يا سارة 🌹", time: "10:37", own: false, role: "admin" },
  { id: 8, user: "حسين البصري", text: "شعلكم بالكرة امس؟ 😂⚽", time: "10:38", own: false, role: "user" },
];

const ONLINE_USERS = [
  { name: "أبو علي", role: "admin", emoji: "👑" },
  { name: "سارة الكرخي", role: "vip", emoji: "⭐" },
  { name: "أم حيدر", role: "user", emoji: "💬" },
  { name: "حسين البصري", role: "user", emoji: "💬" },
  { name: "محمد الموصلي", role: "user", emoji: "💬" },
  { name: "علي النجفي", role: "user", emoji: "💬" },
  { name: "فاطمة", role: "user", emoji: "💬" },
  { name: "زائر_4821", role: "guest", emoji: "👤" },
  { name: "أنت", role: "user", emoji: "🙂" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "hsl(38 92% 50%)",
  vip: "hsl(280 60% 70%)",
  user: "hsl(45 85% 88%)",
  guest: "hsl(234 20% 55%)",
};

export default function Chat() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId ?? "1";
  const room = ROOMS_DATA[roomId] ?? ROOMS_DATA["1"];

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      user: "أنت",
      text: input.trim(),
      time: new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" }),
      own: true,
      role: "user",
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setShowEmoji(false);

    setTimeout(() => {
      const botMessages = [
        "هههه زين قلت 😂",
        "صح والله 💯",
        "أهلاً وسهلاً 🌟",
        "والله عجبتني الفكرة ✨",
        "ما اعرف بس احتمال 🤷",
        "صح صح 👍",
      ];
      const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)];
      const randomUser = ONLINE_USERS.filter((u) => !u.name.includes("أنت"))[Math.floor(Math.random() * 8)];
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          user: randomUser.name,
          text: randomMsg,
          time: new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" }),
          own: false,
          role: randomUser.role,
        },
      ]);
    }, 1200 + Math.random() * 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: "hsl(234 52% 4%)" }}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ background: "hsl(234 50% 5%)", borderColor: "hsl(234 35% 14%)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/rooms">
            <button className="p-2 rounded-xl glass hover:glass-golden transition-all" data-testid="btn-back">
              <ArrowRight size={18} style={{ color: "hsl(38 92% 50%)" }} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{room.icon}</span>
              <h2 className="font-bold text-base" style={{ color: "hsl(45 85% 88%)" }}>
                {room.name}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs" style={{ color: "hsl(234 20% 60%)" }}>
                {room.online} متصل الآن
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUsers(!showUsers)}
            className="p-2 rounded-xl glass hover:glass-golden transition-all"
            data-testid="btn-users"
          >
            <Users size={18} style={{ color: showUsers ? "hsl(38 92% 50%)" : "hsl(45 85% 88%)" }} />
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
            style={{ background: "hsl(234 40% 12%)" }}
          >
            ❤️
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.own ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[75%] ${msg.own ? "items-start" : "items-end"} flex flex-col`}>
                    {!msg.own && (
                      <div className="flex items-center gap-1.5 mb-1 justify-end">
                        <span className="text-xs font-semibold" style={{ color: ROLE_COLORS[msg.role] }}>
                          {msg.user}
                        </span>
                        {msg.role === "admin" && <Crown size={11} style={{ color: "hsl(38 92% 50%)" }} />}
                        {msg.role === "vip" && <Shield size={11} style={{ color: "hsl(280 60% 70%)" }} />}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2.5 text-sm leading-relaxed ${msg.own ? "msg-bubble-own" : "msg-bubble-other"}`}
                      style={{ color: msg.own ? "hsl(234 52% 4%)" : "hsl(45 85% 88%)" }}
                    >
                      {msg.text}
                    </div>
                    <span className="text-xs mt-1 opacity-60" style={{ color: "hsl(234 20% 55%)" }}>
                      {msg.time}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div
            className="p-3 border-t flex-shrink-0 relative"
            style={{ background: "hsl(234 50% 5%)", borderColor: "hsl(234 35% 14%)" }}
          >
            {showEmoji && (
              <EmojiPicker
                onSelect={(emoji) => setInput((prev) => prev + emoji)}
                onClose={() => setShowEmoji(false)}
              />
            )}
            <div
              className="flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{ background: "hsl(234 40% 10%)", border: "1px solid hsl(234 35% 18%)" }}
            >
              <button
                onClick={sendMessage}
                className="p-2 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(38 92% 50%), hsl(38 80% 40%))" }}
                data-testid="btn-send"
              >
                <Send size={16} style={{ color: "hsl(234 52% 4%)" }} />
              </button>
              <input
                type="text"
                placeholder="اكتب رسالتك... 💬"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: "hsl(45 85% 88%)", direction: "rtl" }}
                data-testid="input-message"
              />
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-2 rounded-xl transition-all hover:scale-110 flex-shrink-0"
                style={{ color: showEmoji ? "hsl(38 92% 50%)" : "hsl(234 20% 55%)" }}
                data-testid="btn-emoji"
              >
                <Smile size={20} />
              </button>
              <button
                className="p-2 rounded-xl transition-all hover:scale-110 flex-shrink-0"
                style={{ color: "hsl(234 20% 55%)" }}
                data-testid="btn-image"
              >
                <Image size={20} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showUsers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-r overflow-hidden flex-shrink-0"
              style={{
                background: "hsl(234 50% 5%)",
                borderColor: "hsl(234 35% 14%)",
              }}
            >
              <div className="p-3 border-b" style={{ borderColor: "hsl(234 35% 14%)" }}>
                <p className="text-xs font-semibold" style={{ color: "hsl(234 20% 58%)" }}>
                  المتصلون ({ONLINE_USERS.length})
                </p>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
                {ONLINE_USERS.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: "hsl(234 40% 14%)" }}
                      >
                        {u.emoji}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border border-[hsl(234_50%_5%)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: ROLE_COLORS[u.role] }}>
                        {u.name}
                      </p>
                      <p className="text-xs" style={{ color: "hsl(234 20% 48%)" }}>
                        {u.role === "admin" ? "مشرف" : u.role === "vip" ? "VIP" : u.role === "guest" ? "زائر" : "عضو"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
