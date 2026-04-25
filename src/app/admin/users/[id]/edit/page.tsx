"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AdminSidebar from "@/components/AdminSidebar";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: PageProps) {
  const { id } = use(params);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    manager_name: "",
    email: "",
    company_name: "",
    whatsapp: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
        router.replace("/");
        return;
      }
      setIsAdmin(true);
      fetchUserProfile();
    });

    return () => unsubscribe();
  }, [router, id]);

  const fetchUserProfile = async () => {
    try {
      const docRef = doc(db, "profiles", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          manager_name: data.manager_name || "",
          email: data.email || "",
          company_name: data.company_name || "",
          whatsapp: data.whatsapp || "",
        });
      } else {
        setMessage({ type: "error", text: "Usuario no encontrado" });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setMessage({ type: "error", text: "Error al cargar los datos" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const docRef = doc(db, "profiles", id);
      await updateDoc(docRef, {
        ...formData,
        updated_at: new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Usuario actualizado correctamente" });
      setTimeout(() => router.push("/admin/users"), 1500);
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Error al actualizar el usuario" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
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
    <div className="bg-background text-on-background selection:bg-tertiary selection:text-on-tertiary flex flex-col min-h-screen">
      {/* TopAppBar */}
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 transition-all duration-300 p-2 rounded shrink-0"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          <h1 className="font-['Space_Grotesk'] tracking-tight text-lg md:text-xl font-bold text-[#89ceff] truncate">
            Editar Usuario - Sneyder Studio
          </h1>
        </div>
      </header>

      {/* Main Canvas */}
      <main className={`pt-24 pb-28 px-4 md:px-6 max-w-3xl mx-auto w-full flex-grow transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : ""}`}>
        
        {/* Navigation */}
        <div className="mb-8 animate-fade-in">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 text-slate-400 hover:text-tertiary transition-colors group inline-flex"
          >
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
            <span className="text-sm font-bold uppercase tracking-widest">Volver al listado</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-surface-container-low rounded-2xl border border-white/5 p-20 flex flex-col items-center justify-center gap-4">
            <span className="w-10 h-10 border-2 border-tertiary/30 border-t-tertiary rounded-full animate-spin"></span>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando información...</p>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            className="bg-surface-container-low rounded-2xl border border-white/5 p-8 md:p-10 shadow-2xl space-y-8 animate-fade-in"
          >
            <div>
              <h2 className="text-2xl font-bold text-white font-headline tracking-tighter mb-2">Información del Perfil</h2>
              <p className="text-slate-400 text-sm">Modifica los datos del usuario. Los cambios se aplicarán instantáneamente.</p>
            </div>

            {message.text && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-error/10 text-error border border-error/20'}`}>
                <span className="material-symbols-outlined text-xl">
                  {message.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Nombre del Gestor" 
                  name="manager_name" 
                  value={formData.manager_name} 
                  onChange={handleInputChange} 
                  placeholder="Ej. Juan Pérez"
                  icon="person"
                />
                <InputField 
                  label="Correo Electrónico" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="ejemplo@correo.com"
                  icon="mail"
                  type="email"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Empresa" 
                  name="company_name" 
                  value={formData.company_name} 
                  onChange={handleInputChange} 
                  placeholder="Ej. Mi Empresa S.A."
                  icon="business"
                />
                <InputField 
                  label="WhatsApp / Teléfono" 
                  name="whatsapp" 
                  value={formData.whatsapp} 
                  onChange={handleInputChange} 
                  placeholder="+34 000 000 000"
                  icon="call"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin/users")}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-[2] py-4 bg-tertiary text-on-tertiary text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <span className="w-5 h-5 border-2 border-on-tertiary/30 border-t-on-tertiary rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <AdminSidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, icon, type = "text" }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; icon: string; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl transition-colors group-focus-within:text-tertiary">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-slate-800/40 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary transition-all"
          required
        />
      </div>
    </div>
  );
}
