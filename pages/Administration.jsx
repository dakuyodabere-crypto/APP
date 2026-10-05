import { useEffect, useState } from "react";
import { Activity, Plus, RefreshCw, ShieldCheck, Users, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

const emptyForm = { name: "", email: "", password: "", role: "student" };
const roleLabels = { student: "Étudiant", teacher: "Enseignant", admin: "Administration" };

function roleBadge(role) {
  return role === "teacher" ? "bg-blue-50 text-blue-700" : "bg-zinc-100 text-zinc-700";
}

export default function Administration() {
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, activityResponse] = await Promise.all([
        api.get("/users"),
        api.get("/admin/activity?page_size=12"),
      ]);
      setUsers(usersResponse.data);
      setActivity(activityResponse.data);
    } catch (error) {
      toast.error(formatApiError(error?.response?.data?.detail || error?.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createAccount = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/auth/register", form);
      toast.success(`${roleLabels[form.role]} créé avec succès`);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(formatApiError(error?.response?.data?.detail || error?.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8" data-testid="administration-page">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#002FA7]">Espace sécurisé</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Administration</h1>
          <p className="text-zinc-500 mt-2">Gérez les accès au campus et suivez les dernières actions.</p>
        </div>
        <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 h-10 px-4 border border-zinc-200 bg-white text-sm font-medium text-zinc-800 rounded-md hover:bg-zinc-50 disabled:opacity-60" data-testid="administration-refresh-button">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Actualiser
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.35fr]">
        <form onSubmit={createAccount} className="bg-white border border-zinc-200 rounded-md p-6 space-y-5" data-testid="create-account-form">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 bg-[#002FA7] text-white flex items-center justify-center rounded-md"><UserRoundPlus size={20} /></div>
            <div><h2 className="font-heading text-xl font-medium text-zinc-900">Créer un compte</h2><p className="text-sm text-zinc-500">Ajoutez un membre à la plateforme.</p></div>
          </div>
          <label className="block text-sm font-medium text-zinc-700">Nom complet<input name="name" value={form.name} onChange={updateForm} required minLength={2} className="mt-1.5 w-full h-10 px-3 border border-zinc-200 rounded-md text-sm focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20 outline-none" data-testid="account-name-input" /></label>
          <label className="block text-sm font-medium text-zinc-700">Email institutionnel<input name="email" type="email" value={form.email} onChange={updateForm} required className="mt-1.5 w-full h-10 px-3 border border-zinc-200 rounded-md text-sm focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20 outline-none" data-testid="account-email-input" /></label>
          <label className="block text-sm font-medium text-zinc-700">Mot de passe<input name="password" type="password" value={form.password} onChange={updateForm} required minLength={8} className="mt-1.5 w-full h-10 px-3 border border-zinc-200 rounded-md text-sm focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20 outline-none" data-testid="account-password-input" /></label>
          <label className="block text-sm font-medium text-zinc-700">Profil<select name="role" value={form.role} onChange={updateForm} className="mt-1.5 w-full h-10 px-3 border border-zinc-200 rounded-md text-sm bg-white focus:border-[#002FA7] focus:ring-2 focus:ring-[#002FA7]/20 outline-none" data-testid="account-role-select"><option value="student">Étudiant</option><option value="teacher">Enseignant</option></select></label>
          <button type="submit" disabled={saving} className="w-full h-10 inline-flex items-center justify-center gap-2 bg-[#002FA7] text-white rounded-md text-sm font-medium hover:bg-[#00227A] disabled:opacity-60" data-testid="create-account-button"><Plus size={16} />{saving ? "Création…" : "Créer le compte"}</button>
        </form>

        <section className="bg-white border border-zinc-200 rounded-md p-6" data-testid="users-section">
          <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-3"><Users className="text-[#002FA7]" size={20} /><h2 className="font-heading text-xl font-medium text-zinc-900">Comptes du campus</h2></div><span className="text-sm text-zinc-500">{users.length} comptes</span></div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-zinc-200 text-xs uppercase tracking-[0.12em] text-zinc-500"><th className="pb-3 font-semibold">Nom</th><th className="pb-3 font-semibold">Email</th><th className="pb-3 font-semibold">Profil</th></tr></thead><tbody>{users.map((item) => <tr key={item.id} className="border-b border-zinc-100 last:border-0"><td className="py-3 font-medium text-zinc-900">{item.name}</td><td className="py-3 text-zinc-500">{item.email}</td><td className="py-3"><span className={`px-2 py-1 text-xs rounded ${roleBadge(item.role)}`}>{roleLabels[item.role]}</span></td></tr>)}</tbody></table>{!loading && users.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Aucun compte trouvé.</p>}</div>
        </section>
      </section>

      <section className="bg-white border border-zinc-200 rounded-md p-6" data-testid="activity-section"><div className="flex items-center gap-3 mb-5"><Activity className="text-[#002FA7]" size={20} /><div><h2 className="font-heading text-xl font-medium text-zinc-900">Activité récente</h2><p className="text-sm text-zinc-500">Les dernières opérations enregistrées.</p></div></div><div className="grid gap-3 md:grid-cols-2">{activity.map((item) => <div key={item.id} className="border border-zinc-100 p-3 rounded-md"><div className="flex justify-between gap-3"><span className="text-sm font-medium text-zinc-800">{item.user_name}</span><span className="text-xs text-zinc-400">{item.action}</span></div><p className="text-sm text-zinc-500 mt-1">{item.resource}</p></div>)}{!loading && activity.length === 0 && <p className="text-sm text-zinc-500">Aucune activité récente.</p>}</div></section>
    </div>
  );
}
