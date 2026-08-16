import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Globe2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";

interface GlobalOperationsPanelProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onExport: () => void;
}

const currencies = ["USD", "EUR", "GBP", "ILS", "AED"];

const pulseEvents = [
  { label: "Payment captured", detail: "Checkout · 2 sec ago", amount: "+$248.00", tone: "success" },
  { label: "Risk review cleared", detail: "Transaction txn_84K · 1 min ago", amount: "Low risk", tone: "info" },
  { label: "Settlement prepared", detail: "North America · 4 min ago", amount: "$12,480", tone: "neutral" },
];

const toneClasses = {
  success: "bg-accent/10 text-accent",
  info: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
};

export default function GlobalOperationsPanel({
  currency,
  onCurrencyChange,
  onExport,
}: GlobalOperationsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary/90 to-secondary p-6 text-white shadow-lg">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-secondary/40 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-white/80">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Global Command Center</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">One view for every market</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
              Monitor payment performance, risk decisions and settlement readiness across your global operation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur">
              <Globe2 className="h-4 w-4" />
              <select
                value={currency}
                onChange={(event) => onCurrencyChange(event.target.value)}
                className="bg-transparent font-semibold outline-none"
                aria-label="Reporting currency"
              >
                {currencies.map((item) => (
                  <option key={item} value={item} className="text-foreground">{item}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={onExport}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-white/90"
            >
              Export snapshot
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Global volume", "$284,920", "+18.4%", true],
            ["Approval rate", "98.7%", "+2.1%", true],
            ["Risk prevented", "$8,420", "+11.8%", true],
            ["Settlement SLA", "99.98%", "On target", null],
          ].map(([label, value, change, positive]) => (
            <div key={String(label)} className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs text-white/65">{label}</p>
              <p className="mt-2 text-xl font-bold">{value}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs ${positive === true ? "text-emerald-200" : "text-white/65"}`}>
                {positive === true && <ArrowUpRight className="h-3 w-3" />}
                {change}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Live payment pulse</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Real-time signals from your payment network</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Live
            </span>
          </div>
          <div className="space-y-3">
            {pulseEvents.map((event) => (
              <div key={event.label} className="flex items-center justify-between gap-3 rounded-lg border border-border/80 p-3 transition hover:border-primary/30 hover:bg-muted/30">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`rounded-lg p-2 ${toneClasses[event.tone as keyof typeof toneClasses]}`}>
                    {event.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> : event.tone === "info" ? <ShieldCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{event.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">{event.amount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-foreground">Platform health</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Operational status across core services</p>
            </div>
            <span className="text-sm font-bold text-accent">99.98%</span>
          </div>
          <div className="space-y-4">
            {[
              ["Payment processing", "Operational", CheckCircle2, "text-accent"],
              ["Fraud intelligence", "Operational", ShieldCheck, "text-primary"],
              ["Settlement engine", "Operational", CheckCircle2, "text-accent"],
              ["API latency", "124 ms", Wifi, "text-secondary"],
            ].map(([label, status, Icon, color]) => {
              const ServiceIcon = Icon as typeof CheckCircle2;
              return (
                <div key={String(label)} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ServiceIcon className={`h-4 w-4 ${String(color)}`} />
                    <span className="text-sm text-foreground">{label}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{status}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <ArrowDownRight className="h-3.5 w-3.5 text-accent" />
            No active incidents in the last 24 hours
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["North America", "48.2%", "bg-primary"],
          ["Europe", "26.4%", "bg-secondary"],
          ["Middle East", "15.7%", "bg-accent"],
          ["Asia Pacific", "9.7%", "bg-orange-400"],
        ].map(([region, share, color]) => (
          <div key={region} className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-muted-foreground">{region}</p>
              <span className={`h-2 w-2 rounded-full ${color}`} />
            </div>
            <p className="text-xl font-bold text-foreground">{share}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${color}`} style={{ width: share }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
