import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, FileText, Plus } from "lucide-react";

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
  const [selectedStudent, setSelectedStudent] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({ student_id: "", course: "", title: "", score: "", coefficient: "1" });

  const isTeacher = user?.role !== "student";

  const load = (studentId = selectedStudent, currentPage = page) =>
    api.get("/grades", {
      params: { ...(studentId ? { student_id: studentId } : {}), page: currentPage, page_size: 10 },
    })
      .then((res) => setGrades(res.data))
      .catch(() => {});

  useEffect(() => {
    load(selectedStudent, page);
    if (isTeacher) {
      api.get("/contacts")
        .then((res) => setStudents(res.data.filter((c) => c.role === "student")))
        .catch(() => {});
    }
  }, [selectedStudent, isTeacher, page]);

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

  const exportGrades = async (format = "csv") => {
    setExporting(true);
    try {
      const response = await api.get(format === "pdf" ? "/grades/export.pdf" : "/grades/export", {
        params: selectedStudent ? { student_id: selectedStudent } : undefined,
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `notes.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch (error) {
      console.error("Failed to export grades", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const chartData = [...grades].reverse().map((g, i) => ({
    name: g.title.slice(0, 10), note: Number(((g.score / g.max_score) * 20).toFixed(1)),
  }));

  const summary = useMemo(() => {
    if (!grades.length) {
      return { average: 0, bestSubject: "—", subjectAverages: [], totalNotes: 0 };
    }

    const normalized = grades.map((g) => ({
      ...g,
      normalizedScore: Number(((g.score / g.max_score) * 20).toFixed(1)),
    }));

    const totalCoefficient = normalized.reduce((sum, g) => sum + g.coefficient, 0);
    const average = normalized.reduce((sum, g) => sum + g.normalizedScore * g.coefficient, 0) / totalCoefficient;
    const subjectAverages = Object.entries(
      normalized.reduce((acc, g) => {
        const current = acc[g.course] ?? { total: 0, count: 0 };
        current.total += g.normalizedScore;
        current.count += 1;
        acc[g.course] = current;
        return acc;
      }, {})
    ).map(([course, info]) => ({ course, average: Number((info.total / info.count).toFixed(1)) }))
      .sort((a, b) => b.average - a.average);

    const bestSubject = subjectAverages[0]?.course ?? "—";

    return {
      average: Number(average.toFixed(1)),
      bestSubject,
      subjectAverages,
      totalNotes: normalized.length,
    };
  }, [grades]);

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

      {isTeacher && (
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Moyenne générale</p>
            <p className="mt-2 text-2xl font-semibold text-[#002FA7]">{summary.average.toFixed(1)}/20</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Nombre de notes</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.totalNotes}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Matière la plus forte</p>
            <p className="mt-2 text-lg font-semibold text-emerald-700">{summary.bestSubject}</p>
          </div>
        </div>
      )}

      {isTeacher && summary.subjectAverages.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-xl mt-4 p-4 shadow-sm">
          <h3 className="font-heading text-lg font-medium text-zinc-800">Vue par matière</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.subjectAverages.map((item) => (
              <span key={item.course} className="rounded-full bg-[#002FA7]/10 px-3 py-1 text-sm font-medium text-[#002FA7]">
                {item.course} · {item.average}/20
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-xl mt-6 overflow-hidden shadow-sm">
        {isTeacher && (
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 bg-zinc-50">
            <div>
              <Label className="text-xs uppercase tracking-[0.15em] text-zinc-500">Étudiant</Label>
              <select
                className="mt-1.5 w-full min-w-[220px] h-9 px-3 rounded-md border border-zinc-200 text-sm bg-white"
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setPage(1);
                }}
                data-testid="grade-filter-student"
              >
                <option value="">Tous les étudiants</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={exportGrades}
              disabled={exporting}
              className="rounded-md"
              data-testid="export-grades-button"
              title="Exporter les notes en CSV"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Export…" : "Exporter CSV"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => exportGrades("pdf")}
              disabled={exporting}
              className="rounded-md"
              data-testid="export-grades-pdf-button"
              title="Exporter les notes en PDF"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm" data-testid="grades-table">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-[0.15em] text-zinc-500 bg-zinc-50">
              {isTeacher && <th className="px-6 py-3 font-semibold">Étudiant</th>}
              <th className="px-6 py-3 font-semibold">Matière</th>
              <th className="px-6 py-3 font-semibold">Évaluation</th>
              <th className="px-6 py-3 font-semibold">Professeur</th>
              <th className="px-6 py-3 font-semibold">Coef.</th>
              <th className="px-6 py-3 font-semibold text-right">Note</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 && (
              <tr><td colSpan={isTeacher ? 6 : 5} className="px-6 py-10 text-center text-zinc-400">Aucune note disponible</td></tr>
            )}
            {grades.map((g) => {
              const studentName = students.find((s) => s.id === g.student_id)?.name ?? g.student_id;
              return (
                <tr key={g.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors" data-testid="grade-row">
                  {isTeacher && <td className="px-6 py-4 font-medium text-zinc-900">{studentName}</td>}
                  <td className="px-6 py-4 font-medium text-zinc-900">{g.course}</td>
                  <td className="px-6 py-4 text-zinc-600">{g.title}</td>
                  <td className="px-6 py-4 text-zinc-600">{g.teacher || "—"}</td>
                  <td className="px-6 py-4 text-zinc-600">{g.coefficient}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center justify-center min-w-[72px] px-2.5 py-1 rounded-full text-sm font-semibold ${gradeColor(g.score, g.max_score)}`}>
                      {g.score}/{g.max_score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
        {grades.length === 10 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 text-sm">
            <Button type="button" variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-md">
              Page précédente
            </Button>
            <span className="text-zinc-500">Page {page}</span>
            <Button type="button" variant="outline" onClick={() => setPage((current) => current + 1)} className="rounded-md">
              Page suivante
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
