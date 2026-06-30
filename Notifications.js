import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Bell, GraduationCap, CreditCard, Info, Check } from "lucide-react";

const ICONS = { grade: GraduationCap, payment: CreditCard, info: Info };

export default function Notifications() {
  const [items, setItems] = useState([]);

  const load = () => api.get("/notifications").then((res) => setItems(res.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  const markOne = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  return (
    <div data-testid="notifications-page">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Activité</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Notifications</h1>
        </div>
        <Button variant="outline" className="rounded-md" onClick={markAll} data-testid="mark-all-read-button">
          <Check className="w-4 h-4" /> Tout marquer comme lu
        </Button>
      </div>

      <div className="space-y-2 mt-8">
        {items.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-md p-10 text-center text-zinc-400">
            <Bell className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
            Aucune notification
          </div>
        )}
        {items.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <div
              key={n.id}
              className={`bg-white border rounded-md p-4 flex items-start gap-4 ${n.read ? "border-zinc-200" : "border-[#002FA7]/40 bg-blue-50/30"}`}
              data-testid="notification-item"
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${n.read ? "bg-zinc-100 text-zinc-500" : "bg-[#002FA7] text-white"}`}>
                <Icon className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-900">{n.title}</p>
                <p className="text-sm text-zinc-600 mt-0.5">{n.body}</p>
                <p className="text-xs text-zinc-400 mt-1">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
              </div>
              {!n.read && (
                <button onClick={() => markOne(n.id)} className="text-xs text-[#002FA7] hover:underline shrink-0" data-testid="mark-read-button">
                  Marquer lu
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
