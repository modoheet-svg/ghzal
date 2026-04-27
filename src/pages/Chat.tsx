import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  RefreshCw,
  Mic,
  Users,
  Bell,
  Settings,
  Send,
  Crown,
  Shield,
  Bot,
  Star,
  User,
  LogOut,
  Home,
  Radio,
  StickyNote,
  UserPlus,
  Gamepad2,
  Store,
  Trophy,
  Gift,
  Sparkles,
  Heart,
  Volume2,
  MessageSquare,
} from "lucide-react";

interface ChatUser {
  id: number;
  name: string | null;
  displayName: string | null;
  rank: string | null;
  avatar: string | null;
  status: string | null;
  mood: string | null;
  isOnline: boolean | null;
}

export default function Chat() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useState(1);
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isGuest, setIsGuest] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get guest info from localStorage
  useEffect(() => {
    const storedGuest = localStorage.getItem("guestName");
    const storedIsGuest = localStorage.getItem("isGuest");
    if (storedGuest) setGuestName(storedGuest);
    if (storedIsGuest === "true") setIsGuest(true);
  }, []);

  // Redirect if not authenticated or guest
  useEffect(() => {
    if (!isAuthenticated && !isGuest && !guestName) {
      navigate("/");
    }
  }, [isAuthenticated, isGuest, guestName, navigate]);

  // tRPC queries
  const { data: rooms } = trpc.chat.getRooms.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery({
    roomId: currentRoomId,
    limit: 100,
  });
  const { data: onlineUsers } = trpc.chat.getOnlineUsers.useQuery({
    roomId: currentRoomId,
  });
  const { data: currentRoom } = trpc.chat.getRoom.useQuery({ id: currentRoomId });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
  });

  const joinRoom = trpc.chat.joinRoom.useMutation({
    onSuccess: () => refetchMessages(),
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join room on mount
  useEffect(() => {
    if (currentRoomId) {
      joinRoom.mutate({
        roomId: currentRoomId,
        guestName: isGuest ? guestName : undefined,
      });
    }
  }, [currentRoomId]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage.mutate({
      roomId: currentRoomId,
      content: message.trim(),
      guestName: isGuest ? guestName : undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRoomChange = (roomId: number) => {
    setCurrentRoomId(roomId);
    setShowRooms(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" dir="rtl">
      {/* Top Bar */}
      <header className="h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            شات عراق المحبة
          </h1>
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300">
            {currentRoom?.name || "الغرفة العامة"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* More Menu */}
          <Sheet open={showRooms} onOpenChange={setShowRooms}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-emerald-950 border-emerald-800">
              <SheetHeader>
                <SheetTitle className="text-white">القائمة</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <button onClick={() => { handleRoomChange(1); setShowRooms(false); }} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <Home className="w-5 h-5" /> الروم الحالية
                </button>
                <button onClick={() => setActiveTab("rooms")} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <MessageSquare className="w-5 h-5" /> قائمة الغرف
                </button>
                <button onClick={() => setActiveTab("store")} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <Store className="w-5 h-5" /> المتجر
                </button>
                <button onClick={() => setActiveTab("games")} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <Gamepad2 className="w-5 h-5" /> ألعاب
                </button>
                <button onClick={() => setActiveTab("wall")} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <StickyNote className="w-5 h-5" /> الجدار
                </button>
                <button onClick={() => navigate("/rules")} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <Shield className="w-5 h-5" /> القوانين
                </button>
                <button onClick={() => navigate("/privacy")} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
                  <Sparkles className="w-5 h-5" /> الخصوصية
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => refetchMessages()}>
            <RefreshCw className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Mic className="w-5 h-5" />
          </Button>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -left-1 w-4 h-4 bg-amber-500 rounded-full text-[10px] flex items-center justify-center">
              {(onlineUsers?.length || 0) + 5}
            </span>
          </Button>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
              2
            </span>
          </Button>

          {/* Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-emerald-900 border-emerald-700">
              <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer" onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 ml-2" /> الملف الشخصي
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                <Gift className="w-4 h-4 ml-2" /> رصيد الكوينزات
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer">
                <Sparkles className="w-4 h-4 ml-2" /> الشعور أو الوضع
              </DropdownMenuItem>
              <DropdownMenuItem className="text-white hover:bg-white/10 cursor-pointer" onClick={() => { localStorage.clear(); navigate("/"); }}>
                <LogOut className="w-4 h-4 ml-2" /> الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Welcome Banner */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
            <p className="text-amber-300 text-sm text-center">
              أهلاً وسهلاً بكم في شات عراق المحبة - أكبر شات عربي - يرجى الالتزام بقوانين وشروط الشات
            </p>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages?.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(msg.guestName || "م").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-amber-400 text-sm">
                        {msg.guestName || "عضو"}
                      </span>
                      <span className="text-emerald-400/60 text-xs">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ar-IQ") : ""}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-3 bg-black/20 border-t border-white/10">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="rtl"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <aside className="w-64 bg-black/20 border-r border-white/10 hidden lg:flex flex-col">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              المتصلون ({(onlineUsers?.length || 0) + 8})
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {/* Owner */}
              <div className="text-xs text-yellow-400 font-semibold px-2 pt-2 pb-1">مالك الدردشة</div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <Crown className="w-4 h-4 text-yellow-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">علي أمير</div>
                  <div className="text-emerald-400/60 text-xs truncate">من له الإرادة له القوة</div>
                </div>
              </div>

              {/* Admins */}
              <div className="text-xs text-red-400 font-semibold px-2 pt-2 pb-1">أدمن</div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <Shield className="w-4 h-4 text-red-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">معقودة</div>
                  <div className="text-emerald-400/60 text-xs truncate">آلحآلي آحلآلي</div>
                </div>
              </div>

              {/* Bots */}
              <div className="text-xs text-cyan-400 font-semibold px-2 pt-2 pb-1">بوت</div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <Bot className="w-4 h-4 text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">صدى الحب</div>
                </div>
              </div>

              {/* Royal */}
              <div className="text-xs text-purple-400 font-semibold px-2 pt-2 pb-1">ملكي</div>
              {onlineUsers?.filter((u: ChatUser) => u.rank === "royal").map((u: ChatUser) => (
                <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{u.displayName || u.name}</div>
                    <div className="text-emerald-400/60 text-xs truncate">{u.status}</div>
                  </div>
                </div>
              ))}

              {/* Premium */}
              <div className="text-xs text-amber-400 font-semibold px-2 pt-2 pb-1">عضويات مميزة</div>
              {onlineUsers?.filter((u: ChatUser) => u.rank === "premium" || !u.rank).map((u: ChatUser) => (
                <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                  <Star className="w-4 h-4 text-amber-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">{u.displayName || u.name || "عضو"}</div>
                    <div className="text-emerald-400/60 text-xs truncate">{u.status || u.mood}</div>
                  </div>
                </div>
              ))}

              {/* Visitors */}
              <div className="text-xs text-gray-400 font-semibold px-2 pt-2 pb-1">زوار</div>
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{guestName || "زائر"}</div>
                  <div className="text-emerald-400/60 text-xs truncate">إنضم للغرفة (# زائر #)</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="h-14 bg-black/30 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2">
        <button onClick={() => setActiveTab("radio")} className="flex flex-col items-center gap-0.5 text-emerald-300 hover:text-white transition p-2">
          <Radio className="w-5 h-5" />
          <span className="text-[10px]">الراديو</span>
        </button>
        <button onClick={() => setActiveTab("wall")} className="flex flex-col items-center gap-0.5 text-emerald-300 hover:text-white transition p-2">
          <StickyNote className="w-5 h-5" />
          <span className="text-[10px]">الجدار</span>
        </button>
        <button onClick={() => navigate("/")} className="flex flex-col items-center gap-0.5 text-emerald-300 hover:text-white transition p-2">
          <UserPlus className="w-5 h-5" />
          <span className="text-[10px]">تسجيل</span>
        </button>
        <button onClick={() => setShowSettings(true)} className="flex flex-col items-center gap-0.5 text-emerald-300 hover:text-white transition p-2">
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">الضبط</span>
        </button>
        <button onClick={() => setShowRooms(true)} className="flex flex-col items-center gap-0.5 text-emerald-300 hover:text-white transition p-2">
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">القائمة</span>
        </button>
      </nav>

      {/* Room Selection Dialog */}
      <Dialog open={activeTab === "rooms"} onOpenChange={() => setActiveTab("chat")}>
        <DialogContent className="bg-emerald-950 border-emerald-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">قائمة الغرف</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {rooms?.map((room) => (
              <button
                key={room.id}
                onClick={() => {
                  handleRoomChange(room.id);
                  setActiveTab("chat");
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                  room.id === currentRoomId
                    ? "bg-amber-500/20 border border-amber-500/40"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">{room.name}</div>
                    <div className="text-emerald-400/60 text-xs">{room.description}</div>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-300">
                  {room.type === "public" ? "عام" : room.type === "private" ? "خاص" : "إدارة"}
                </Badge>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Games Dialog */}
      <Dialog open={activeTab === "games"} onOpenChange={() => setActiveTab("chat")}>
        <DialogContent className="bg-emerald-950 border-emerald-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">ألعاب الشات</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button onClick={() => setActiveTab("chat")} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition flex flex-col items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-amber-400" />
              <span className="text-white text-sm">حجر ورقة مقص</span>
            </button>
            <button onClick={() => setActiveTab("chat")} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition flex flex-col items-center gap-2">
              <Trophy className="w-8 h-8 text-cyan-400" />
              <span className="text-white text-sm">المسابقات</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Store Dialog */}
      <Dialog open={activeTab === "store"} onOpenChange={() => setActiveTab("chat")}>
        <DialogContent className="bg-emerald-950 border-emerald-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              المتجر
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-white text-sm font-medium">وسام الملكي</div>
                  <div className="text-emerald-400/60 text-xs">وسام خاص للأعضاء الملكيين</div>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300">1000 نقطة</Badge>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-white text-sm font-medium">وسام المميز</div>
                  <div className="text-emerald-400/60 text-xs">وسام للأعضاء المميزين</div>
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300">500 نقطة</Badge>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-400" />
                <div>
                  <div className="text-white text-sm font-medium">وسام المحبوب</div>
                  <div className="text-emerald-400/60 text-xs">وسام للأعضاء المحبوبين</div>
                </div>
              </div>
              <Badge className="bg-red-500/20 text-red-300">300 نقطة</Badge>
            </div>
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-white text-sm font-medium">رتبة بريميوم</div>
                  <div className="text-emerald-400/60 text-xs">رتبة مميزة لمدة شهر</div>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-300">2000 نقطة</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wall Dialog */}
      <Dialog open={activeTab === "wall"} onOpenChange={() => setActiveTab("chat")}>
        <DialogContent className="bg-emerald-950 border-emerald-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">جدار الشات</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-amber-400 text-sm font-medium mb-1">إعلان إداري</div>
              <p className="text-white/80 text-sm">آلُآ بْڏگر آلُلُہ تٌطُمئنْ آلُقلُۆبْ</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-cyan-400 text-sm font-medium mb-1">خبر مفرح</div>
              <p className="text-white/80 text-sm">تم افتتاح روم جديد للمسابقات! انضموا الآن</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Radio Dialog */}
      <Dialog open={activeTab === "radio"} onOpenChange={() => setActiveTab("chat")}>
        <DialogContent className="bg-emerald-950 border-emerald-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-400" />
              راديو الشات
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-center py-8">
            <Volume2 className="w-16 h-16 text-red-400 mx-auto mb-4 animate-pulse" />
            <p className="text-white mb-4">راديو عراق المحبة</p>
            <audio controls className="w-full" src="">
              <track kind="captions" />
            </audio>
            <p className="text-emerald-400/60 text-xs mt-3">قريباً - ستتمكن من الاستماع لمحطات الراديو المفضلة</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-emerald-950 border-emerald-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">الإعدادات</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <button onClick={() => { setShowSettings(false); navigate("/profile"); }} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
              <User className="w-5 h-5" /> تعديل الملف الشخصي
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
              <Gift className="w-5 h-5" /> رصيدك من الكوينزات
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
              <Sparkles className="w-5 h-5" /> الشعور أو الوضع
            </button>
            <button onClick={() => { setShowSettings(false); navigate("/rules"); }} className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition">
              <Shield className="w-5 h-5" /> القوانين والشروط
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                setShowSettings(false);
                navigate("/");
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
            >
              <LogOut className="w-5 h-5" /> الخروج من الدردشة
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
