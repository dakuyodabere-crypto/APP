import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

const HERO = "https://images.unsplash.com/photo-1687530449872-5393d814f8de";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-[#002FA7] flex items-center justify-center rounded-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-xl tracking-tight">CampusConnect</span>
          </div>

          <h1 className="font-heading text-3xl font-semibold tracking-tight text-zinc-900">
            {mode === "login" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1 mb-8">
            Votre espace numérique étudiant et enseignant.
          </p>

          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            {mode === "register" && (
              <div>
                <Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Nom complet</Label>
                <Input className="mt-1.5 rounded-md" value={form.name} onChange={set("name")} required data-testid="name-input" />
              </div>
            )}
            <div>
              <Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Email</Label>
              <Input type="email" className="mt-1.5 rounded-md" value={form.email} onChange={set("email")} required data-testid="email-input" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Mot de passe</Label>
              <Input type="password" className="mt-1.5 rounded-md" value={form.password} onChange={set("password")} required data-testid="password-input" />
            </div>
            {mode === "register" && (
              <div>
                <Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Profil</Label>
                <select
                  className="mt-1.5 w-full h-9 px-3 rounded-md border border-zinc-200 text-sm bg-white focus:ring-2 focus:ring-[#002FA7] focus:outline-none"
                  value={form.role}
                  onChange={set("role")}
                  data-testid="role-select"
                >
                  <option value="student">Étudiant</option>
                  <option value="teacher">Enseignant</option>
                  <option value="admin">Administration</option>
                </select>
              </div>
            )}

            {error && <p className="text-sm text-red-600" data-testid="auth-error">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              data-testid="submit-button"
              className="w-full bg-[#002FA7] hover:bg-[#00227A] rounded-md h-10"
            >
              {loading ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>

          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="mt-6 text-sm text-zinc-600 hover:text-[#002FA7]"
            data-testid="toggle-mode"
          >
            {mode === "login" ? "Pas de compte ? Inscrivez-vous" : "Déjà inscrit ? Connectez-vous"}
          </button>

          {mode === "login" && (
            <div className="mt-8 p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs text-zinc-600 space-y-1" data-testid="demo-credentials">
              <p className="font-semibold text-zinc-700">Comptes de démonstration</p>
              <p>Étudiant : etudiant@campus.edu / etudiant123</p>
              <p>Enseignant : prof@campus.edu / prof123</p>
              <p>Admin : admin@campus.edu / admin123</p>
            </div>
          )}
        </div>
      </div>

      {/* Image side */}
      <div className="hidden lg:block relative">
        <img src={HERO} alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#002FA7]/20" />
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <p className="font-heading text-3xl font-semibold tracking-tight max-w-md">
            Tout votre parcours académique, en un seul endroit.
          </p>
        </div>
      </div>
    </div>
  );
}
