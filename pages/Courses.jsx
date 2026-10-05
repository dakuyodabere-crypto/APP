import { useEffect, useState } from "react";
import { UploadCloud, FileText, Download } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const emptyForm = {
  title: "",
  description: "",
  subject: "",
  file_url: "",
};

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewCourseId, setPreviewCourseId] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    api.get("/courses").then((res) => setCourses(res.data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [course.title, course.subject, course.description, course.created_by]
      .some((value) => `${value || ""}`.toLowerCase().includes(query));
  });

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      toast.success(`${file.name} prêt à être publié`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const isPreviewable = (url, fileName = "") => {
    const value = `${url || ""}`.toLowerCase();
    const name = `${fileName || ""}`.toLowerCase();
    return value.includes(".pdf") || name.includes(".pdf") || value.includes(".png") || name.includes(".png") || value.includes(".jpg") || name.includes(".jpg") || value.includes(".jpeg") || name.includes(".jpeg") || value.includes(".gif") || name.includes(".gif") || value.includes(".webp") || name.includes(".webp") || value.includes(".txt") || name.includes(".txt");
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("subject", form.subject);
      if (form.file_url) formData.append("file_url", form.file_url);
      if (selectedFile) formData.append("file", selectedFile);

      await api.post("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Cours publié");
      setForm(emptyForm);
      setSelectedFile(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Erreur lors du dépôt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="courses-page" className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Ressources pédagogiques</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1">Cours et supports</h1>
        <p className="text-zinc-500 mt-2">Les enseignants peuvent déposer des supports, et les étudiants peuvent les consulter ici.</p>
      </div>

      {user?.role !== "student" && (
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <h2 className="font-heading text-xl font-semibold text-zinc-900">Déposer un cours</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course-title" className="text-sm font-medium text-zinc-700">Titre</label>
                <input
                  id="course-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2"
                  placeholder="Ex. Introduction à la programmation"
                />
              </div>
              <div>
                <label htmlFor="course-subject" className="text-sm font-medium text-zinc-700">Matière</label>
                <input
                  id="course-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2"
                  placeholder="Ex. Informatique"
                />
              </div>
            </div>
            <div>
              <label htmlFor="course-description" className="text-sm font-medium text-zinc-700">Description</label>
              <textarea
                id="course-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows="3"
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2"
                placeholder="Décrivez le contenu du cours ou du support"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="course-file-upload" className="text-sm font-medium text-zinc-700">Fichier à téléverser</label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragActive ? "border-[#002FA7] bg-[#f5f7ff]" : "border-zinc-200 bg-zinc-50"}`}
                >
                  <input
                    type="file"
                    accept=".pdf,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="sr-only"
                    id="course-file-upload"
                  />
                  <label htmlFor="course-file-upload" className="flex cursor-pointer flex-col items-center gap-2">
                    <UploadCloud className="h-6 w-6 text-[#002FA7]" />
                    <span className="text-sm font-medium text-zinc-700">Glissez-déposez un fichier ou cliquez pour parcourir</span>
                    <span className="text-xs text-zinc-500">PDF, DOCX ou images JPG/PNG, 10 Mo maximum</span>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="course-file-url" className="text-sm font-medium text-zinc-700">Lien externe (optionnel)</label>
                <input
                  id="course-file-url"
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2"
                  placeholder="https://..."
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="bg-[#002FA7] hover:bg-[#00227A] rounded-md text-white">
              {loading ? "Publication…" : "Publier le cours"}
            </Button>
          </form>
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold text-zinc-900">Liste des cours disponibles</h2>
          <div>
            <label htmlFor="course-search" className="sr-only">Rechercher un cours</label>
            <input
              id="course-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cours…"
              className="w-full min-w-[240px] rounded-md border border-zinc-200 px-3 py-2 text-sm"
              data-testid="course-search"
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white border border-zinc-200 rounded-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-400">{course.subject}</p>
                  <h3 className="font-heading text-lg font-semibold text-zinc-900 mt-1">{course.title}</h3>
                </div>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full">{course.created_by}</span>
              </div>
              <p className="text-sm text-zinc-600 mt-3">{course.description}</p>
              {course.file_url ? (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <FileText className="h-5 w-5 text-[#002FA7]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{course.file_name || "Ressource disponible"}</p>
                      <p className="text-xs text-zinc-500">Fichier prêt à être consulté</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {isPreviewable(course.file_url, course.file_name) && (
                      <button
                        type="button"
                        onClick={() => setPreviewCourseId(previewCourseId === course.id ? null : course.id)}
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        {previewCourseId === course.id ? "Fermer l’aperçu" : "Voir l’aperçu"}
                      </button>
                    )}
                    <a
                      href={course.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md bg-[#002FA7] px-3 py-2 text-sm font-medium text-white hover:bg-[#00227A]"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </a>
                  </div>
                  {previewCourseId === course.id && isPreviewable(course.file_url, course.file_name) && (
                    <div className="mt-3 overflow-hidden rounded-md border border-zinc-200 bg-white">
                      <iframe
                        src={course.file_url}
                        title={course.title}
                        className="h-[420px] w-full"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 mt-4">Aucun fichier fourni</p>
              )}
            </div>
          ))}
          {filteredCourses.length === 0 && <p className="text-zinc-400">Aucun cours correspondant.</p>}
        </div>
      </div>
    </div>
  );
}
