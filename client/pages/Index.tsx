import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Code2,
  Globe2,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Workflow,
} from "lucide-react";

const pathways = {
  israel: {
    title: "עסק שמוכר בישראל",
    subtitle: "Checkout בעברית, חוויית תשלום מקומית, חשבוניות ופעילות עסקית במקום אחד.",
    items: ["תשלום מאובטח באתר או בקישור", "ניהול זיכויים והחזרים", "דוחות ומעקב Settlement"],
  },
  global: {
    title: "עסק שמוכר גלובלית",
    subtitle: "תשתית אחת למטבעות, שווקים, Webhooks ותפעול עסקי רב־אזורי.",
    items: ["Checkout מותאם לשוק ולמטבע", "כלי Risk ו־3DS לפי מדיניות", "ממשק API ו־SDK לצוותי פיתוח"],
  },
  saas: {
    title: "SaaS ומנויים",
    subtitle: "ניהול תשלומים חוזרים, ניסיון חיוב, Dunning ותובנות על הכנסות.",
    items: ["חיובים מחזוריים", "אמצעי תשלום שמורים בטוקנים", "מעקב אחרי כשלי חידוש"],
  },
};

export default function Index() {
  const [pathway, setPathway] = useState<keyof typeof pathways>("global");
  const selected = pathways[pathway];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />

      <main>
        <section className="relative overflow-hidden bg-slate-950 px-4 pb-20 pt-32 text-white sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(50,130,246,0.35),transparent_32%),radial-gradient(circle_at_20%_85%,rgba(123,72,233,0.3),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                תשתית תשלומים למסחר מקומי וגלובלי
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
                תשלומים שמרגישים פשוטים ללקוח — ומדויקים לעסק.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
                Q Pay מאחדת Checkout, הגנת הונאות, חשבוניות, תשלומים חוזרים, Webhooks ודוחות לתשתית אחת שנבנתה לצוותים שרוצים לצמוח ללא חיכוך.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/register/sme" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-white/90">
                  התחילו לקבל תשלומים <ArrowLeft className="h-4 w-4" />
                </Link>
                <Link to="/docs" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
                  לצוותי פיתוח <Code2 className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-5 border-t border-white/10 pt-6 text-sm">
                <div><p className="font-semibold text-cyan-200">Checkout</p><p className="mt-1 text-white/55">מותאם למותג</p></div>
                <div><p className="font-semibold text-cyan-200">Risk controls</p><p className="mt-1 text-white/55">לפני כל חיוב</p></div>
                <div><p className="font-semibold text-cyan-200">Operations</p><p className="mt-1 text-white/55">שקוף לצוות</p></div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-300/15 p-2.5"><ShoppingBag className="h-5 w-5 text-cyan-200" /></div><div><p className="font-semibold">Global checkout</p><p className="text-xs text-white/55">חוויית קנייה אחידה</p></div></div>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">Protected</span>
              </div>
              <div className="space-y-4 py-5">
                <div className="rounded-xl bg-white/10 p-4"><p className="text-xs text-white/55">סכום לתשלום</p><p className="mt-1 text-2xl font-bold">$248.00 <span className="text-sm font-medium text-white/55">USD</span></p></div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs"><div className="rounded-lg border border-cyan-200/30 bg-cyan-200/10 p-3 text-cyan-100">כרטיס</div><div className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/70">ארנק</div><div className="rounded-lg border border-white/10 bg-white/5 p-3 text-white/70">מקומי</div></div>
                <div className="flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100"><ShieldCheck className="h-5 w-5" /><span>בדיקת סיכון ו־Idempotency פעילים</span></div>
              </div>
              <button type="button" className="w-full rounded-xl bg-cyan-300 py-3 font-semibold text-slate-950">תשלום מאובטח</button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/50"><LockKeyhole className="h-3.5 w-3.5" /> מידע כרטיס נשמר רק באמצעות טוקן</p>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center"><p className="text-sm font-semibold text-primary">לא עוד בחירה בין פשטות לעומק</p><h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">מה עסק מקבל עם Q Pay</h2><p className="mx-auto mt-4 max-w-2xl text-muted-foreground">מוצר אחד לצוותים עסקיים, פיננסיים וטכניים — מה־Checkout ועד ההתחשבנות.</p></div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                [Globe2, "מסחר ללא גבולות", "מטבעות, אזורי זמן ותצוגות מותאמות לקהל גלובלי."],
                [ShieldCheck, "Risk כברירת מחדל", "ציון סיכון, חסימה, Review ו־Audit Trail כחלק מהזרימה."],
                [Workflow, "תפעול מחובר", "Transactions, Refunds, Ledger ו־Webhooks במקום פיזור בין מערכות."],
                [Code2, "פיתוח מהיר", "Hosted Checkout, Payment Links, API ו־Webhooks למסלולי אינטגרציה גמישים."],
              ].map(([Icon, title, description]) => {
                const FeatureIcon = Icon as typeof Globe2;
                return <div key={String(title)} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"><div className="mb-5 inline-flex rounded-xl bg-primary/10 p-3"><FeatureIcon className="h-5 w-5 text-primary" /></div><h3 className="font-semibold text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>;
              })}
            </div>
          </div>
        </section>

        <section className="bg-muted/35 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div><p className="text-sm font-semibold text-primary">Commerce Navigator</p><h2 className="mt-3 text-3xl font-bold text-foreground">מסלול תשלומים שמתאים לעסק שלכם</h2><p className="mt-4 leading-7 text-muted-foreground">במקום להכריח כל עסק לאותו Checkout, Q Pay מאפשרת לבנות סביב שוק היעד, מודל הגבייה והתפעול הנדרש.</p><div className="mt-7 space-y-2">{Object.entries(pathways).map(([key, value]) => <button type="button" key={key} onClick={() => setPathway(key as keyof typeof pathways)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-right text-sm transition ${pathway === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground hover:border-primary/30"}`}><span>{value.title}</span><ChevronLeft className="h-4 w-4" /></button>)}</div></div>
              <div className="rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-10"><div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">תצורה מומלצת</span><h3 className="mt-4 text-2xl font-bold text-foreground">{selected.title}</h3><p className="mt-3 leading-7 text-muted-foreground">{selected.subtitle}</p></div><Landmark className="h-7 w-7 text-primary" /></div><div className="mt-7 space-y-4">{selected.items.map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />{item}</div>)}</div><Link to="/register/enterprise" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">דברו עם צוות פתרונות <ArrowLeft className="h-4 w-4" /></Link></div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl"><div className="mb-12 max-w-2xl"><p className="text-sm font-semibold text-primary">From conversion to reconciliation</p><h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">כל שכבת תשלומים שהמסחר המודרני צריך</h2></div><div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-border p-7"><LayoutDashboard className="h-6 w-6 text-primary" /><h3 className="mt-5 text-lg font-semibold">Merchant command center</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">תצוגה מרכזית להכנסות, תשלומים, הסדרים, פעולות סיכון ותפעול אזורי.</p></div>
            <div className="rounded-2xl border border-border p-7"><CircleDollarSign className="h-6 w-6 text-secondary" /><h3 className="mt-5 text-lg font-semibold">הכנסות ומנויים</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Payment Links, חשבוניות, אמצעי תשלום שמורים, החזרים וחיובים מחזוריים.</p></div>
            <div className="rounded-2xl border border-border p-7"><BarChart3 className="h-6 w-6 text-accent" /><h3 className="mt-5 text-lg font-semibold">שקיפות פיננסית</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Ledger, ייצוא נתונים, Audit Log וכלים להבנת ביצועי התשלום.</p></div>
          </div></div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-l from-primary to-secondary p-8 text-white shadow-xl sm:p-12"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><BadgeCheck className="h-7 w-7 text-cyan-200" /><h2 className="mt-4 text-3xl font-bold">בנו חוויית תשלום שהלקוחות סומכים עליה.</h2><p className="mt-3 max-w-2xl text-white/75">התחילו עם Checkout או API, והרחיבו בהדרגה לתשלומים חוזרים, דוחות, Fraud ו־Operations.</p></div><Link to="/register/sme" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-primary transition hover:bg-white/90">פתיחת חשבון עסקי <ArrowUpRight className="h-4 w-4" /></Link></div></div></section>
      </main>

      <footer className="border-t border-border bg-muted/40 px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row"><p>Q Pay · תשתית תשלומים למסחר מודרני</p><div className="flex gap-5"><Link to="/docs" className="hover:text-primary">תיעוד</Link><Link to="/features" className="hover:text-primary">יכולות</Link><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></div></div></footer>
    </div>
  );
}
