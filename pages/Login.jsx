import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

const HERO = "https://images.unsplash.com/photo-1687530449872-5393d814f8de";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const actionLabel = loading ? "Veuillez patienter…" : "Se connecter";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-zinc-50">
      {/* Form side */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-zinc-50">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(0,47,167,0.35)]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-[#002FA7] flex items-center justify-center rounded-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-xl tracking-tight">CampusConnect</span>
          </div>

          <p className="text-xs uppercase tracking-[0.24em] text-[#002FA7] font-semibold mb-2">
            Bienvenue
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-zinc-900">
            Connexion
          </h1>
          <p className="text-sm text-zinc-500 mt-1 mb-8">
            Votre espace numérique étudiant et enseignant.
          </p>

          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            <div>
              <Label htmlFor="auth-email" className="text-xs uppercase tracking-[0.15em] text-zinc-500">Email</Label>
              <Input id="auth-email" type="email" className="mt-1.5 rounded-md" value={form.email} onChange={set("email")} required data-testid="email-input" />
            </div>
            <div>
              <Label htmlFor="auth-password" className="text-xs uppercase tracking-[0.15em] text-zinc-500">Mot de passe</Label>
              <Input id="auth-password" type="password" className="mt-1.5 rounded-md" value={form.password} onChange={set("password")} required data-testid="password-input" />
            </div>
            {error && <p className="text-sm text-red-600" data-testid="auth-error">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              data-testid="submit-button"
              className="w-full bg-[#002FA7] hover:bg-[#00227A] rounded-md h-11 font-medium shadow-sm"
            >
              {actionLabel}
            </Button>
          </form>

          <p className="mt-6 text-sm text-zinc-600">
            Les comptes étudiants et enseignants sont créés par l’administration.
          </p>
        </div>
      </div>

      {/* Image side */}
      <div className="hidden lg:block relative overflow-hidden">
        <img src={HERO} alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f69]/80 via-[#002FA7]/30 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-heading text-3xl font-semibold tracking-tight max-w-md drop-shadow-lg">
            Tout votre parcours académique, en un seul endroit.
          </p>
        </div>
      </div>
    </div>
  );
}
