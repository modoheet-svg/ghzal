import { Link } from "wouter";
import { motion } from "framer-motion";
import StarBackground from "@/components/StarBackground";

export default function Terms() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(234 52% 4%)" }}>
      <StarBackground />
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(234 35% 14%)" }}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">❤️</span>
            <span className="text-lg font-bold golden-glow" style={{ color: "hsl(38 92% 50%)" }}>غزل عراقي</span>
          </div>
        </Link>
        <Link href="/">
          <button className="px-4 py-1.5 rounded-full font-medium text-sm glass hover:glass-golden transition-all" style={{ color: "hsl(45 85% 88%)" }}>
            ← الرئيسية
          </button>
        </Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2" style={{ color: "hsl(38 92% 50%)" }}>الشروط والأحكام</h1>
          <p className="text-sm mb-8" style={{ color: "hsl(234 20% 55%)" }}>آخر تحديث: يناير 2026</p>

          <div className="space-y-6">
            {[
              { title: "1. قوانين الاستخدام", content: "يُمنع منعاً باتاً نشر أي محتوى مسيء، طائفي، عنصري، أو يتعارض مع القوانين والآداب العامة. يجب على جميع المستخدمين احترام بعضهم والحفاظ على جو ودي وإيجابي في جميع الغرف." },
              { title: "2. سياسة الخصوصية", content: "نحن نحترم خصوصيتك. لا يتم مشاركة معلوماتك الشخصية مع أي طرف ثالث. يتم تشفير كلمات المرور وحماية البيانات وفق أحدث معايير الأمان الرقمي." },
              { title: "3. المحتوى المحظور", content: "يُحظر نشر: المحتوى الإباحي أو الجنسي، الإعلانات التجارية غير المرخصة، الروابط الضارة أو المشبوهة، التحرش والإزعاج المتعمد للآخرين، والمحتوى الذي ينتهك حقوق الملكية الفكرية." },
              { title: "4. صلاحيات المشرفين", content: "للمشرفين الحق في حظر أو طرد أي مستخدم يخالف القوانين. قراراتهم نهائية ولا يمكن الطعن فيها. تواصل معنا إذا كنت تعتقد أنك طُرِدت ظلماً." },
              { title: "5. الغرف والمحادثات", content: "جميع المحادثات في الغرف العامة قابلة للمشاهدة من قِبل المشرفين. الرسائل الخاصة محمية ولا يطلع عليها إلا أطرافها. نحتفظ بالحق في حذف أي محتوى مخالف." },
              { title: "6. إخلاء المسؤولية", content: "غزل عراقي منصة للتواصل الاجتماعي ولا تتحمل مسؤولية المحتوى الذي ينشره المستخدمون. كل مستخدم مسؤول عن محتواه ومواقفه بشكل كامل." },
            ].map((section, i) => (
              <div key={i} className="p-5 rounded-2xl" style={{ background: "hsl(234 48% 7%)", border: "1px solid hsl(234 35% 14%)" }}>
                <h2 className="text-base font-bold mb-2" style={{ color: "hsl(38 92% 50%)" }}>{section.title}</h2>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(45 70% 75%)" }}>{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 rounded-2xl text-center" style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.2)" }}>
            <p className="text-sm" style={{ color: "hsl(45 80% 80%)" }}>
              للتواصل مع الإدارة أو الإبلاغ عن مخالفة، راسلنا عبر{" "}
              <a href="https://www.hssiq.com" style={{ color: "hsl(38 92% 50%)" }}>www.hssiq.com</a>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
