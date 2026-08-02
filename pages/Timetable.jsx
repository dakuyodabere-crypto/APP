import { useEffect, useState } from "react";
import api from "@/lib/api";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const COLORS = {
  Mathématiques: "bg-blue-50 text-blue-700",
  Informatique: "bg-indigo-50 text-indigo-700",
  Physique: "bg-cyan-50 text-cyan-700",
  Anglais: "bg-emerald-50 text-emerald-700",
  Histoire: "bg-amber-50 text-amber-700",
};

export default function Timetable() {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    api.get("/timetable").then((res) => setSlots(res.data)).catch(() => {});
  }, []);

  const tableRows = slots
    .slice()
    .sort((a, b) => {
      const dayOrder = DAYS.indexOf(a.day);
      const dayOrderB = DAYS.indexOf(b.day);
      return dayOrder - dayOrderB || a.start.localeCompare(b.start);
    });

  const program = slots[0]?.program || "Informatique";
  const year = slots[0]?.year || "Année 1";

  return (
    <div data-testid="timetable-page">
      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Planning</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Emploi du temps</h1>
      <p className="text-zinc-500 mt-2">Semaine type</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <div className="rounded-full bg-[#002FA7]/10 px-3 py-1 text-[#002FA7] font-medium">Filière : {program}</div>
        <div className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-700 font-medium">Année : {year}</div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Jour</th>
              <th className="px-4 py-3 text-left font-semibold">Heure</th>
              <th className="px-4 py-3 text-left font-semibold">Cours</th>
              <th className="px-4 py-3 text-left font-semibold">Filière</th>
              <th className="px-4 py-3 text-left font-semibold">Année</th>
              <th className="px-4 py-3 text-left font-semibold">Salle</th>
              <th className="px-4 py-3 text-left font-semibold">Enseignant</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100" data-testid="timetable-slot">
                <td className="px-4 py-3 font-medium text-zinc-900">{s.day}</td>
                <td className="px-4 py-3 text-zinc-600">{s.start} – {s.end}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${COLORS[s.course] || "bg-zinc-100 text-zinc-700"}`}>
                    {s.course}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-700">{s.program || "Informatique"}</td>
                <td className="px-4 py-3 text-zinc-700">{s.year || "Année 1"}</td>
                <td className="px-4 py-3 text-zinc-700">{s.room}</td>
                <td className="px-4 py-3 text-zinc-600">{s.teacher}</td>
              </tr>
            ))}
            {tableRows.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-sm text-zinc-400">Aucun cours disponible pour cette semaine.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
