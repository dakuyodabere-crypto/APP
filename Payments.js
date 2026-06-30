import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Clock } from "lucide-react";

export default function Payments() {
  const [fees, setFees] = useState([]);
  const [paying, setPaying] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = () => api.get("/fees").then((res) => setFees(res.data)).catch(() => {});

  const pollStatus = useCallback(async (sessionId, attempts = 0) => {
    if (attempts >= 6) {
      setChecking(false);
      toast.error("Vérification du paiement expirée.");
      return;
    }
    try {
      const { data } = await api.get(`/payments/status/${sessionId}`);
      if (data.payment_status === "paid") {
        setChecking(false);
        toast.success("Paiement confirmé !");
        load();
        return;
      }
      if (data.status === "expired") {
        setChecking(false);
        toast.error("Session de paiement expirée.");
        return;
      }
      setTimeout(() => pollStatus(sessionId, attempts + 1), 2000);
    } catch (e) {
      setChecking(false);
      toast.error("Erreur de vérification.");
    }
  }, []);

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      setChecking(true);
      pollStatus(sessionId);
      window.history.replaceState({}, "", "/paiements");
    }
  }, [pollStatus]);

  const pay = async (feeId) => {
    setPaying(feeId);
    try {
      const { data } = await api.post("/payments/checkout", {
        fee_id: feeId, origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur de paiement");
      setPaying(null);
    }
  };

  const total = fees.filter((f) => f.status !== "paid").reduce((s, f) => s + f.amount, 0);

  return (
    <div data-testid="payments-page">
      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Finances</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Paiement des frais</h1>

      {checking && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm text-[#002FA7]" data-testid="payment-checking">
          Vérification de votre paiement en cours…
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-md p-6 mt-8 max-w-md">
        <span className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Solde à régler</span>
        <p className="font-heading text-4xl font-semibold tracking-tight text-zinc-900 mt-2" data-testid="pending-total">{total.toFixed(2)} €</p>
      </div>

      <div className="space-y-3 mt-8">
        {fees.map((f) => (
          <div key={f.id} className="bg-white border border-zinc-200 rounded-md p-5 flex items-center justify-between gap-4 flex-wrap" data-testid="fee-item">
            <div>
              <p className="font-medium text-zinc-900">{f.label}</p>
              <p className="text-sm text-zinc-500 mt-0.5">Échéance : {f.due_date}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-heading text-lg font-semibold text-zinc-900">{f.amount.toFixed(2)} €</span>
              {f.status === "paid" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-green-700 bg-green-50" data-testid="fee-paid-badge">
                  <CheckCircle2 className="w-4 h-4" /> Payé
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-amber-700 bg-amber-50">
                    <Clock className="w-4 h-4" /> En attente
                  </span>
                  <Button onClick={() => pay(f.id)} disabled={paying === f.id} className="bg-[#002FA7] hover:bg-[#00227A] rounded-md" data-testid={`pay-button-${f.id}`}>
                    {paying === f.id ? "Redirection…" : "Payer"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {fees.length === 0 && <p className="text-zinc-400">Aucun frais.</p>}
      </div>
    </div>
  );
}
