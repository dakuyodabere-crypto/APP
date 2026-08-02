import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Library() {
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);

  const load = () => {
    api.get("/books").then((res) => setBooks(res.data)).catch(() => {});
    api.get("/library/loans").then((res) => setLoans(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const borrow = async (id) => {
    try {
      await api.post("/library/borrow", { book_id: id });
      toast.success("Livre emprunté");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur");
    }
  };

  const returnBook = async (loanId) => {
    try {
      await api.post(`/library/return/${loanId}`);
      toast.success("Livre rendu");
      load();
    } catch (e) {
      toast.error("Erreur");
    }
  };

  const loanIds = new Set(loans.map((l) => l.book_id));

  return (
    <div data-testid="library-page">
      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Ressources</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Bibliothèque</h1>

      {loans.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading text-lg font-medium text-zinc-800 mb-3">Mes emprunts</h3>
          <div className="space-y-2">
            {loans.map((l) => (
              <div key={l.id} className="bg-white border border-zinc-200 rounded-md p-4 flex items-center justify-between" data-testid="loan-item">
                <div>
                  <p className="font-medium text-zinc-900">{l.book_title}</p>
                  <p className="text-sm text-zinc-500">À rendre avant : {new Date(l.due_date).toLocaleDateString("fr-FR")}</p>
                </div>
                <Button variant="outline" className="rounded-md" onClick={() => returnBook(l.id)} data-testid="return-button">Rendre</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="font-heading text-lg font-medium text-zinc-800 mb-3 mt-8">Catalogue</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {books.map((b) => (
          <div key={b.id} className="bg-white border border-zinc-200 rounded-md overflow-hidden flex flex-col" data-testid="book-card">
            <div className="h-40 bg-zinc-100 overflow-hidden">
              <img src={b.cover} alt={b.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <span className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-400">{b.category}</span>
              <p className="font-medium text-zinc-900 mt-1 leading-tight">{b.title}</p>
              <p className="text-sm text-zinc-500 mt-0.5">{b.author}</p>
              <p className="text-xs text-zinc-500 mt-2">{b.available}/{b.total} disponible(s)</p>
              <Button
                disabled={b.available <= 0 || loanIds.has(b.id)}
                onClick={() => borrow(b.id)}
                className="mt-3 w-full bg-[#002FA7] hover:bg-[#00227A] rounded-md"
                data-testid={`borrow-button-${b.id}`}
              >
                {loanIds.has(b.id) ? "Emprunté" : b.available <= 0 ? "Indisponible" : "Emprunter"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
