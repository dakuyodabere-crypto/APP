import { useState } from "react";
import { GraduationCap, Eye, EyeOff, ArrowRight, Wifi, BookOpen, Users, BarChart3 } from "lucide-react";

function CampusIllustration() {
  return (
    <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md">
      <ellipse cx="240" cy="290" rx="200" ry="40" fill="rgba(255,255,255,0.06)" />
      <polygon points="170,210 260,260 260,310 170,260" fill="#1e3fa8" />
      <polygon points="120,175 170,210 260,210 210,175" fill="#2a52cc" />
      <polygon points="260,210 310,175 310,225 260,260" fill="#152e80" />
      <rect x="185" y="220" width="20" height="16" rx="2" fill="rgba(255,255,255,0.15)" />
      <rect x="215" y="220" width="20" height="16" rx="2" fill="rgba(255,255,255,0.25)" />
      <rect x="185" y="244" width="20" height="16" rx="2" fill="rgba(255,255,255,0.1)" />
      <rect x="215" y="244" width="20" height="16" rx="2" fill="rgba(255,255,255,0.2)" />
      <rect x="268" y="195" width="16" height="13" rx="2" fill="rgba(255,255,255,0.15)" transform="skewX(-30)" />
      <rect x="268" y="215" width="16" height="13" rx="2" fill="rgba(255,255,255,0.1)" transform="skewX(-30)" />
      <polygon points="120,175 210,175 210,160 130,160" fill="#3b68f0" />
      <polygon points="210,160 310,160 310,175 210,175" fill="#2a52cc" />
      <line x1="210" y1="100" x2="210" y2="160" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
      <polygon points="210,100 238,112 210,124" fill="#22c55e" />
      <polygon points="90,230 130,255 130,295 90,270" fill="#1a3499" />
      <polygon points="55,205 90,230 130,230 95,205" fill="#2348c0" />
      <polygon points="130,230 165,205 165,245 130,270" fill="#122780" />
      <rect x="100" y="240" width="14" height="11" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="100" y="258" width="14" height="11" rx="1" fill="rgba(255,255,255,0.12)" />
      <polygon points="310,215 350,240 350,285 310,260" fill="#1a3499" />
      <polygon points="275,190 310,215 350,215 315,190" fill="#2348c0" />
      <polygon points="350,215 385,190 385,235 350,260" fill="#122780" />
      <rect x="320" y="225" width="14" height="11" rx="1" fill="rgba(255,255,255,0.2)" />
      <rect x="320" y="243" width="14" height="11" rx="1" fill="rgba(255,255,255,0.12)" />
      <circle cx="55" cy="255" r="18" fill="#22c55e" />
      <circle cx="55" cy="248" r="14" fill="#16a34a" />
      <rect x="52" y="268" width="6" height="12" rx="2" fill="#15803d" />
      <circle cx="85" cy="262" r="15" fill="#22c55e" />
      <circle cx="85" cy="256" r="11" fill="#16a34a" />
      <rect x="82" y="273" width="6" height="10" rx="2" fill="#15803d" />
      <circle cx="410" cy="250" r="18" fill="#22c55e" />
      <circle cx="410" cy="243" r="14" fill="#16a34a" />
      <rect x="407" y="263" width="6" height="12" rx="2" fill="#15803d" />
      <circle cx="435" cy="258" r="14" fill="#22c55e" />
      <circle cx="435" cy="252" r="10" fill="#16a34a" />
      <rect x="432" y="268" width="6" height="10" rx="2" fill="#15803d" />
      <polygon points="215,260 265,260 250,310 200,310" fill="rgba(255,255,255,0.08)" />
      <circle cx="240" cy="248" r="8" fill="#fbbf24" />
      <rect x="234" y="256" width="12" height="18" rx="3" fill="#3b82f6" />
      <rect x="228" y="258" width="8" height="3" rx="1.5" fill="#3b82f6" />
      <rect x="244" y="258" width="8" height="3" rx="1.5" fill="#3b82f6" />
      <rect x="235" y="274" width="4" height="10" rx="2" fill="#1e3a8a" />
      <rect x="241" y="274" width="4" height="10" rx="2" fill="#1e3a8a" />
      <path d="M 380 130 Q 400 110 420 130" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M 370 140 Q 400 105 430 140" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.4" />
      <path d="M 360 150 Q 400 100 440 150" stroke="#22c55e" strokeWidth="2" fill="none" opacity="0.25" />
      <circle cx="400" cy="132" r="4" fill="#22c55e" opacity="0.8" />
      <circle cx="150" cy="120" r="3" fill="rgba(255,255,255,0.4)" />
      <circle cx="330" cy="100" r="2" fill="rgba(255,255,255,0.3)" />
      <circle cx="60" cy="180" r="2.5" fill="rgba(255,255,255,0.3)" />
      <circle cx="440" cy="200" r="2" fill="rgba(255,255,255,0.25)" />
    </svg>
  );
}

