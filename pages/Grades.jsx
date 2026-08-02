import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
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

function TrendChart({ data }) {
  const width = 640;
  const height = 220;
  const paddingX = 28;
  const paddingY = 18;
  const minY = 0;
  const maxY = 20;

  const coords = data.map((point, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(data.length - 1, 1);
    const y = height - paddingY - ((point.note - minY) / (maxY - minY)) * (height - paddingY * 2);
    return `${x},${y}`;
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[240px]">
        {[0, 5, 10, 15, 20].map((tick) => {
          const y = height - paddingY - ((tick - minY) / (maxY - minY)) * (height - paddingY * 2);
          return (
            <g key={tick}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#E4E4E7" strokeDasharray="3 3" />
              <text x={8} y={y + 4} fontSize="11" fill="#71717A">{tick}</text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#002FA7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords.join(" ")}
        />

        {data.map((point, index) => {
          const x = paddingX + (index * (width - paddingX * 2)) / Math.max(data.length - 1, 1);
          const y = height - paddingY - ((point.note - minY) / (maxY - minY)) * (height - paddingY * 2);
          return (
            <g key={`${point.name}-${index}`}>
              <circle cx={x} cy={y} r="4" fill="#002FA7" />
              <text x={x} y={height - 4} textAnchor="middle" fontSize="10" fill="#71717A">{point.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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
        score: Number.parseFloat(form.score), max_score: 20, coefficient: Number.parseFloat(form.coefficient),
      });
      toast.success("Note ajoutée");
      setOpen(false);
      setForm({ student_id: "", course: "", title: "", score: "", coefficient: "1" });
      load();
    } catch (error) {
      console.error("Failed to add grade", error);
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
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-[#002FA7]/10 px-3 py-1 text-[#002FA7] font-medium">Filière : Informatique</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 font-medium">Année : Année 1</span>
          </div>
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
          <TrendChart data={chartData} />
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl mt-6 overflow-hidden shadow-sm">
        <table className="w-full text-sm" data-testid="grades-table">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.15em] text-zinc-500 bg-zinc-50">
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
                  <span className={`inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full text-sm font-semibold ${gradeColor(g.score, g.max_score)}`}>
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
