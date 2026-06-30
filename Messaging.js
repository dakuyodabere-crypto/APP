import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const ROLE_LABEL = { student: "Étudiant", teacher: "Enseignant", admin: "Administration" };

export default function Messaging() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    api.get("/contacts").then((res) => {
      setContacts(res.data);
      if (res.data.length) setActive(res.data[0]);
    }).catch(() => {});
  }, []);

  const loadMessages = (id) => api.get(`/messages/${id}`).then((res) => setMessages(res.data)).catch(() => {});

  useEffect(() => {
    if (active) loadMessages(active.id);
  }, [active]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const content = text;
    setText("");
    try {
      await api.post("/messages", { recipient_id: active.id, content });
      loadMessages(active.id);
    } catch (e) {}
  };

  return (
    <div data-testid="messaging-page">
      <p className="text-xs uppercase tracking-[0.15em] font-semibold text-zinc-500">Communication</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 mt-1 mb-8">Messagerie</h1>

      <div className="bg-white border border-zinc-200 rounded-md grid grid-cols-1 md:grid-cols-3 h-[560px] overflow-hidden">
        {/* Contacts */}
        <div className="border-r border-zinc-200 overflow-y-auto" data-testid="contacts-list">
          {contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              data-testid={`contact-${c.id}`}
              className={`w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${active?.id === c.id ? "bg-zinc-100 border-l-2 border-l-[#002FA7]" : ""}`}
            >
              <p className="font-medium text-zinc-900 text-sm">{c.name}</p>
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">{ROLE_LABEL[c.role]}</p>
            </button>
          ))}
          {contacts.length === 0 && <p className="p-4 text-sm text-zinc-400">Aucun contact</p>}
        </div>

        {/* Chat */}
        <div className="md:col-span-2 flex flex-col">
          {active ? (
            <>
              <div className="px-5 py-3 border-b border-zinc-200">
                <p className="font-medium text-zinc-900">{active.name}</p>
                <p className="text-xs text-zinc-500">{ROLE_LABEL[active.role]}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FAFAFA]" data-testid="messages-area">
                {messages.map((m) => {
                  const mine = m.sender_id === user.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-md text-sm ${mine ? "bg-[#002FA7] text-white" : "bg-white border border-zinc-200 text-zinc-800"}`}>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && <p className="text-center text-sm text-zinc-400 mt-8">Démarrez la conversation</p>}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-zinc-200 flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Votre message…"
                  className="rounded-md"
                  data-testid="message-input"
                />
                <Button onClick={send} className="bg-[#002FA7] hover:bg-[#00227A] rounded-md" data-testid="send-message-button">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400">Sélectionnez un contact</div>
          )}
        </div>
      </div>
    </div>
  );
}
