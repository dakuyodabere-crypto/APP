import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, CalendarDays, CreditCard, BookOpen,
  MessagesSquare, Bell, LogOut, Menu, GraduationCap as Logo,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/notes", label: "Notes", icon: GraduationCap, testid: "nav-grades" },
  { to: "/emploi-du-temps", label: "Emploi du temps", icon: CalendarDays, testid: "nav-timetable" },
  { to: "/paiements", label: "Paiements", icon: CreditCard, testid: "nav-payments" },
  { to: "/bibliotheque", label: "Bibliothèque", icon: BookOpen, testid: "nav-library" },
  { to: "/messagerie", label: "Messagerie", icon: MessagesSquare, testid: "nav-messaging" },
  { to: "/notifications", label: "Notifications", icon: Bell, testid: "nav-notifications" },
];

const ROLE_LABEL = { student: "Étudiant", teacher: "Enseignant", admin: "Administration" };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => {
    api.get("/notifications").then((res) => {
      setUnread(res.data.filter((n) => !n.read).length);
    }).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-[#F4F4F5]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        data-testid="sidebar"
      >
        <div className="h-16 flex items-center gap-2 px-6 border-b border-zinc-200">
          <div className="w-8 h-8 bg-[#002FA7] flex items-center justify-center rounded-md">
            <Logo className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight text-zinc-900">
            CampusConnect
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                data-testid={item.testid}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 border-l-2 border-[#002FA7]"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span>{item.label}</span>
                {item.to === "/notifications" && unread > 0 && (
                  <span className="ml-auto text-xs bg-[#002FA7] text-white px-1.5 py-0.5 rounded" data-testid="nav-unread-badge">
                    {unread}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-md bg-zinc-900 text-white flex items-center justify-center text-sm font-medium" data-testid="user-initial">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate" data-testid="user-name">{user?.name}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{ROLE_LABEL[user?.role]}</p>
            </div>
          </div>
          <button
            onClick={logout}
            data-testid="logout-button"
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-red-600 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center px-4 lg:px-8 gap-4 lg:hidden">
          <button onClick={() => setOpen(true)} data-testid="menu-toggle">
            <Menu className="w-6 h-6 text-zinc-700" />
          </button>
          <span className="font-heading font-semibold">CampusConnect</span>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
