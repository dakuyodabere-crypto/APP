import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { GraduationCap, CreditCard, BookOpen, Bell, Users, CalendarDays, BookMarked } from "lucide-react";

function Stat({ icon: Icon, label, value, sub, testid }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-md p-6 hover:-translate-y-1 hover:shadow-sm transition-all duration-150" data-testid={testid}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">{label}</span>
        <Icon className="w-5 h-5 text-[#002FA7]" />
      </div>
      <p className="font-heading text-3xl font-semibold tracking-tight text-zinc-900 mt-4">{value}</p>
      {sub && <p className="text-sm text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setData(res.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="dashboard-page">
      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Tableau de bord</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">
        Bonjour, {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="text-zinc-500 mt-2">Voici un aperçu de votre activité.</p>

      {!data ? (
        <p className="mt-8 text-zinc-400">Chargement…</p>
      ) : data.role === "student" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Stat icon={GraduationCap} label="Moyenne générale" value={data.average != null ? `${data.average}/20` : "—"} sub={`${data.grades_count} notes`} testid="stat-average" />
          <Stat icon={CreditCard} label="Frais en attente" value={`${data.pending_fees} €`} sub="à régler" testid="stat-fees" />
          <Stat icon={BookOpen} label="Emprunts actifs" value={data.active_loans} sub="livres" testid="stat-loans" />
          <Stat icon={Bell} label="Notifications" value={data.unread_notifications} sub="non lues" testid="stat-notifications" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Stat icon={Users} label="Étudiants" value={data.students} testid="stat-students" />
          <Stat icon={GraduationCap} label="Enseignants" value={data.teachers} testid="stat-teachers" />
          <Stat icon={CalendarDays} label="Cours" value={data.courses} testid="stat-courses" />
          <Stat icon={BookMarked} label="Livres" value={data.books} testid="stat-books" />
        </div>
      )}
    </div>
  );
}
