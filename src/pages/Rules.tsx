import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  MessageCircle,
  AlertTriangle,
  Heart,
  Users,
  Volume2,
  Lock,
} from "lucide-react";

export default function Rules() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" dir="rtl">
      {/* Header */}
      <header className="h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => navigate("/chat")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-white mr-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          قوانين وشروط الاستخدام
        </h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Welcome */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">قوانين شات عراق المحبة</h2>
            <p className="text-emerald-200">
              للحفاظ على جو من الود والاحترام، نرجو الالتزام بالقوانين التالية
            </p>
          </CardContent>
        </Card>

        {/* Rules List */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              القوانين العامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Heart, text: "الالتزام بالأدب والاحترام في التعامل مع جميع الأعضاء" },
              { icon: Lock, text: "عدم مشاركة المعلومات الشخصية (أرقام هواتف، عناوين)" },
              { icon: Volume2, text: "عدم استخدام لغة بذيئة أو مسيئة تجاه أي عضو" },
              { icon: Users, text: "عدم التحدث في السياسة أو المواضيع الطائفية" },
              { icon: Shield, text: "عدم انتحال شخصية أي عضو أو إداري" },
              { icon: AlertTriangle, text: "عدم نشر روابط خارجية أو إعلانات" },
              { icon: Heart, text: "احترام قرارات الإدارة وعدم التشهير بأي شخص" },
              { icon: Lock, text: "عدم استخدام أكثر من اسم في نفس الوقت" },
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                <rule.icon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-white/90 text-sm">{rule.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Penalties */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              العقوبات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <h4 className="text-yellow-400 font-semibold text-sm mb-1">الإنذار الأول</h4>
              <p className="text-white/70 text-sm">تنبيه شفهي من الإدارة</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <h4 className="text-orange-400 font-semibold text-sm mb-1">الإنذار الثاني</h4>
              <p className="text-white/70 text-sm">طرد مؤقت من الغرفة لمدة ساعة</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="text-red-400 font-semibold text-sm mb-1">الإنذار الثالث</h4>
              <p className="text-white/70 text-sm">حظر نهائي من الدردشة</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <p className="text-emerald-200 text-sm">
              للإبلاغ عن أي مخالفة أو استفسار، يرجى التواصل مع الإدارة
            </p>
            <Button
              onClick={() => navigate("/contact")}
              className="mt-3 bg-amber-500 hover:bg-amber-600 text-white"
            >
              اتصل بنا
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
