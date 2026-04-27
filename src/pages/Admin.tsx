import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Shield,
  Users,
  MessageSquare,
  Crown,
  TrendingUp,
  Trash2,
  Ban,
  Settings,
  Bell,
} from "lucide-react";
import { useEffect } from "react";

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Redirect non-admin users
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (user?.role !== "admin") {
      navigate("/chat");
    }
  }, [isAuthenticated, user, navigate]);

  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  const { data: usersList } = trpc.admin.getUsers.useQuery(
    { page: 1, limit: 50 },
    { enabled: user?.role === "admin" }
  );
  const { data: roomsList } = trpc.chat.getRooms.useQuery();

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      {/* Header */}
      <header className="h-14 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center px-4">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate("/chat")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-white mr-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          لوحة التحكم
        </h1>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                <div className="text-emerald-200/60 text-sm">إجمالي المستخدمين</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.onlineUsers || 0}</div>
                <div className="text-emerald-200/60 text-sm">المتصلون الآن</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.totalMessages || 0}</div>
                <div className="text-emerald-200/60 text-sm">إجمالي الرسائل</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats?.totalRooms || 0}</div>
                <div className="text-emerald-200/60 text-sm">عدد الغرف</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-amber-500">
              <Users className="w-4 h-4 ml-1" /> المستخدمين
            </TabsTrigger>
            <TabsTrigger value="rooms" className="text-white data-[state=active]:bg-amber-500">
              <MessageSquare className="w-4 h-4 ml-1" /> الغرف
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-amber-500">
              <Settings className="w-4 h-4 ml-1" /> الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">قائمة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {usersList?.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{(u.name || "م").charAt(0)}</span>
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{u.displayName || u.name}</div>
                            <div className="text-emerald-400/60 text-xs">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            u.rank === "owner" ? "bg-yellow-500/20 text-yellow-300" :
                            u.rank === "admin" ? "bg-red-500/20 text-red-300" :
                            u.rank === "premium" ? "bg-amber-500/20 text-amber-300" :
                            "bg-blue-500/20 text-blue-300"
                          }`}>
                            {u.rank}
                          </Badge>
                          <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 h-8 w-8">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rooms">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">إدارة الغرف</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roomsList?.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="text-white text-sm font-medium">{room.name}</div>
                          <div className="text-emerald-400/60 text-xs">{room.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={room.isActive ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-300"}>
                          {room.isActive ? "نشط" : "معطل"}
                        </Badge>
                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 h-8 w-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">إعدادات الموقع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5">
                  <h4 className="text-white font-medium mb-2">إرسال إعلان</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="نص الإعلان"
                      className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                    />
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      <Bell className="w-4 h-4 ml-1" /> إرسال
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-white/5">
                  <h4 className="text-white font-medium mb-2">إعدادات عامة</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-200 text-sm">تفعيل التسجيل</span>
                      <Badge className="bg-green-500/20 text-green-300">مفعل</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-200 text-sm">الدردشة للزوار</span>
                      <Badge className="bg-green-500/20 text-green-300">مفعل</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-200 text-sm">نظام الكوينزات</span>
                      <Badge className="bg-green-500/20 text-green-300">مفعل</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
