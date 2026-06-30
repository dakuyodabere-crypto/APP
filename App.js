import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Login from "@/pages/Login";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Grades from "@/pages/Grades";
import Timetable from "@/pages/Timetable";
import Payments from "@/pages/Payments";
import Library from "@/pages/Library";
import Messaging from "@/pages/Messaging";
import Notifications from "@/pages/Notifications";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500" data-testid="app-loading">
        Chargement…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/notes" element={<Protected><Grades /></Protected>} />
            <Route path="/emploi-du-temps" element={<Protected><Timetable /></Protected>} />
            <Route path="/paiements" element={<Protected><Payments /></Protected>} />
            <Route path="/bibliotheque" element={<Protected><Library /></Protected>} />
            <Route path="/messagerie" element={<Protected><Messaging /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </div>
  );
}

export default App;
