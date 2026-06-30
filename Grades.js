import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";

function gradeColor(s, max) {
  const v = (s / max) * 20;
  if (v >= 14) return "text-green-700 bg-green-50";
  if (v >= 10) return "text-amber-700 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default function Grades() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", course: "", title: "", score: "", coefficient: "1" });

  const isTeacher = user?.role !== "student";

  const load = () => api.get("/grades").then((res) => setGrades(res.data)).catch(() => {});

  useEffect(() => {
    load();
    if (isTeacher) api.get("/contacts").then((res) => setStudents(res.data.filter((c) => c.role === "student"))).catch(() => {});
  }, []);

  const submit = async () => {
    try {
      await api.post("/grades", {
        student_id: form.student_id, course: form.course, title: form.title,
        score: parseFloat(form.score), max_score: 20, coefficient: parseFloat(form.coefficient),
      });
      toast.success("Note ajoutée");
      setOpen(false);
      setForm({ student_id: "", course: "", title: "", score: "", coefficient: "1" });
      load();
    } catch (e) {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const chartData = [...grades].reverse().map((g, i) => ({
    name: g.title.slice(0, 10), note: Number(((g.score / g.max_score) * 20).toFixed(1)),
  }));

  return (
    <div data-testid="grades-page">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Académique</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Notes</h1>
        </div>
        {isTeacher && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#002FA7] hover:bg-[#00227A] rounded-md" data-testid="add-grade-button">
                <Plus className="w-4 h-4" /> Ajouter une note
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-md" data-testid="add-grade-dialog">
              <DialogHeader><DialogTitle className="font-heading">Nouvelle note</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Étudiant</Label>
                  <select className="mt-1.5 w-full h-9 px-3 rounded-md border border-zinc-200 text-sm bg-white" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} data-testid="grade-student-select">
                    <option value="">Sélectionner…</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Matière</Label><Input className="mt-1.5 rounded-md" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} data-testid="grade-course-input" /></div>
                <div><Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Intitulé</Label><Input className="mt-1.5 rounded-md" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="grade-title-input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Note /20</Label><Input type="number" step="0.5" className="mt-1.5 rounded-md" value={form.score} onChange={(e) => setForm({ ...form, score: e.target.value })} data-testid="grade-score-input" /></div>
                  <div><Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Coefficient</Label><Input type="number" step="0.5" className="mt-1.5 rounded-md" value={form.coefficient} onChange={(e) => setForm({ ...form, coefficient: e.target.value })} data-testid="grade-coef-input" /></div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit} className="bg-[#002FA7] hover:bg-[#00227A] rounded-md" data-testid="grade-submit-button">Enregistrer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isTeacher && chartData.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md p-6 mt-8">
          <h3 className="font-heading text-lg font-medium text-zinc-800 mb-4">Évolution des résultats</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717A" }} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#71717A" }} />
              <Tooltip />
              <Line type="monotone" dataKey="note" stroke="#002FA7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-md mt-6 overflow-hidden">
        <table className="w-full text-sm" data-testid="grades-table">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.15em] text-zinc-500">
              <th className="px-6 py-3 font-semibold">Matière</th>
              <th className="px-6 py-3 font-semibold">Évaluation</th>
              <th className="px-6 py-3 font-semibold">Coef.</th>
              <th className="px-6 py-3 font-semibold text-right">Note</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-10 text-center text-zinc-400">Aucune note disponible</td></tr>
            )}
            {grades.map((g) => (
              <tr key={g.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors" data-testid="grade-row">
                <td className="px-6 py-4 font-medium text-zinc-900">{g.course}</td>
                <td className="px-6 py-4 text-zinc-600">{g.title}</td>
                <td className="px-6 py-4 text-zinc-600">{g.coefficient}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`inline-block px-2.5 py-1 rounded text-sm font-semibold ${gradeColor(g.score, g.max_score)}`}>
                    {g.score}/{g.max_score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
