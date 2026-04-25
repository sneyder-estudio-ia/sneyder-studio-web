"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

const SLUG_MAP: Record<string, string> = {
  politicas: "Política y Condiciones",
  terminos: "Términos de Servicio",
  contrato: "Contrato de Servicios",
  nosotros: "Acerca de Nosotros",
};

export default function LegalEditorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const title = SLUG_MAP[slug] || "Documento Legal";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace("/");
        return;
      }
      setIsChecking(false);
      loadContent();
    });
    return () => unsubscribe();
  }, [router, slug]);

  const loadContent = async () => {
    try {
      const docRef = doc(db, "legal", slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent(docSnap.data().content || "");
      }
    } catch (err) {
      console.error("Error loading legal content:", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "legal", slug), {
        content,
        updated_at: new Date().toISOString(),
      });
      setToast({ message: "¡Documento guardado correctamente!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Error saving legal content:", err);
      setToast({ message: "Error al guardar el documento.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking) return null;

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
       <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/85 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 border-b border-white/5 transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#2fd9f4] p-2 hover:bg-white/5 rounded-lg transition-all">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          <div className="flex items-center gap-2">
            <Link href="/admin/settings">
              <button className="text-[#89ceff] p-1.5 hover:bg-white/5 rounded-lg transition-all flex items-center">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
              </button>
            </Link>
            <h1 className="font-headline tracking-wider text-sm font-bold text-white uppercase ml-2">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg ${
              isSaving 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-tertiary text-on-tertiary hover:brightness-110 active:scale-95 shadow-tertiary/20"
            }`}
          >
            {isSaving ? <span className="w-3 h-3 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin"></span> : <span className="material-symbols-outlined text-sm">save</span>}
            {isSaving ? "Guardando" : "Guardar"}
          </button>
        </div>
      </header>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      <main className={`flex-1 pt-24 pb-20 px-4 md:px-8 transition-all duration-300 ${isMenuOpen ? "md:pl-72 lg:pl-80" : ""}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-bold text-white mb-2">Editor de Documentación</h2>
            <p className="text-slate-400 text-xs tracking-wide">Actualiza el contenido legal que se muestra a los usuarios.</p>
          </div>

          <div className="bg-surface-container-low border border-[#45464d]/20 rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="bg-[#0c1324]/80 px-6 py-3 border-b border-[#45464d]/15 flex items-center justify-between backdrop-blur-sm">
               <div className="flex items-center gap-4">
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#2fd9f4]">Workspace</span>
                 <div className="h-4 w-px bg-[#45464d]/30"></div>
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{slug}.md</span>
               </div>
               <div className="flex gap-1.5">
                 <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40"></div>
               </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido aquí..."
              className="w-full h-[65vh] bg-[#0c1324] text-slate-300 p-8 md:p-10 outline-none resize-none font-mono text-xs md:text-sm leading-8 custom-scrollbar border-none focus:ring-0"
              spellCheck={false}
            />
          </div>
        </div>
      </main>

      {toast && (
        <div className={`fixed bottom-10 right-10 z-[100] px-8 py-5 rounded-2xl shadow-3xl flex items-center gap-4 animate-slide-up border backdrop-blur-xl ${
          toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
        }`}>
          <span className="material-symbols-outlined text-xl">{toast.type === "success" ? "verified" : "error"}</span>
          <p className="font-bold text-[10px] uppercase tracking-[0.2em]">{toast.message}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0c1324;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}
