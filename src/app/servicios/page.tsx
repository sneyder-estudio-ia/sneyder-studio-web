"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getCMSData } from "@/lib/cms";
import { getAdminSettings } from "@/lib/settings";

const ADMIN_EMAIL = "sneyder23081994@gmail.com";

export default function ServicesPage() {
  const [data, setData] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showLogoViewer, setShowLogoViewer] = useState(false);
  const [viewerImage, setViewerImage] = useState("");

  const [adminSettings, setAdminSettings] = useState<any>(null);

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

  if (!data) return (
    <div className="bg-background min-h-screen flex items-center justify-center text-center px-6">
       <div className="flex flex-col items-center gap-6">
          <div className="relative w-32 h-32 mb-4">
             <Image 
               src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
               alt="Sneyder Studio Logo"
               fill
               className="object-contain animate-pulse"
             />
          </div>
          <div className="w-16 h-1 bg-tertiary/20 rounded-full overflow-hidden relative">
             <div className="absolute inset-0 bg-tertiary animate-loading-bar"></div>
          </div>
          <span className="text-tertiary font-bold tracking-[0.5em] uppercase text-[10px]">Cargando servicios de Sneyder Studio...</span>
       </div>
    </div>
  );

  return (
    <div className="text-on-background selection:bg-tertiary/30 selection:text-tertiary min-h-screen bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-60 bg-[#0c1324] border-b border-slate-800 flex justify-between items-center px-6 h-16 shadow-[0px_2px_10px_rgba(0,0,0,0.5)] transition-all duration-300 ${isMenuOpen ? "md:pl-64 lg:pl-80" : "pl-0"}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-cyan-400 hover:bg-slate-800 p-1 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link href="/" className="h-10 w-auto relative cursor-pointer hover:scale-105 transition-all bg-white/5 rounded-xl border border-white/10 overflow-hidden p-1.5 shadow-lg group">
            <Image 
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              width={140}
              height={28}
              className="h-full w-auto object-contain group-hover:brightness-110"
            />
          </Link>
        </div>
        
        {user ? (
          <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container border border-cyan-400/30">
            <Image 
              alt="User Avatar" 
              src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuCO8RUk1wD7WV7O7IKZ_NBnLhlsnuVdHeC9x_CyLRsEpavDT9Qu9rC4-F4JAFIMwExYTNXtPsW04RAgXxe2vZ_1xgd0Wpqlz62JTPKFItouFbiVzuuvaA3Jr4zodwxrF3k5SScHvPKbmmQvNvCnMsjMY1m7yzSHBq-NVdD2N3qaTUfNHCwYii6gD_VVnTZrwbjzB-EmuUn_Y4QYasiBWkPdcLN2PPRgr4tyrGNvjDYnaz1WSLw73itY4B6zTZAWRKzhDVirP2Wyrcw"}
              width={32}
              height={32}
            />
          </div>
        ) : (
          <Link 
            href="/"
            className="bg-tertiary/10 border border-tertiary/50 text-tertiary px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all"
          >
            Acceder
          </Link>
        )}
      </header>

      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 z-[70] h-[100dvh] w-80 bg-[#0c1324] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out font-headline text-slate-200 overflow-hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 flex flex-col gap-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
              {user ? (
                <Image 
                  alt="User Profile Avatar" 
                  src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBH_btGfHFWWHfApXWyzqu90p_2NBQZttyesQz6QlhsHASGNW17CG8J-xx8fF8jKJaPPfgtyTfolOPvAFnGM4gcX9ci9UmYI9bOziFWipLW0G_G3gtXXyBt4wq-ItmBSk5uKJraqJBEUPuv_ArRh18s3sVoJsjbr7ok9twnXcNobC6z0JiJlozlUbb6eL6KTjktk58yD7_vE1e63rOTk-xD7njqMy5SJaVxWwWikP2LOrMVuGfMcVTru4Wiih7wq_IOZ1WRsOIvKt0"}
                  width={48}
                  height={48}
                />
              ) : (
                <span className="material-symbols-outlined text-slate-500 text-3xl">person</span>
              )}
            </div>
            <div>
              <p className="font-bold text-white truncate max-w-[150px]">
                {userProfile?.manager_name?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || "Visitante"}
              </p>
              <p className="text-xs text-cyan-400 uppercase tracking-widest">
                {user ? "Premium Account" : "Modo Invitado"}
              </p>
            </div>
          </div>
          <Link 
            href="/"
            className="relative w-full h-16 mb-8 cursor-pointer hover:scale-[1.02] transition-all bg-white/5 rounded-2xl border border-white/10 overflow-hidden p-3 shadow-xl group"
          >
            <Image 
              src="https://i.postimg.cc/kXw7hpYj/Picsart-25-04-01-13-42-29-671.png"
              alt="Sneyder Studio"
              fill
              className="object-contain object-left group-hover:brightness-110"
            />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          <NavItem icon="home" label="Inicio" href="/" />
          <NavItem icon="account_circle" label="Perfil de usuario" href="/profile" />
          {user?.email === ADMIN_EMAIL && <NavItem icon="settings" label="Administración" href="/admin" />}
          <NavItem icon="shopping_bag" label="Mis pedidos" href="/mis-pedidos" />
          <NavItem icon="bolt" label="Servicios" href="/servicios" active />
          <NavItem icon="psychology" label="Modelo de IA" href="/ia-models" />
          <NavItem icon="mail" label="Contacto" href="/contacto" />
          
          <div className="pt-6 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Legal</div>
          <NavItem icon="policy" label="Política y condiciones" href="/contrato" small />
          <NavItem icon="gavel" label="Términos de servicio" href="/contrato" small />
          <NavItem icon="description" label="Contrato de servicios" href="/contrato" small />
          
          {user && (
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors w-full text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[65] backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen pb-20 pt-24 ${isMenuOpen ? "pl-0 lg:pl-80" : "pl-0"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(47,217,244,0.8)]"></span>
              <span className="font-label text-xs font-bold tracking-[0.3em] uppercase text-cyan-400">Nuestras Soluciones</span>
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-black text-white mb-6">
              Impulso <span className="text-tertiary">Estratégico</span> Digital
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
              En Sneyder Studio diseñamos el puente entre su negocio físico y el infinito mercado virtual, dominando todas las plataformas.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.services.map((service: any, index: number) => (
              <div key={index} className="bg-surface-container-low p-8 rounded-2xl border border-white/5 hover:border-tertiary/30 transition-all group relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-tertiary/5 rounded-full blur-3xl group-hover:bg-tertiary/10 transition-all"></div>
                <span className="material-symbols-outlined text-tertiary mb-6 text-5xl">{service.icon}</span>
                <h3 className="font-headline text-2xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  {service.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(service.tags || service.items || []).map((tag: any, i: number) => (
                    <span key={i} className="px-3 py-1 bg-white/5 text-cyan-400 text-[10px] font-bold uppercase rounded-full border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Additional AI Service Card */}
            <div className="bg-surface-container-low p-8 rounded-2xl border border-white/5 hover:border-tertiary/30 transition-all group relative overflow-hidden lg:col-span-1">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
                <span className="material-symbols-outlined text-purple-400 mb-6 text-5xl">smart_toy</span>
                <h3 className="font-headline text-2xl font-bold text-white mb-4">IA para su Negocio</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Integramos asistentes inteligentes adaptados a su modelo de preferencia, optimizando la interacción con sus clientes en tiempo real.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/5 text-purple-400 text-[10px] font-bold uppercase rounded-full border border-white/5">Asistente Local</span>
                  <span className="px-3 py-1 bg-white/5 text-purple-400 text-[10px] font-bold uppercase rounded-full border border-white/5">Modelo a Medida</span>
                </div>
            </div>
          </div>

          {/* New Section: Why Choose Us */}
          <section className="mt-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/5">
                <Image 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8g8ZfR7uXXfys5NEokNbCaHjaLz0CADi1gowHp8gb-7noJlMRljr3-mVbZP_I-FVv3sRqDQK3aUa5Au4M0zWp8e2VanLwjjeZJ5m-UdWR6Y_vkXc6icAl_JAHpeRdfxzoFh_l7NLP2HPGWifyLXpyzvHNdvwNxzqrG0G-7sQ_nqTF04XpUr-WTtef4vCakefTuACtn0qQkrMKl1DppbSiA4lIgomSkxKkOJcfpwpwpLZwLxtvWyURUB43Z_sqTjS9i8T_6t3bll0"
                  alt="Business Growth"
                  fill
                  className="object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              </div>
              <div className="space-y-8">
                <div>
                  <h2 className="font-headline text-4xl font-bold text-white mb-6 tracking-tight">Prosperidad en el Mercado Global</h2>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    Ayudamos a las empresas a expandir su presencia desde su local físico hacia el vasto entorno digital para dominar su industria.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center shrink-0 border border-cyan-400/20">
                      <span className="material-symbols-outlined text-cyan-400">phone_iphone</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Presencia Móvil Total</h4>
                      <p className="text-sm text-slate-500">Apps nativas para Android e iOS que conectan con su audiencia en cualquier lugar.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center shrink-0 border border-tertiary/20">
                      <span className="material-symbols-outlined text-tertiary">monitor</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">Sistemas de Escritorio</h4>
                      <p className="text-sm text-slate-500">Software robusto para Windows y Linux diseñado para la eficiencia operativa.</p>
                    </div>
                  </div>
                </div>

                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all shadow-xl"
                >
                  Impulsar mi Negocio <span className="material-symbols-outlined">trending_up</span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-32 py-12 border-t border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-bold">© 2024 Sneyder Studio • Premium Digital Solutions</p>
            <div className="flex gap-8">
              <Link href={adminSettings?.linkedin_url || "https://www.linkedin.com/in/sneyder-studio-2b84793b7"} target="_blank" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">LinkedIn</Link>
              <Link href={adminSettings?.github_url || "#"} target="_blank" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">GitHub</Link>
              <Link href="/contacto" className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest">Contáctenos</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-[#0c1324]/90 backdrop-blur-xl border-t border-slate-800">
        <BottomNavItem icon="home" label="Inicio" href="/" />
        <BottomNavItem icon="bolt" label="Servicios" href="/servicios" active />
        <BottomNavItem icon="person" label="Perfil" href="/profile" />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, href, active = false, small = false, className = "" }: { icon: string; label: string; href: string; active?: boolean; small?: boolean; className?: string }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
        active 
          ? "text-cyan-400 font-bold bg-slate-800/50" 
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      } ${small ? "text-sm" : ""} ${className}`}
    >
      <span className={`material-symbols-outlined ${small ? "text-base" : ""}`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function BottomNavItem({ icon, label, href, active = false }: { icon: string; label: string; href: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex flex-col items-center justify-center cursor-pointer transition-colors ${active ? "text-cyan-400 scale-110" : "text-slate-500 hover:text-cyan-200"}`}>
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-[10px] font-medium mt-0.5">{label}</span>
    </Link>
  );
}
