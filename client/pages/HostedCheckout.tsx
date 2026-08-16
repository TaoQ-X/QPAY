import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Globe2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  amount_cents?: number;
  is_variable_amount?: boolean;
  min_amount_cents?: number;
  max_amount_cents?: number;
  currency: string;
  custom_message?: string;
}

export default function HostedCheckout() {
  const slug = window.location.pathname.split("/").filter(Boolean).pop() || "";
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [cardToken, setCardToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "review" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/payment-links/${encodeURIComponent(slug)}/checkout`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Payment link unavailable");
        setLink(data.data);
        if (!data.data.is_variable_amount && data.data.amount_cents) {
          setAmount((data.data.amount_cents / 100).toFixed(2));
        }
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.message || "Payment link unavailable");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const amountCents = useMemo(() => Math.round(Number(amount) * 100), [amount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!link || !email || !cardToken || !amountCents) {
      setStatus("error");
      setMessage("Enter a valid amount, email, and payment token.");
      return;
    }

    setProcessing(true);
    setStatus("idle");
    setMessage("");
    const idempotencyKey = `checkout_${crypto.randomUUID()}`;

    try {
      const response = await fetch(`/api/payment-links/${encodeURIComponent(slug)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          amount_cents: amountCents,
          card_token: cardToken,
          payment_method: "card",
          customer_email: email,
        }),
      });
      const data = await response.json();
      if (response.status === 202) {
        setStatus("review");
        setMessage(data.message || "Additional verification is required.");
      } else if (!response.ok || !data.success) {
        setStatus("error");
        setMessage(data.error || "Payment could not be completed.");
      } else {
        setStatus("success");
        setMessage(`Payment confirmed. Transaction ${data.transaction_id}`);
      }
    } catch {
      setStatus("error");
      setMessage("Unable to connect to the payment service.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading secure checkout…</div>;
  if (!link) return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white"><div><AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-300" /><h1 className="text-2xl font-bold">Checkout unavailable</h1><p className="mt-2 text-white/70">{message}</p></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-primary/90 to-secondary p-4 sm:p-8">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-[1fr_1.1fr]">
        <div className="relative overflow-hidden bg-slate-950 p-8 text-white sm:p-12">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-cyan-300" /> Q Pay Secure Checkout</div>
            <div className="my-auto py-12">
              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-white/50">Payment request</p>
              <h1 className="text-3xl font-bold sm:text-4xl">{link.title}</h1>
              <p className="mt-4 leading-7 text-white/65">{link.description || link.custom_message || "Fast, secure digital payment powered by Q Pay."}</p>
              <div className="mt-8 flex items-center gap-3 text-sm text-white/70"><Globe2 className="h-4 w-4" /> Global currencies · intelligent risk controls</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50"><LockKeyhole className="h-4 w-4" /> Tokenized payment data · protected checkout</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10">
          <div className="mb-8 flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Complete your payment</p><h2 className="mt-1 text-2xl font-bold text-foreground">Secure checkout</h2></div><ShieldCheck className="h-7 w-7 text-accent" /></div>
          {status !== "idle" && <div className={`mb-6 flex gap-3 rounded-xl border p-4 text-sm ${status === "success" ? "border-accent/20 bg-accent/10 text-accent" : status === "review" ? "border-primary/20 bg-primary/10 text-primary" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>{status === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}<span>{message}</span></div>}
          <div className="space-y-5">
            <label className="block text-sm font-medium text-foreground">Email for receipt<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-primary" required /></label>
            {link.is_variable_amount ? <label className="block text-sm font-medium text-foreground">Amount ({link.currency})<input type="number" min={(link.min_amount_cents || 1) / 100} max={link.max_amount_cents ? link.max_amount_cents / 100 : undefined} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-border px-4 py-3 outline-none focus:ring-2 focus:ring-primary" required /></label> : <div className="rounded-xl bg-muted p-4"><p className="text-sm text-muted-foreground">Amount</p><p className="mt-1 text-2xl font-bold text-foreground">{link.currency} {Number(amount).toFixed(2)}</p></div>}
            <label className="block text-sm font-medium text-foreground">Payment token<input type="password" value={cardToken} onChange={(event) => setCardToken(event.target.value)} placeholder="tok_secure_…" className="mt-2 w-full rounded-xl border border-border px-4 py-3 font-mono text-sm outline-none focus:ring-2 focus:ring-primary" required /><span className="mt-2 block text-xs text-muted-foreground">Use a tokenized payment method. Never enter raw card details.</span></label>
            <button type="submit" disabled={processing || status === "success"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{processing ? "Checking risk and processing…" : "Pay securely"}<LockKeyhole className="h-4 w-4" /></button>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">By continuing, your payment is evaluated by Q Pay fraud protection.</p>
        </form>
      </div>
    </div>
  );
}
