import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone, Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900" dir="rtl">
      <header className="h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center px-4">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/chat")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-white mr-2">اتصل بنا</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white mb-2">تواصل معنا</h2>
            <p className="text-emerald-200">نحن هنا لمساعدتك. لا تتردد في التواصل معنا</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">معلومات التواصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-200">
              <Mail className="w-5 h-5 text-amber-400" />
              <span>support@iraqlove.chat</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-200">
              <Phone className="w-5 h-5 text-amber-400" />
              <span>+964-XXX-XXXX-XXX</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">أرسل رسالة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="الاسم"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              dir="rtl"
            />
            <Input
              placeholder="البريد الإلكتروني"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              dir="rtl"
            />
            <Input
              placeholder="رسالتك"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
              dir="rtl"
            />
            <Button className="bg-amber-500 hover:bg-amber-600 text-white w-full">
              <Send className="w-4 h-4 ml-1" /> إرسال
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
