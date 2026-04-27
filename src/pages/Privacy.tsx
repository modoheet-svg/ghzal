import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2 } from "lucide-react";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" dir="rtl">
      <header className="h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center px-4">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/chat")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-white mr-2">سياسة الخصوصية</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">سياسة الخصوصية</h2>
            <p className="text-emerald-200">نحن نهتم بخصوصيتك ونحمي بياناتك الشخصية</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              البيانات التي نجمعها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-emerald-200 text-sm">
            <p>نقوم بجمع المعلومات التالية لتقديم خدمة أفضل:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>اسم المستخدم والبريد الإلكتروني (عند التسجيل)</li>
              <li>الرسائل المرسلة في الغرف العامة</li>
              <li>وقت الدخول والخروج من الدردشة</li>
              <li>عنوان IP للحماية من الاختراق والمخالفات</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              كيف نستخدم بياناتك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-emerald-200 text-sm">
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تحسين تجربة المستخدم في الدردشة</li>
              <li>الحفاظ على الأمن وحظر المخالفين</li>
              <li>إرسال إشعارات مهمة فقط</li>
              <li>لن نقوم بمشاركة بياناتك مع أي طرف ثالث</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              أمان البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="text-emerald-200 text-sm">
            <p>نستخدم تقنيات التشفير الحديثة لحماية بياناتك. يتم تخزين كلمات المرور بشكل مشفر ولا يمكن لأحد الوصول إليها.</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              حذف الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-emerald-200 text-sm">
              يمكنك طلب حذف حسابك وبياناتك في أي وقت. سيتم حذف جميع بياناتك خلال 30 يوماً من تاريخ الطلب.
            </p>
            <Button variant="destructive" onClick={() => alert("سيتم توجيهك لصفقة حذف الحساب")}>
              طلب حذف الحساب
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
