import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Crown,
  Star,
  Shield,
  Bot,
  ArrowLeft,
  Save,
  Gift,
  Heart,
  Globe,
  Calendar,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.name || "",
    status: "",
    mood: "",
    about: "",
  });

  const { data: profile } = trpc.user.getProfile.useQuery(
    { id: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => setEditMode(false),
  });

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const rankConfig: Record<string, { color: string; icon: typeof User; label: string }> = {
    visitor: { color: "text-gray-400", icon: User, label: "زائر" },
    member: { color: "text-blue-400", icon: User, label: "عضو" },
    premium: { color: "text-amber-400", icon: Star, label: "بريميوم" },
    royal: { color: "text-purple-400", icon: Crown, label: "ملكي" },
    bot: { color: "text-cyan-400", icon: Bot, label: "بوت" },
    admin: { color: "text-red-400", icon: Shield, label: "أدمن" },
    owner: { color: "text-yellow-400", icon: Crown, label: "مالك" },
  };

  const rank = rankConfig[profile?.rank || "member"];
  const RankIcon = rank?.icon || User;

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
        <h1 className="text-lg font-bold text-white mr-2">الملف الشخصي</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Profile Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
                <span className="text-white text-3xl font-bold">
                  {(profile?.displayName || profile?.name || "م").charAt(0)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {profile?.displayName || profile?.name || "مستخدم"}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <RankIcon className={`w-5 h-5 ${rank?.color}`} />
                <span className={`${rank?.color} text-sm`}>{rank?.label}</span>
              </div>
              <p className="text-emerald-200/60 text-sm mb-4">
                {profile?.status || "لا يوجد وضع"}
              </p>
              <div className="flex gap-2">
                <Badge className="bg-amber-500/20 text-amber-300">
                  <Gift className="w-3 h-3 ml-1" />
                  {profile?.coins || 0} نقطة
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300">
                  <Heart className="w-3 h-3 ml-1" />
                  عضو منذ {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : 2026}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        {editMode ? (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white">تعديل الملف الشخصي</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-emerald-200 text-sm mb-1 block">الاسم الظاهر</label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-emerald-200 text-sm mb-1 block">الحالة</label>
                <Input
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  placeholder="مثال: متصل الآن"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-emerald-200 text-sm mb-1 block">المزاج</label>
                <Input
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  placeholder="مثال: سعيد"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-emerald-200 text-sm mb-1 block">عني</label>
                <Input
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="نبذة عنك..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  dir="rtl"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600">
                  <Save className="w-4 h-4 ml-1" /> حفظ
                </Button>
                <Button variant="ghost" onClick={() => setEditMode(false)} className="text-white hover:bg-white/10">
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">معلوماتي</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(true)}
                className="text-emerald-300 hover:text-white"
              >
                تعديل
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-emerald-200">
                <User className="w-4 h-4 text-emerald-400" />
                <span>الاسم: {profile?.name || "غير محدد"}</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-200">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>البلد: {profile?.country || "غير محدد"}</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-200">
                <Heart className="w-4 h-4 text-emerald-400" />
                <span>المزاج: {profile?.mood || "غير محدد"}</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-200">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>العمر: {profile?.age || "غير محدد"}</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-200">
                <Star className="w-4 h-4 text-emerald-400" />
                <span>الرتبة: {rank?.label || "عضو"}</span>
              </div>
              {profile?.about && (
                <div className="mt-3 p-3 rounded-lg bg-white/5">
                  <p className="text-white/80 text-sm">{profile.about}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
