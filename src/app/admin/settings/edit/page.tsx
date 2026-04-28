"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

const DOC_MAP: Record<string, { key: string, title: string }> = {
  policies: { key: "policies_content", title: "Política y Condiciones" },
  terms: { key: "terms_content", title: "Términos de Servicio" },
  contract: { key: "contract_content", title: "Contrato de Servicios" },
  about: { key: "about_us_content", title: "Acerca de Nosotros" }
};

function EditorContent() {
  const searchParams = useSearchParams();
  const docType = searchParams.get("doc") || "policies";
  const docConfig = DOC_MAP[docType] || DOC_MAP["policies"];

  const [initialContent, setInitialContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      loadContent();
    });
    
    return () => unsubscribe();
  }, [router, docType]);

  useEffect(() => {
    if (!isLoading && editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [isLoading, initialContent]);

  const loadContent = async () => {
    try {
      const docRef = doc(db, "settings", "admin");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setInitialContent(docSnap.data()[docConfig.key] || "");
      }
      setIsLoading(false);
    } catch (err) {
      console.error(`Error loading ${docType}:`, err);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editorRef.current) return;
    setIsSaving(true);
    try {
      const content = editorRef.current.innerHTML;
      const docRef = doc(db, "settings", "admin");
      await updateDoc(docRef, {
        [docConfig.key]: content
      });
      setToast({ message: "¡Documento guardado con éxito!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(`Error saving ${docType}:`, err);
      setToast({ message: "Error al guardar los cambios.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#0c1324] text-white flex items-center justify-center h-screen font-['Inter']">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-cyan-500 text-sm animate-pulse">edit</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-[.3em] font-bold">Cargando Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c1324] text-slate-200 h-screen overflow-hidden flex flex-col font-['Inter'] selection:bg-cyan-500/30">
      {/* Top Header */}
      <header className="h-14 border-b border-white/5 bg-[#0c1324] px-4 md:px-6 flex items-center justify-between z-[60] shadow-2xl flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <button className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black uppercase tracking-[.2em] text-[#89ceff]">
              Editor de Documentos <span className="text-slate-600 ml-2">|</span>
            </h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{docConfig.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              isSaving 
              ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
              : "bg-cyan-500 text-[#0c1324] hover:bg-cyan-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_5px_15px_rgba(6,182,212,0.3)]"
            }`}
          >
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </header>

      {/* Editor Main */}
      <main className="flex-1 overflow-y-auto bg-[#1a1f2c] py-12 px-4 md:px-8 custom-scrollbar">
        <div className="max-w-[850px] mx-auto min-h-full flex flex-col">
          <div className="relative flex-1">
            <div className="absolute -inset-1 bg-cyan-500/5 rounded-sm blur-2xl opacity-20"></div>
            <div 
              className="relative bg-white text-[#1a1f2c] min-h-[1100px] shadow-[0_30px_60px_rgba(0,0,0,0.4)] p-12 md:p-20 lg:p-24 focus:outline-none rounded-sm"
              contentEditable
              spellCheck={false}
              suppressContentEditableWarning
              ref={editorRef}
              style={{ 
                wordBreak: 'break-word',
                outline: 'none',
              }}
            />
          </div>
          <div className="mt-8 mb-12 flex justify-between items-center text-slate-600 text-[9px] font-bold uppercase tracking-widest">
            <p>Sneyder Studio © 2026</p>
            <p>Documento Activo: {docConfig.title}</p>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-10 right-10 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up border ${
          toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <span className="material-symbols-outlined">{toast.type === "success" ? "check_circle" : "error"}</span>
          <p className="font-bold text-[10px] uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

      <style jsx global>{`
        [contenteditable] h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; color: #0c1324; border-bottom: 3px solid #f1f5f9; padding-bottom: 0.75rem; }
        [contenteditable] h2 { font-size: 1.75rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 1.25rem; color: #1e293b; }
        [contenteditable] p { margin-bottom: 1.5rem; line-height: 1.8; color: #334155; }
        [contenteditable] ul { list-style-type: disc; margin-left: 2rem; margin-bottom: 1.5rem; }
        [contenteditable] ol { list-style-type: decimal; margin-left: 2rem; margin-bottom: 1.5rem; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0c1324; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; border: 4px solid #0c1324; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}

export default function EditDocumentPage() {
  return (
    <Suspense fallback={<div className="bg-[#0c1324] h-screen w-full"></div>}>
      <EditorContent />
    </Suspense>
  );
}
