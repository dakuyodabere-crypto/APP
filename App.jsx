import { Suspense, lazy } from "react";
import PropTypes from "prop-types";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Grades = lazy(() => import("@/pages/Grades"));
const Timetable = lazy(() => import("@/pages/Timetable"));
const Payments = lazy(() => import("@/pages/Payments"));
const Library = lazy(() => import("@/pages/Library"));
const Messaging = lazy(() => import("@/pages/Messaging"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Courses = lazy(() => import("@/pages/Courses"));

function Protected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500" data-testid="app-loading">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Chargement…</div>}>
            <Routes>
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/notes" element={<Protected><Grades /></Protected>} />
              <Route path="/emploi-du-temps" element={<Protected><Timetable /></Protected>} />
              <Route path="/paiements" element={<Protected><Payments /></Protected>} />
              <Route path="/cours" element={<Protected><Courses /></Protected>} />
              <Route path="/bibliotheque" element={<Protected><Library /></Protected>} />
              <Route path="/messagerie" element={<Protected><Messaging /></Protected>} />
              <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </div>
  );
}

Protected.propTypes = {
  children: PropTypes.node,
};

PublicOnly.propTypes = {
  children: PropTypes.node,
};

export default App;
