import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  User,
  LogIn,
  Shield,
  FileText,
  Phone,
  Globe,
  Crown,
  Heart,
  Users,
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    email: "",
  });

  const handleGuestLogin = () => {
    if (!guestName.trim()) return;
    localStorage.setItem("guestName", guestName.trim());
    localStorage.setItem("isGuest", "true");
    navigate("/chat");
  };

  const handleLogin = () => {
    // For now, navigate to OAuth
    navigate("/login");
  };

  const handleRegister = () => {
    // Navigate to OAuth registration
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">شات عراق المحبة</h1>
        </div>
        <div className="text-emerald-200 text-sm">2026 &copy;</div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            مرحباً بك في شات عراق المحبة
          </h2>
          <p className="text-emerald-200 text-lg max-w-xl mx-auto leading-relaxed">
            اكتسب المزيد من الأصدقاء الآن من خلال خدمتنا المبتكرة للدردشة.
            تمتع برؤية أحبائك وأصدقائك في أي وقت. نتمنى لك أوقاتٍ سعيدة برفقتنا.
          </p>
        </div>

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* Guest Login */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <User className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <CardTitle className="text-white text-xl">دخول الزوار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="أدخل اسمك"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGuestLogin()}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-right"
                dir="rtl"
              />
              <Button
                onClick={handleGuestLogin}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                دخول كزائر
              </Button>
              <p className="text-emerald-200 text-xs text-center">
                يمكنك الدخول كزائر بدون تسجيل
              </p>
            </CardContent>
          </Card>

          {/* Member Login */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <LogIn className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
              <CardTitle className="text-white text-xl">الدخول بعضوية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="اسم المستخدم"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-right"
                dir="rtl"
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-right"
                dir="rtl"
              />
              <Button
                onClick={handleLogin}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                تسجيل الدخول
              </Button>
              <p className="text-emerald-200 text-xs text-center">
                سجل دخولك بحسابك
              </p>
            </CardContent>
          </Card>

          {/* Register */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="text-center">
              <Crown className="w-12 h-12 text-rose-400 mx-auto mb-2" />
              <CardTitle className="text-white text-xl">تسجيل حساب جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="اسم المستخدم"
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({ ...registerData, username: e.target.value })
                }
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-right"
                dir="rtl"
              />
              <Input
                placeholder="الاسم الظاهر"
                value={registerData.displayName}
                onChange={(e) =>
                  setRegisterData({ ...registerData, displayName: e.target.value })
                }
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-right"
                dir="rtl"
              />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData({ ...registerData, password: e.target.value })
                }
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-right"
                dir="rtl"
              />
              <Button
                onClick={handleRegister}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white"
              >
                تسجيل جديد
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Users className="w-7 h-7 text-amber-400" />
            </div>
            <span className="text-white text-sm">دردشة جماعية</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Heart className="w-7 h-7 text-rose-400" />
            </div>
            <span className="text-white text-sm">تواصل اجتماعي</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Shield className="w-7 h-7 text-cyan-400" />
            </div>
            <span className="text-white text-sm">حماية وأمان</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Crown className="w-7 h-7 text-yellow-400" />
            </div>
            <span className="text-white text-sm">عضويات مميزة</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-4 border-t border-white/10">
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm">
          <button onClick={() => navigate("/")} className="text-emerald-300 hover:text-white transition flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> الرئيسية
          </button>
          <button onClick={() => navigate("/rules")} className="text-emerald-300 hover:text-white transition flex items-center gap-1">
            <FileText className="w-4 h-4" /> شروط الاستخدام
          </button>
          <button onClick={() => navigate("/rules")} className="text-emerald-300 hover:text-white transition flex items-center gap-1">
            <Shield className="w-4 h-4" /> قوانين الموقع
          </button>
          <button onClick={() => navigate("/rules")} className="text-emerald-300 hover:text-white transition flex items-center gap-1">
            <FileText className="w-4 h-4" /> القواعد
          </button>
          <button onClick={() => navigate("/contact")} className="text-emerald-300 hover:text-white transition flex items-center gap-1">
            <Phone className="w-4 h-4" /> اتصل بنا
          </button>
          <button className="text-emerald-300 hover:text-white transition flex items-center gap-1">
            <Globe className="w-4 h-4" /> اللغة
          </button>
        </div>
        <p className="text-center text-emerald-400/60 text-xs mt-3">
          2026 &copy; شات عراق المحبة - جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}
