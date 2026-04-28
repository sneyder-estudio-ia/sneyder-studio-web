"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
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
  about_us_content: "",
  credit_annual_interest: "60",
  credit_monthly_interest: "5",
  credit_late_fee: "2",
  credit_min_down_payment: "30",
  contract_representative: "Sneyder José",
  contract_company_id: "",
  contract_company_name: "Sneyder Studio",
  contract_location: "San José, Costa Rica"
};

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function AdminSettingsPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
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
      setToast({ message: "¡Ajustes guardados! Ahora Eva está sincronizando la documentación...", type: "info" });
      
      // Sincronizar automáticamente con Eva para que los cambios se reflejen en los documentos legales
      await handleCorrectByEva();
      
      setToast({ message: "¡Todo actualizado! Ajustes y documentos legales sincronizados.", type: "success" });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setToast({ message: "Error al guardar los ajustes.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCorrectByEva = async () => {
    setIsCorrecting(true);
    setToast({ message: "Eva está analizando y corrigiendo tus documentos...", type: "info" });
    try {
      const res = await fetch("/api/admin/correct-legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || "Error en la corrección");
      }
      
      const result = await res.json();
      if (result.success) {
        const updatedSettings = { ...settings, ...result.data };
        setSettings(updatedSettings);
        
        // Guardamos explícitamente en la base de datos desde el lado del cliente (sin requerir permisos de admin)
        const docRef = doc(db, "settings", "admin");
        await updateDoc(docRef, updatedSettings);

        setToast({ message: "¡Eva ha corregido y guardado todos los documentos profesionalmente!", type: "success" });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "Hubo un error al intentar corregir con Eva.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsCorrecting(false);
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
      <header className={`fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-6 h-16 shadow-[0_20px_50px_rgba(12,19,36,0.4)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-72" : "pl-0"}`}>
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <button className="text-[#89ceff] p-1 hover:bg-slate-800/50 rounded transition-all transform -scale-x-100">
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </Link>
          <h1 className="font-['Space_Grotesk'] tracking-tight text-lg font-bold text-[#89ceff] whitespace-nowrap uppercase">
            Ajuste
          </h1>
        </div>

        <div className="flex items-center">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-[#2fd9f4] hover:bg-slate-800/50 p-2 rounded transition-all"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
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

            {/* Credit & Contract Settings Section */}
            <section className="bg-surface-container-low border border-[#45464d]/15 rounded-xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-tertiary">
                <span className="material-symbols-outlined text-8xl text-cyan-500">payments</span>
              </div>
              <h3 className="text-tertiary text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-4 h-px bg-tertiary/30"></span>
                Crédito y Contrato
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Interés Anual (%)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">percent</span>
                    <input 
                      type="text"
                      value={settings.credit_annual_interest}
                      onChange={(e) => setSettings({...settings, credit_annual_interest: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Interés Mensual (%)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">calendar_month</span>
                    <input 
                      type="text"
                      value={settings.credit_monthly_interest}
                      onChange={(e) => setSettings({...settings, credit_monthly_interest: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Cargo Pago Tardío (%)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">warning</span>
                    <input 
                      type="text"
                      value={settings.credit_late_fee}
                      onChange={(e) => setSettings({...settings, credit_late_fee: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Pago Inicial Mínimo (%)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">payments</span>
                    <input 
                      type="text"
                      value={settings.credit_min_down_payment}
                      onChange={(e) => setSettings({...settings, credit_min_down_payment: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Representante Legal</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">person</span>
                    <input 
                      type="text"
                      value={settings.contract_representative}
                      onChange={(e) => setSettings({...settings, contract_representative: e.target.value})}
                      placeholder="Nombre del representante"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Nombre de la Empresa (Contrato)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">business</span>
                    <input 
                      type="text"
                      value={settings.contract_company_name}
                      onChange={(e) => setSettings({...settings, contract_company_name: e.target.value})}
                      placeholder="Nombre legal de la empresa"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">ID Fiscal / RIF (Opcional)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">badge</span>
                    <input 
                      type="text"
                      value={settings.contract_company_id}
                      onChange={(e) => setSettings({...settings, contract_company_id: e.target.value})}
                      placeholder="ID Fiscal"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Lugar de Celebración (Contrato)</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg group-focus-within:text-tertiary transition-colors">location_city</span>
                    <input 
                      type="text"
                      value={settings.contract_location}
                      onChange={(e) => setSettings({...settings, contract_location: e.target.value})}
                      placeholder="Ej: Madrid, España"
                      className="w-full bg-[#0c1324] border border-[#45464d]/30 focus:border-tertiary outline-none rounded-lg py-3 pl-12 pr-4 text-sm transition-all shadow-inner"
                    />
                  </div>
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
              
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-tertiary text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="w-4 h-px bg-tertiary/30"></span>
                  Ajuste de Documentación Corporativa
                </h3>
                
                <button 
                  type="button"
                  onClick={handleCorrectByEva}
                  disabled={isCorrecting}
                  className={`relative z-10 px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 group shadow-lg ${
                    isCorrecting 
                    ? "bg-slate-800 border-slate-700 text-slate-500 cursor-wait" 
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-[#0c1324] shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                  }`}
                >
                  <span className={`material-symbols-outlined text-sm ${isCorrecting ? 'animate-spin' : 'group-hover:animate-pulse'}`}>
                    {isCorrecting ? 'sync' : 'auto_fix_high'}
                  </span>
                  {isCorrecting ? 'Corrigiendo...' : 'Corregir por Eva'}
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Política y Condiciones */}
                <div className="space-y-4">
                  <Link href="/admin/settings/edit?doc=policies" className="block group">
                    <button type="button" className="w-full bg-[#0c1324] border border-[#45464d]/30 hover:border-tertiary/50 hover:bg-[#162035] transition-all rounded-xl p-5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl">description</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold uppercase tracking-widest text-white">Política y Condiciones</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Editar a pantalla completa</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-tertiary/50 group-hover:text-tertiary uppercase tracking-widest transition-colors hidden md:block">Abrir Editor</span>
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-tertiary transition-colors">open_in_new</span>
                      </div>
                    </button>
                  </Link>
                </div>

                {/* Términos de Servicio */}
                <div className="space-y-4">
                  <Link href="/admin/settings/edit?doc=terms" className="block group">
                    <button type="button" className="w-full bg-[#0c1324] border border-[#45464d]/30 hover:border-tertiary/50 hover:bg-[#162035] transition-all rounded-xl p-5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl">gavel</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold uppercase tracking-widest text-white">Términos de Servicio</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Editar a pantalla completa</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-tertiary/50 group-hover:text-tertiary uppercase tracking-widest transition-colors hidden md:block">Abrir Editor</span>
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-tertiary transition-colors">open_in_new</span>
                      </div>
                    </button>
                  </Link>
                </div>

                {/* Contrato de Servicios */}
                <div className="space-y-4">
                  <Link href="/admin/settings/edit?doc=contract" className="block group">
                    <button type="button" className="w-full bg-[#0c1324] border border-[#45464d]/30 hover:border-tertiary/50 hover:bg-[#162035] transition-all rounded-xl p-5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl">history_edu</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold uppercase tracking-widest text-white">Contrato de Servicios</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Editar a pantalla completa</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-tertiary/50 group-hover:text-tertiary uppercase tracking-widest transition-colors hidden md:block">Abrir Editor</span>
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-tertiary transition-colors">open_in_new</span>
                      </div>
                    </button>
                  </Link>
                </div>

                {/* Acerca de Nosotros */}
                <div className="space-y-4">
                  <Link href="/admin/settings/edit?doc=about" className="block group">
                    <button type="button" className="w-full bg-[#0c1324] border border-[#45464d]/30 hover:border-tertiary/50 hover:bg-[#162035] transition-all rounded-xl p-5 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl">info</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold uppercase tracking-widest text-white">Acerca de Nosotros</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Editar a pantalla completa</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-tertiary/50 group-hover:text-tertiary uppercase tracking-widest transition-colors hidden md:block">Abrir Editor</span>
                        <span className="material-symbols-outlined text-slate-500 group-hover:text-tertiary transition-colors">open_in_new</span>
                      </div>
                    </button>
                  </Link>
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
          toast.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : 
          toast.type === "info" ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" :
          "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <span className="material-symbols-outlined">{toast.type === "success" ? "check_circle" : toast.type === "info" ? "smart_toy" : "error"}</span>
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
