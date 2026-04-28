"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection } from "firebase/firestore";

export default function ClientProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    manager_name: "",
    company_name: "",
    whatsapp: "",
    test_payment_active: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (!isLoading) router.replace('/');
        return;
      }
      setUser(currentUser);
      
      try {
        const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          setFormData({
            manager_name: profile.manager_name || currentUser.displayName || "",
            company_name: profile.company_name || "",
            whatsapp: profile.whatsapp || "",
            test_payment_active: profile.test_payment_active || false,
          });
        } else {
          setFormData({
            manager_name: currentUser.displayName || "",
            company_name: "",
            whatsapp: "",
            test_payment_active: false,
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, isLoading]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Check if profile is being completed for the first time
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      const isFirstTime = !profileDoc.exists() || !profileDoc.data()?.manager_name;

      await setDoc(doc(db, 'profiles', user.uid), {
        id: user.uid,
        manager_name: formData.manager_name,
        company_name: formData.company_name,
        whatsapp: formData.whatsapp,
        email: user.email,
        updated_at: new Date().toISOString()
      }, { merge: true });

      if (isFirstTime && formData.manager_name) {
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "¡Perfil Completado!",
          message: "Gracias por completar tu perfil. Ahora tienes acceso total a nuestro ecosistema de IA. Explora tus pedidos o inicia un nuevo proyecto.",
          type: "welcome",
          isRead: false,
          createdAt: new Date()
        });
      }

      setSaveMessage("Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (error: any) {
      setSaveMessage("Error al guardar: " + error.message);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="bg-[#0a0e1a] text-white flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></span>
          <p className="text-xs text-slate-500 uppercase tracking-widest">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const displayName = formData.manager_name || user?.displayName || user?.email?.split('@')[0] || "Usuario";

  return (
    <div className="bg-[#0a0e1a] text-white min-h-screen selection:bg-cyan-400/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0c1324]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-0">
          <Link href="/">
            <button className="text-cyan-400 hover:scale-110 transition-transform p-1 rounded-full hover:bg-white/5">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          </Link>
          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>
          <Link href="/" className="h-9 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
            <Image 
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              width={120}
              height={24}
              className="h-full w-auto object-contain group-hover:brightness-110"
            />
          </Link>
          <h1 className="text-sm font-bold tracking-tight uppercase font-headline text-cyan-400 ml-2 hidden xs:block">Mi Perfil</h1>
        </div>
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400/20 transition-all"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-white/10 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-400 text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-300 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">{isSaving ? "sync" : "save"}</span>
                {isSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Save Message Toast */}
      {saveMessage && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl text-sm font-bold shadow-2xl animate-slide-up ${
          saveMessage.includes("Error") 
            ? "bg-red-500/20 border border-red-500/30 text-red-400" 
            : "bg-green-500/20 border border-green-500/30 text-green-400"
        }`}>
          {saveMessage}
        </div>
      )}

      <main className="pt-24 pb-32 px-5 max-w-2xl mx-auto">
        {/* Prueba de Pago Alert */}
        {formData && (formData as any).test_payment_active && (
          <div className="mb-8 bg-gradient-to-br from-tertiary/20 to-tertiary/5 border border-tertiary/30 rounded-2xl p-6 shadow-2xl animate-pulse-slow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center border border-tertiary/30 shrink-0">
                <span className="material-symbols-outlined text-tertiary text-2xl">priority_high</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white font-headline uppercase tracking-tight mb-1">Prueba de Pago Pendiente</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Se ha habilitado una transacción de prueba de <span className="text-tertiary font-bold">$1.00 USD</span> para verificar tu cuenta. Por favor, finaliza el proceso para continuar.
                </p>
                <Link href="/admin/test-payment">
                  <button className="w-full sm:w-auto px-8 py-3 bg-tertiary text-on-tertiary rounded-xl font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-tertiary/20 flex items-center justify-center gap-3">
                    Realizar Pago de Prueba
                    <span className="material-symbols-outlined text-sm">payments</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[#111827]/80 border border-white/5 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-cyan-400/30 flex items-center justify-center overflow-hidden shrink-0">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-4xl text-cyan-400">person</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold font-headline truncate">{displayName}</h2>
              <p className="text-xs text-cyan-400 uppercase tracking-widest mt-1">Cliente Activo</p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="bg-[#111827]/80 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-cyan-400">badge</span>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Información Personal</h3>
            </div>
            <div className="space-y-5">
              {/* Nombre */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Nombre completo</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-400 outline-none transition-all"
                    placeholder="Tu nombre completo"
                  />
                ) : (
                  <p className="text-sm font-medium py-3 px-4 bg-white/[0.02] rounded-lg border border-transparent">{formData.manager_name || "Sin definir"}</p>
                )}
              </div>

              {/* Email (solo lectura) */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Email</label>
                <p className="text-sm font-medium py-3 px-4 bg-white/[0.02] rounded-lg border border-transparent text-slate-400">{user?.email || ""}</p>
                {isEditing && (
                  <p className="text-[9px] text-slate-600 mt-1 italic">El email no se puede cambiar</p>
                )}
              </div>

              {/* Empresa */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Empresa</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-400 outline-none transition-all"
                    placeholder="Nombre de tu empresa"
                  />
                ) : (
                  <p className="text-sm font-medium py-3 px-4 bg-white/[0.02] rounded-lg border border-transparent">{formData.company_name || "Sin definir"}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">WhatsApp</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-cyan-400 outline-none transition-all"
                    placeholder="+57 300 000 0000"
                  />
                ) : (
                  <p className="text-sm font-medium py-3 px-4 bg-white/[0.02] rounded-lg border border-transparent">{formData.whatsapp || "Sin definir"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-[#111827]/80 border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-cyan-400">verified</span>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado de la Cuenta</h3>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-green-400">Cuenta verificada y activa</span>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500/10 border border-red-500/20 text-red-400 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}
