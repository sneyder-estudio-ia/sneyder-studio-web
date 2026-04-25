"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";
import Image from "next/image";
import Link from "next/link";

const DEFAULT_SETTINGS = {
  contact_email: "contacto@sneyder.studio",
  contact_phone: "+52 000 000 0000",
  whatsapp: "wa.me/520000000000",
  address: "Madrid, España",
  business_hours: "Lunes a Viernes 9:00 AM - 6:00 PM",
  facebook_url: "",
  instagram_url: "",
  linkedin_url: "",
  github_url: "",
  policies_content: "",
  terms_content: "",
  contract_content: "",
  about_us_content: ""
};

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function AdminSettingsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace('/');
        return;
      }
      setIsChecking(false);
      loadSettings();
    });
    
    return () => unsubscribe();
  }, [router]);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, "settings", "admin");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data
        });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "admin"), settings);
      setToast({ message: "¡Ajustes guardados correctamente!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setToast({ message: "Error al guardar los ajustes.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isChecking) {
    return (
      <div className="bg-background text-on-background flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 p-2 rounded transition-all"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="ml-1 h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
              <Image 
                src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
                alt="Sneyder Studio"
                width={150}
                height={32}
                className="h-full w-auto object-contain group-hover:brightness-110"
              />
            </div>
            <div className="h-6 w-px bg-white/10 mx-2 hidden sm:block"></div>
            <h1 className="font-['Space_Grotesk'] tracking-tight text-lg font-bold text-[#89ceff] whitespace-nowrap uppercase">
              Ajuste
            </h1>
            <Link href="/admin" className="ml-2">
              <button className="text-[#89ceff] p-1 hover:bg-slate-800/50 rounded transition-all transform -scale-x-100">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Content */}
      <main className={`flex-1 pt-24 pb-20 px-4 md:px-12 transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-headline font-bold text-white mb-2">Configuración General</h2>
            <p className="text-slate-400 text-sm">Gestiona la información pública de contacto y redes sociales.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Contact Section */}
            <section className="bg-surface-container-low border border-[#45464d]/15 rounded-xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-8xl text-tertiary">contact_page</span>
              </div>
              <h3 className="text-tertiary text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-4 h-px bg-tertiary/30"></span>
                Información de contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Correo Electrónico</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">mail</span>
                    <input 
                      type="text"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                      placeholder="admin@ejemplo.com"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Número de Teléfono</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">call</span>
                    <input 
                      type="tel"
                      value={settings.contact_phone}
                      onChange={(e) => setSettings({...settings, contact_phone: e.target.value})}
                      placeholder="+52 000 000 0000"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">WhatsApp</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">chat</span>
                    <input 
                      type="text"
                      value={settings.whatsapp}
                      onChange={(e) => setSettings({...settings, whatsapp: e.target.value})}
                      placeholder="wa.me/..."
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Dirección Física</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">location_on</span>
                    <input 
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({...settings, address: e.target.value})}
                      placeholder="Calle, Ciudad, País"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Business Section */}
            <section className="bg-surface-container-low border border-[#45464d]/15 rounded-xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-[#2fd9f4]">
                <span className="material-symbols-outlined text-8xl">schedule</span>
              </div>
              <h3 className="text-tertiary text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-4 h-px bg-tertiary/30"></span>
                Operación
              </h3>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Horarios de Atención</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">event_note</span>
                  <input 
                    type="text"
                    value={settings.business_hours}
                    onChange={(e) => setSettings({...settings, business_hours: e.target.value})}
                    placeholder="Lun-Vie 9:00 AM - 6:00 PM"
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                  />
                </div>
              </div>
            </section>

            {/* Social Section */}
            <section className="bg-surface-container-low border border-[#45464d]/15 rounded-xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-pink-500">
                <span className="material-symbols-outlined text-8xl">share</span>
              </div>
              <h3 className="text-tertiary text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-4 h-px bg-tertiary/30"></span>
                Redes Sociales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Facebook</label>
                  <input 
                    type="text"
                    value={settings.facebook_url}
                    onChange={(e) => setSettings({...settings, facebook_url: e.target.value})}
                    placeholder="https://facebook.com/..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Instagram</label>
                  <input 
                    type="text"
                    value={settings.instagram_url}
                    onChange={(e) => setSettings({...settings, instagram_url: e.target.value})}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">LinkedIn</label>
                  <input 
                    type="text"
                    value={settings.linkedin_url}
                    onChange={(e) => setSettings({...settings, linkedin_url: e.target.value})}
                    placeholder="https://linkedin.com/..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">GitHub</label>
                  <input 
                    type="text"
                    value={settings.github_url}
                    onChange={(e) => setSettings({...settings, github_url: e.target.value})}
                    placeholder="https://github.com/..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs shadow-inner"
                  />
                </div>
              </div>
            </section>

            {/* Legal Documents Section - Editable */}
            <section className="bg-surface-container-low border border-[#45464d]/15 rounded-xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-tertiary">
                <span className="material-symbols-outlined text-8xl">gavel</span>
              </div>
              <h3 className="text-tertiary text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-4 h-px bg-tertiary/30"></span>
                Documentación Corporativa
              </h3>
              
              <div className="space-y-8">
                {/* Política y Condiciones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-headline">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">description</span>
                       Política y Condiciones
                    </label>
                    <Link href="/politicas" target="_blank" className="text-[8px] font-bold text-tertiary uppercase tracking-widest hover:underline flex items-center gap-1">
                      Ver página <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </Link>
                  </div>
                  <textarea 
                    value={settings.policies_content}
                    onChange={(e) => setSettings({...settings, policies_content: e.target.value})}
                    placeholder="Contenido de políticas..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs font-mono min-h-[150px] transition-all shadow-inner leading-relaxed"
                  />
                </div>

                {/* Términos de Servicio */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-headline">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">gavel</span>
                       Términos de Servicio
                    </label>
                    <Link href="/terminos" target="_blank" className="text-[8px] font-bold text-tertiary uppercase tracking-widest hover:underline flex items-center gap-1">
                      Ver página <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </Link>
                  </div>
                  <textarea 
                    value={settings.terms_content}
                    onChange={(e) => setSettings({...settings, terms_content: e.target.value})}
                    placeholder="Contenido de términos..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs font-mono min-h-[150px] transition-all shadow-inner leading-relaxed"
                  />
                </div>

                {/* Contrato de Servicios */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-headline">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">history_edu</span>
                       Contrato de Servicios
                    </label>
                    <Link href="/contrato" target="_blank" className="text-[8px] font-bold text-tertiary uppercase tracking-widest hover:underline flex items-center gap-1">
                      Ver página <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </Link>
                  </div>
                  <textarea 
                    value={settings.contract_content}
                    onChange={(e) => setSettings({...settings, contract_content: e.target.value})}
                    placeholder="Contenido del contrato..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs font-mono min-h-[150px] transition-all shadow-inner leading-relaxed"
                  />
                </div>

                {/* Acerca de Nosotros */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between font-headline">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">info</span>
                       Acerca de Nosotros
                    </label>
                    <Link href="/nosotros" target="_blank" className="text-[8px] font-bold text-tertiary uppercase tracking-widest hover:underline flex items-center gap-1">
                      Ver página <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                    </Link>
                  </div>
                  <textarea 
                    value={settings.about_us_content}
                    onChange={(e) => setSettings({...settings, about_us_content: e.target.value})}
                    placeholder="Contenido de nosotros..."
                    className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 px-4 text-xs font-mono min-h-[150px] transition-all shadow-inner leading-relaxed"
                  />
                </div>
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex justify-end pt-6">
              <button 
                type="submit"
                disabled={isSaving}
                className={`py-4 px-10 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center gap-3 transition-all ${
                  isSaving 
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                  : "bg-tertiary text-on-tertiary hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(47,217,244,0.3)] hover:shadow-tertiary/50"
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-5 h-5 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin"></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Guardar Ajustes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-10 right-10 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up border ${
          toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <span className="material-symbols-outlined">{toast.type === "success" ? "check_circle" : "error"}</span>
          <p className="font-bold text-xs uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

      {/* Bottom Bar Mobile */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full bg-[#0c1324]/90 backdrop-blur-xl border-t border-[#45464d]/15 p-4 flex justify-around items-center z-40">
         <Link href="/admin" className="text-slate-500 hover:text-tertiary transition-colors">
            <span className="material-symbols-outlined">dashboard</span>
         </Link>
         <button onClick={() => handleSave()} className="bg-tertiary text-on-tertiary p-3 rounded-full shadow-lg shadow-tertiary/30">
            <span className="material-symbols-outlined">save</span>
         </button>
         <Link href="/admin/profile" className="text-slate-500 hover:text-tertiary transition-colors">
            <span className="material-symbols-outlined">person</span>
         </Link>
      </footer>

      <style jsx>{`
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
