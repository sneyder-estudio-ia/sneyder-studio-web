"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getCMSData } from "@/lib/cms";
import { getAdminSettings } from "@/lib/settings";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function ContactoPage() {
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [showModal, setShowModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [wantsCredit, setWantsCredit] = useState(false);
  const [creditMonths, setCreditMonths] = useState(6);
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [paymentDay, setPaymentDay] = useState(1);
  const [adminSettings, setAdminSettings] = useState<any>(null);

  const calculateMonthlyPayment = () => {
    const budgetValue = parseFloat(estimatedBudget) || 0;
    if (budgetValue === 0) return 0;
    const totalWithInterest = budgetValue * 1.05;
    return (totalWithInterest / creditMonths).toFixed(2);
  };

  useEffect(() => {
    const loadContent = async () => {
      const dbData = await getCMSData();
      setData(dbData);
      const settings = await getAdminSettings();
      setAdminSettings(settings);
    };
    loadContent();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', currentUser.uid));
          if (profileDoc.exists()) {
            setUserProfile(profileDoc.data());
          }
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setIsMenuOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setFormStatus('sending');
    setTimeout(() => {
      setFormStatus('success');
      setShowModal(true);
      setTimeout(() => {
        setFormStatus('idle');
      }, 5000);
    }, 1500);
  };

  if (!data) return (
    <div className="bg-background min-h-screen flex items-center justify-center text-center px-6">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 mb-4">
          <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio Logo" fill className="object-contain animate-pulse" />
        </div>
        <div className="w-16 h-1 bg-tertiary/20 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-tertiary animate-loading-bar"></div>
        </div>
        <span className="text-tertiary font-bold tracking-[0.5em] uppercase text-[10px]">Preparando canales de comunicación...</span>
      </div>
    </div>
  );

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-6 h-16 shadow-[0px_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-cyan-400 hover:bg-slate-800 p-1 rounded-full transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link href="/" className="h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
            <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio" width={140} height={28} className="h-full w-auto object-contain group-hover:brightness-110" />
          </Link>
        </div>
        {user ? (
          <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container border border-cyan-400/30">
            <Image alt="User Avatar" src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCO8RUk1wD7WV7O7IKZ_NBnLhlsnuVdHeC9x_CyLRsEpavDT9Qu9rC4-F4JAFIMwExYTNXtPsW04RAgXxe2vZ_1xgd0Wpqlz62JTPKFItouFbiVzuuvaA3Jr4zodwxrF3k5SScHvPKbmmQvNvCnMsjMY1m7yzSHBq-NVdD2N3qaTUfNHCwYii6gD_VVnTZrwbjzB-EmuUn_Y4QYasiBWkPdcLN2PPRgr4tyrGNvjDYnaz1WSLw73itY4B6zTZAWRKzhDVirP2Wyrcw"} width={32} height={32} />
          </div>
        ) : (
          <Link href="/" className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all">Acceder</Link>
        )}
      </header>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-[70] h-[100dvh] w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 overflow-hidden ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
              {user ? (
                <Image alt="User Profile Avatar" src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"} width={48} height={48} />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>
              )}
            </div>
            <div>
              <p className="font-bold text-white truncate max-w-[150px]">{userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Visitante"}</p>
              <p className="text-xs text-cyan-400 uppercase tracking-widest">{user ? "Premium Account" : "Modo Invitado"}</p>
            </div>
          </div>
          <Link href="/" className="relative w-full h-16 mb-8 cursor-pointer hover:scale-[1.02] transition-all bg-white/5 rounded-2xl border border-white/10 overflow-hidden p-3 shadow-xl group">
            <Image src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png" alt="Sneyder Studio" fill className="object-contain object-left group-hover:brightness-110" />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavItem icon="home" label="Inicio" href="/" />
          <NavItem icon="account_circle" label="Perfil de usuario" href="/profile" />
          {user?.email === ADMIN_EMAIL && <NavItem icon="settings" label="Administración" href="/admin" />}
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/mis-pedidos" />
          <NavItem icon="bolt" label="Servicios" href="/servicios" />
          <NavItem icon="psychology" label="Modelo de IA" href="/ia-models" />
          <NavItem icon="mail" label="Contacto" href="/contacto" active />
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/contrato" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/contrato" small />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small />
          {user && (
            <button onClick={handleSignOut} className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left">
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/40 z-[65] backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsMenuOpen(false)} />}

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen pb-20 pt-24 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-20 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
              <span className="font-label text-xs font-bold tracking-[0.3em] uppercase text-cyan-400">Canal Directo</span>
            </div>
            <h1 className="font-headline text-5xl md:text-8xl font-black text-white mb-6">Hablemos de su <span className="text-tertiary">Próximo Nivel</span></h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">Nuestro equipo de arquitectura digital está listo para transformar sus ideas en experiencias de alta fidelidad. <span className="text-tertiary font-bold block mt-4 animate-fade-in sm:inline sm:mt-0">Puede enviar su solicitud sin compromiso; no hay cargos por el envío de su propuesta.</span></p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Contact Form */}
            <div className="bg-surface-container-low p-8 md:p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden animate-fade-in delay-100">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary/10 rounded-full blur-[80px]"></div>
              <h3 className="font-headline text-3xl font-bold text-white mb-8">Enviar un mensaje</h3>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-4">Nombre Completo</label>
                    <input required type="text" placeholder="Ej. Juan Pérez" className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-6 py-4 text-white transition-all backdrop-blur-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-4">Correo Electrónico</label>
                    <input required type="email" placeholder="correo@empresa.com" className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-6 py-4 text-white transition-all backdrop-blur-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-4">Asunto del Proyecto</label>
                  <select className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-6 py-4 text-white transition-all backdrop-blur-xl appearance-none">
                    <option className="bg-[#0c1324]">Desarrollo Web / App</option>
                    <option className="bg-[#0c1324]">Implementación de IA</option>
                    <option className="bg-[#0c1324]">Consultoría Estratégica</option>
                    <option className="bg-[#0c1324]">Otro</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-4">¿Qué desea que construyamos?</label>
                    <textarea required rows={4} placeholder="Describa el software, app o sistema que tiene en mente..." className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-6 py-4 text-white transition-all backdrop-blur-xl resize-none"></textarea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-4">Sobre su Empresa o Negocio</label>
                    <textarea required rows={4} placeholder="Cuéntenos qué hace su empresa y cuáles son sus objetivos..." className="w-full bg-white/5 border border-white/10 focus:border-tertiary/50 outline-none rounded-2xl px-6 py-4 text-white transition-all backdrop-blur-xl resize-none"></textarea>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden transition-all duration-500">
                  <button type="button" onClick={() => setWantsCredit(!wantsCredit)} className="w-full px-6 py-5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${wantsCredit ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/5 text-slate-500'}`}>
                        <span className="material-symbols-outlined text-xl">payments</span>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Opciones de Financiamiento</p>
                        <h4 className="text-white font-bold">Crédito</h4>
                      </div>
                    </div>
                    <span className={`material-symbols-outlined transition-transform duration-300 ${wantsCredit ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`}>expand_more</span>
                  </button>
                  <div className={`px-6 transition-all duration-500 ease-in-out ${wantsCredit ? 'max-h-[500px] pb-6 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <div className="space-y-6 pt-2">
                      <div className="p-4 bg-tertiary/5 border border-tertiary/10 rounded-2xl">
                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-sm">info</span> Información de Pago (USD)</p>
                        <p className="text-slate-400 text-xs leading-relaxed">Sneyder Studio le permite financiar su contrato con un <span className="text-white font-bold">5% de interés fijo</span> sobre el monto total de contado.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mx-1">Presupuesto ($ USD)</label>
                          <input type="number" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} placeholder="Ej. 1500" className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-white focus:border-tertiary outline-none text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mx-1">Plazo de Pago</label>
                          <select value={creditMonths} onChange={(e) => setCreditMonths(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/5 rounded-xl py-3 px-4 text-white focus:border-tertiary outline-none text-sm appearance-none">
                            {[6, 7, 8, 9, 10, 11, 12].map(m => (<option key={m} value={m} className="bg-[#0c1324]">{m} Meses</option>))}
                          </select>
                        </div>
                      </div>
                      {parseFloat(estimatedBudget) > 0 && (
                        <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
                          <div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Cuota Mensual</p><p className="text-xl font-headline font-black text-tertiary">${calculateMonthlyPayment()} USD</p></div>
                          <div className="text-right"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total + Interés</p><p className="text-xs font-bold text-white">${(parseFloat(estimatedBudget) * 1.05).toFixed(2)} USD</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button disabled={formStatus === 'sending'} className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 ${formStatus === 'success' ? 'bg-green-500 text-white' : 'bg-tertiary text-on-tertiary hover:brightness-110 shadow-[0_15px_40px_rgba(47,217,244,0.2)]'}`}>
                  {formStatus === 'idle' && <>Enviar pedido <span className="material-symbols-outlined text-sm">send</span></>}
                  {formStatus === 'sending' && <><span className="w-4 h-4 border-2 border-on-tertiary border-t-transparent animate-spin rounded-full"></span>Enviando...</>}
                  {formStatus === 'success' && <>¡Pedido Enviado! <span className="material-symbols-outlined text-sm">check_circle</span></>}
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-12 animate-fade-in delay-200">
              <div className="space-y-8">
                <h3 className="font-headline text-3xl font-bold text-white tracking-tight">Atención Premium</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  <ContactCard icon="mail" title="Correo Electrónico" value={adminSettings?.contact_email || "sneyderestudio@gmail.com"} href={`mailto:${adminSettings?.contact_email || "sneyderestudio@gmail.com"}`} />
                  <ContactCard icon="chat" title="WhatsApp Business" value="Chat en Vivo" href={adminSettings?.whatsapp || "https://wa.me/50672065581"} />
                  <ContactCard icon="person_search" title="LinkedIn Oficial" value="Sneyder Studio" href={adminSettings?.linkedin_url || "https://www.linkedin.com/in/sneyder-studio-2b84793b7"} />
                  <ContactCard icon="location_on" title="Sede Central" value={adminSettings?.address || "San José, Costa Rica"} />
                </div>
              </div>
              <div className="pt-12 border-t border-white/5 space-y-6">
                <Link href="/entrega" className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-tertiary/10 border border-tertiary/20 rounded-[1.5rem] text-tertiary font-bold uppercase tracking-widest text-[10px] hover:bg-tertiary/20 transition-all shadow-lg group">
                  <span className="material-symbols-outlined text-lg group-hover:scale-110">inventory_2</span>
                  Protocolo de Entrega del Producto
                </Link>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-32 py-12 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">© 2024 Sneyder Studio • Premium Digital Solutions</p>
            <div className="flex gap-8">
              <Link href="/" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">LinkedIn</Link>
              <Link href="/" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">GitHub</Link>
              <Link href="/contacto" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">Contáctenos</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Modals */}
      {showModal && <SuccessModal onClose={() => setShowModal(false)} />}
      {showLoginPrompt && <LoginPromptModal onCancel={() => setShowLoginPrompt(false)} onAccept={() => { setShowLoginPrompt(false); setShowAuthModal(true); }} />}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialView={authView} setView={setAuthView} />
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface/90 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8"><span className="material-symbols-outlined text-green-500 text-4xl">check_circle</span></div>
        <h3 className="font-headline text-2xl font-bold text-white mb-6">Propuesta Enviada</h3>
        <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold uppercase tracking-widest text-[10px]">Entendido</button>
      </div>
    </div>
  );
}

function LoginPromptModal({ onCancel, onAccept }: { onCancel: () => void; onAccept: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-surface/90 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md text-center">
        <h3 className="font-headline text-2xl font-bold text-white mb-6">Inicio de Sesión Requerido</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cancelar</button>
          <button onClick={onAccept} className="py-4 bg-tertiary text-on-tertiary rounded-2xl font-bold uppercase tracking-widest text-[10px]">Acceder</button>
        </div>
      </div>
    </div>
  );
}

function AuthModal({ isOpen, onClose, initialView, setView }: any) {
  const [formData, setFormData] = useState({ email: '', password: '', managerName: '', companyName: '', whatsapp: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (initialView === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, { displayName: formData.managerName });
        await setDoc(doc(db, "profiles", userCredential.user.uid), { id: userCredential.user.uid, email: formData.email, manager_name: formData.managerName });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      onClose();
    } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface/90 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <input type="password" placeholder="Contraseña" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          <button type="submit" className="w-full bg-tertiary py-4 rounded-xl font-bold uppercase tracking-widest text-xs">{initialView === 'login' ? 'Entrar' : 'Registrar'}</button>
        </form>
      </div>
    </div>
  );
}

function ContactCard({ icon, title, value, href }: any) {
  const content = (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-6 hover:bg-white/10 transition-all flex-1">
      <div className="w-14 h-14 bg-cyan-400/10 rounded-2xl flex items-center justify-center shrink-0 border border-cyan-400/20"><span className="material-symbols-outlined text-cyan-400 text-3xl">{icon}</span></div>
      <div><h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{title}</h4><p className="text-white font-bold">{value}</p></div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="flex">{content}</a> : content;
}

function NavItem({ icon, label, href, active, small }: any) {
  return (
    <Link href={href} className={`flex items-center gap-4 px-4 py-3 transition-colors ${active ? "text-cyan-400 font-bold bg-slate-800/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"} ${small ? "text-sm" : ""}`}>
      <span className="material-symbols-outlined">{icon}</span><span>{label}</span>
    </Link>
  );
}