const features = [
  { icon: BookOpen, label: "Cours en ligne" },
  { icon: Users, label: "Collaboration" },
  { icon: BarChart3, label: "Suivi académique" },
  { icon: Wifi, label: "Campus connecté" },
];

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("login");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1800);
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] min-h-screen px-12 py-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d1b4b 0%, #1a3499 60%, #1e40af 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">Smart Campus</span>
        </div>

        <div className="relative flex-1 flex items-center justify-center py-10">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }}
            />
            <CampusIllustration />
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-2">Plateforme académique</p>
            <h2
              className="text-white text-3xl leading-snug"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 400 }}
            >
              Tout votre parcours académique, <em className="text-[#22c55e] not-italic">en un seul endroit.</em>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 bg-white/8 rounded-lg px-3 py-2.5 backdrop-blur">
                <div className="w-7 h-7 rounded-md bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-[#22c55e]" />
                </div>
                <span className="text-white/80 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f0f4ff]">
        <div className="w-full max-w-[400px]">
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-[#1a3499] flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-[#0d1b4b] font-semibold text-lg">Smart Campus</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-[#1a3499]/8 border border-[#1a3499]/8 p-8">
            {view === "login" ? (
              <>
                <div className="mb-7">
                  <h1
                    className="text-[#0d1b4b] text-3xl mb-1.5"
                    style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    Connexion
                  </h1>
                  <p className="text-[#5a6a9a] text-sm">
                    Votre espace numérique <span className="text-[#1a3499] font-medium">étudiant et enseignant</span>.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="text-[#0d1b4b] text-sm font-medium">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="prenom.nom@campus.fr"
                      required
                      className="w-full h-11 px-4 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm placeholder:text-[#a0aed0] focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 focus:border-[#1a3499]/40 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="text-[#0d1b4b] text-sm font-medium">Mot de passe</label>
                      <button
                        type="button"
                        className="text-xs text-[#1a3499] hover:text-[#0d1b4b] transition-colors"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full h-11 px-4 pr-11 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm placeholder:text-[#a0aed0] focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 focus:border-[#1a3499]/40 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0aed0] hover:text-[#5a6a9a] transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#1a3499]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: loading ? "#1a3499" : "linear-gradient(135deg, #1a3499, #2348c0)" }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#1a3499]/10 text-center">
                  <p className="text-[#5a6a9a] text-sm">
                    Pas encore de compte ? <button
                      onClick={() => setView("register")}
                      className="text-[#1a3499] font-semibold hover:text-[#0d1b4b] transition-colors"
                    >
                      Inscrivez-vous
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-7">
                  <h1
                    className="text-[#0d1b4b] text-3xl mb-1.5"
                    style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
                  >
                    Inscription
                  </h1>
                  <p className="text-[#5a6a9a] text-sm">Créez votre espace académique numérique.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="register-first-name" className="text-[#0d1b4b] text-sm font-medium">Prénom</label>
                      <input
                        id="register-first-name"
                        type="text"
                        placeholder="Jean"
                        required
                        className="w-full h-11 px-4 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm placeholder:text-[#a0aed0] focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="register-last-name" className="text-[#0d1b4b] text-sm font-medium">Nom</label>
                      <input
                        id="register-last-name"
                        type="text"
                        placeholder="Dupont"
                        required
                        className="w-full h-11 px-4 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm placeholder:text-[#a0aed0] focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-email" className="text-[#0d1b4b] text-sm font-medium">Email institutionnel</label>
                    <input
                      id="register-email"
                      type="email"
                      placeholder="prenom.nom@campus.fr"
                      required
                      className="w-full h-11 px-4 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm placeholder:text-[#a0aed0] focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-role" className="text-[#0d1b4b] text-sm font-medium">Rôle</label>
                    <select
                      id="register-role"
                      required
                      className="w-full h-11 px-4 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 transition-all appearance-none"
                    >
                      <option value="" disabled>Sélectionnez votre rôle</option>
                      <option value="student">Étudiant(e)</option>
                      <option value="teacher">Enseignant(e)</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="register-password" className="text-[#0d1b4b] text-sm font-medium">Mot de passe</label>
                    <input
                      id="register-password"
                      type="password"
                      placeholder="Minimum 8 caractères"
                      required
                      className="w-full h-11 px-4 rounded-xl border border-[#1a3499]/15 bg-[#f5f7ff] text-[#0d1b4b] text-sm placeholder:text-[#a0aed0] focus:outline-none focus:ring-2 focus:ring-[#1a3499]/30 transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#1a3499]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
                    style={{ background: "linear-gradient(135deg, #1a3499, #2348c0)" }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#1a3499]/10 text-center">
                  <p className="text-[#5a6a9a] text-sm">
                    Déjà inscrit ? <button
                      onClick={() => setView("login")}
                      className="text-[#1a3499] font-semibold hover:text-[#0d1b4b] transition-colors"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-[#a0aed0] text-xs mt-6">
            © 2026 Smart Campus · Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
