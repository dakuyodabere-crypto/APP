import { useEffect, useState } from "react";
import api from "@/lib/api";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const COLORS = {
  Mathématiques: "border-l-[#002FA7] bg-blue-50",
  Informatique: "border-l-indigo-600 bg-indigo-50",
  Physique: "border-l-cyan-600 bg-cyan-50",
  Anglais: "border-l-emerald-600 bg-emerald-50",
  Histoire: "border-l-amber-600 bg-amber-50",
};

export default function Timetable() {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    api.get("/timetable").then((res) => setSlots(res.data)).catch(() => {});
  }, []);

  return (
    <div data-testid="timetable-page">
      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Planning</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Emploi du temps</h1>
      <p className="text-zinc-500 mt-2">Semaine type</p>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <div key={day} className="bg-white border border-zinc-200 rounded-md" data-testid={`day-${day}`}>
              <div className="px-4 py-3 border-b border-zinc-200">
                <h3 className="font-heading font-medium text-zinc-900">{day}</h3>
              </div>
              <div className="p-3 space-y-3 min-h-[120px]">
                {daySlots.length === 0 && <p className="text-xs text-zinc-400 px-1">Pas de cours</p>}
                {daySlots.map((s) => (
                  <div key={s.id} className={`border-l-2 p-3 rounded-r-md ${COLORS[s.course] || "border-l-zinc-400 bg-zinc-50"}`} data-testid="timetable-slot">
                    <p className="text-xs font-semibold text-zinc-500">{s.start} – {s.end}</p>
                    <p className="font-medium text-zinc-900 text-sm mt-1">{s.course}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.room}</p>
                    <p className="text-xs text-zinc-400">{s.teacher}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
